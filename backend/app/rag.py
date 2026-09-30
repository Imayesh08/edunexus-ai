from pathlib import Path
from app.config import settings

class RAGService:
    # Uses ChromaDB for retrieval and an API-based LLM for grounded answers.
    def _setup(self):
        if not settings.openai_api_key:
            raise RuntimeError("Set OPENAI_API_KEY in backend/.env first.")
        import chromadb
        from openai import OpenAI
        Path(settings.rag_persist_directory).mkdir(parents=True, exist_ok=True)
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.collection = chromadb.PersistentClient(path=settings.rag_persist_directory).get_or_create_collection("course_materials")

    def add_documents(self, docs):
        self._setup()
        ids, texts, metas, vectors = [], [], [], []
        for i, doc in enumerate(docs):
            text = doc["text"].strip()
            if not text: continue
            emb = self.client.embeddings.create(model=settings.openai_embedding_model, input=text[:8000])
            ids.append(str(doc.get("id", f"doc-{i}")))
            texts.append(text)
            metas.append({"course": doc.get("course", "General"), "source": doc.get("source", "faculty notes")})
            vectors.append(emb.data[0].embedding)
        if ids: self.collection.upsert(ids=ids, documents=texts, metadatas=metas, embeddings=vectors)
        return {"indexed":len(ids)}

    def answer(self, question, course):
        self._setup()
        if self.collection.count() == 0:
            return {"answer":"The knowledge base is empty. Add approved course notes first.",
                    "sources":[], "grounded":False}
        emb = self.client.embeddings.create(model=settings.openai_embedding_model, input=question)
        result = self.collection.query(query_embeddings=[emb.data[0].embedding],
            n_results=min(4,self.collection.count()), where={"course":course},
            include=["documents","metadatas"])
        docs = (result.get("documents") or [[]])[0]
        metas = (result.get("metadatas") or [[]])[0]
        if not docs:
            return {"answer":f"No indexed notes found for course '{course}'.",
                    "sources":[], "grounded":False}
        context = "\n\n".join(f"Source {i+1}: {d}" for i,d in enumerate(docs))
        completion = self.client.chat.completions.create(
            model=settings.openai_model, temperature=0.2,
            messages=[
                {"role":"system","content":"You are EduNexus AI, a careful academic tutor. Answer only from supplied course context. If context is insufficient, say so; do not invent facts."},
                {"role":"user","content":f"Course: {course}\nContext:\n{context}\n\nQuestion: {question}"}
            ])
        return {"answer":completion.choices[0].message.content or "",
                "sources":[{"source":m.get("source","unknown"),"excerpt":d[:400]} for d,m in zip(docs,metas)],
                "grounded":True}
