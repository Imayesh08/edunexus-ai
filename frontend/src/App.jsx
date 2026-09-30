import { useEffect, useMemo, useState } from 'react'
import { Activity, BookOpen, BrainCircuit, CalendarDays, CheckCircle2, ChevronRight, CircleHelp, GraduationCap, LayoutDashboard, Menu, MessageSquareText, Search, ShieldAlert, Sparkles, Users, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const sampleTopics = [
  { topic: 'Principal Component Analysis', score: 42 },
  { topic: 'Random Forest', score: 76 },
  { topic: 'Model Evaluation', score: 88 },
  { topic: 'Feature Engineering', score: 57 },
]
const demoStudents = [
  { student_id: 'DEMO001', name: 'Aarav Demo', course: 'AI Systems Engineering', attendance_pct: 92, internal_marks: 84, quiz_average: 88, assignment_score: 91, previous_gpa: 8.4, lms_activity: 80, risk_level: 'low' },
  { student_id: 'DEMO002', name: 'Bhavya Demo', course: 'AI Systems Engineering', attendance_pct: 72, internal_marks: 61, quiz_average: 58, assignment_score: 67, previous_gpa: 6.8, lms_activity: 55, risk_level: 'medium' },
  { student_id: 'DEMO003', name: 'Charan Demo', course: 'AI Systems Engineering', attendance_pct: 48, internal_marks: 38, quiz_average: 32, assignment_score: 45, previous_gpa: 4.8, lms_activity: 22, risk_level: 'high' },
]
function riskClass(level='medium') { return `risk risk-${level.toLowerCase()}` }
function App() {
  const [page, setPage] = useState('Overview')
  const [students, setStudents] = useState(demoStudents)
  const [apiStatus, setApiStatus] = useState('checking')
  const [notice, setNotice] = useState('')
  const [topicScores, setTopicScores] = useState(sampleTopics)
  const [gapResult, setGapResult] = useState(null)
  const [planResult, setPlanResult] = useState(null)
  const [question, setQuestion] = useState('')
  const [course, setCourse] = useState('AI Systems Engineering')
  const [tutorAnswer, setTutorAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [studentForm, setStudentForm] = useState({student_id:'',name:'',course:'AI Systems Engineering',attendance_pct:80,internal_marks:70,quiz_average:70,assignment_score:70,previous_gpa:7,lms_activity:60})
  const [intervention, setIntervention] = useState({student_id:'DEMO003',faculty_id:'FAC001',action:'Schedule a 1:1 academic support meeting',outcome:'planned',notes:''})
  const [showAdd, setShowAdd] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  useEffect(() => {
    fetch(`${API}/health`).then(r=>r.json()).then(d=>setApiStatus(d.risk_model_loaded?'connected':'model missing')).catch(()=>setApiStatus('offline'))
    fetch(`${API}/api/students`).then(r=>r.json()).then(d=>{if(Array.isArray(d.students)&&d.students.length) setStudents(d.students)}).catch(()=>{})
  }, [])
  const highRisk = students.filter(s=>s.risk_level==='high').length
  const averageAttendance = students.length ? Math.round(students.reduce((a,s)=>a+Number(s.attendance_pct||0),0)/students.length) : 0
  async function post(path, body) {
    const response = await fetch(`${API}${path}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    const data = await response.json()
    if(!response.ok) throw new Error(data.detail || `Request failed (${response.status})`)
    return data
  }
  async function analyzeGaps() {
    setLoading(true); setNotice('')
    try { const data = await post('/api/learning-gaps',{student_id:'DEMO003',topic_scores:topicScores}); setGapResult(data); setNotice('Learning gaps analyzed by EduNexus AI.') }
    catch(e) { setNotice(`${e.message}. Make sure the FastAPI backend is running.`) }
    finally { setLoading(false) }
  }
  async function makePlan() {
    setLoading(true); setNotice('')
    try { setPlanResult(await post('/api/recommendations',{student_id:'DEMO003',available_hours_per_week:6,topic_scores:topicScores})); setNotice('Personalized study plan generated.') }
    catch(e) { setNotice(`${e.message}. Make sure the FastAPI backend is running.`) }
    finally { setLoading(false) }
  }
  async function askTutor(e) {
    e.preventDefault(); if(!question.trim()) return
    setLoading(true); setTutorAnswer(null); setNotice('')
    try { setTutorAnswer(await post('/api/tutor/ask',{course,question})); }
    catch(e) { setNotice(`${e.message}. Configure OPENAI_API_KEY and add course notes to use the RAG tutor.`) }
    finally { setLoading(false) }
  }
  async function addStudent(e) {
    e.preventDefault(); setLoading(true)
    try {
      const data = await post('/api/students',{...studentForm,attendance_pct:Number(studentForm.attendance_pct),internal_marks:Number(studentForm.internal_marks),quiz_average:Number(studentForm.quiz_average),assignment_score:Number(studentForm.assignment_score),previous_gpa:Number(studentForm.previous_gpa),lms_activity:Number(studentForm.lms_activity)})
      setStudents(prev=>[data.student,...prev]); setShowAdd(false); setNotice('Student record saved.')
    } catch(e) { setNotice(e.message) } finally { setLoading(false) }
  }
  async function saveIntervention(e) {
    e.preventDefault(); setLoading(true)
    try { await post('/api/interventions',intervention); setNotice('Faculty intervention recorded. Human review remains required.') }
    catch(e) { setNotice(`${e.message}. Start MongoDB and the backend first.`) } finally { setLoading(false) }
  }
  const nav = [
    ['Overview',LayoutDashboard],['Students',Users],['Learning Gaps',BrainCircuit],['Study Plans',CalendarDays],['AI Tutor',MessageSquareText],['Faculty Support',ShieldAlert]
  ]
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'open':''}`}>
      <div className="brand"><div className="brand-mark"><GraduationCap size={23}/></div><div><strong>EduNexus<span>AI</span></strong><small>PERSONALIZED LEARNING</small></div><button className="icon-btn close-menu" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMobileMenu(false)}}><Icon size={18}/><span>{label}</span>{label==='Faculty Support'&&<i>{highRisk}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-icon"><CircleHelp size={18}/></div><div><b>Need help?</b><small>Explore the API docs</small><a href={`${API}/docs`} target="_blank" rel="noreferrer">Open documentation <ChevronRight size={12}/></a></div></div>
      <div className="profile"><div className="avatar">IM</div><div><b>Imayy</b><small>Project workspace</small></div><span className="online-dot"/></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn menu-btn" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{page}</b></div><div className="top-actions"><span className={`api-pill ${apiStatus==='connected'?'good':apiStatus==='offline'?'bad':''}`}><i/>{apiStatus==='connected'?'API connected':apiStatus==='model missing'?'Model missing':apiStatus==='offline'?'API offline':'Checking API'}</span><div className="avatar">IM</div></div></header>
      <div className="content">
        <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> AI-POWERED LEARNING INTELLIGENCE</div><h1>{page==='Overview'?'Good morning, Imayy.':page}</h1><p>{page==='Overview'?'A clearer picture of student progress starts here.':'Monitor progress, identify support needs, and personalize learning.'}</p></div><button className="primary-btn" onClick={()=>setShowAdd(true)}>＋ Add student</button></div>
        {notice&&<div className="notice"><Activity size={16}/><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
        {page==='Overview'&&<><div className="metric-grid">
          <Metric icon={Users} tint="blue" label="Students tracked" value={students.length} sub="Records available in workspace"/>
          <Metric icon={ShieldAlert} tint="orange" label="High-risk flags" value={highRisk} sub="Require faculty review"/>
          <Metric icon={Activity} tint="green" label="Average attendance" value={`${averageAttendance}%`} sub="Across displayed students"/>
          <Metric icon={BrainCircuit} tint="purple" label="Learning topics" value={topicScores.length} sub="Currently in demo analysis"/>
        </div><div className="dashboard-grid"><section className="panel students-panel"><div className="panel-head"><div><h2>Student overview</h2><p>Recent records and support indicators</p></div><button className="text-btn" onClick={()=>setPage('Students')}>View all <ChevronRight size={15}/></button></div><StudentTable students={students.slice(0,5)} onSelect={s=>{setIntervention(v=>({...v,student_id:s.student_id}));setPage('Faculty Support')}}/></section><section className="panel"><div className="panel-head"><div><h2>Topic mastery</h2><p>Latest diagnostic scores</p></div><span className="subtle-tag">Demo data</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={topicScores} layout="vertical" margin={{left:6,right:12,top:4,bottom:4}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8edf4"/><XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:'#8290a5'}}/><YAxis dataKey="topic" type="category" width={112} tick={{fontSize:10,fill:'#65738a'}}/><Tooltip/><Bar dataKey="score" fill="#5867df" radius={[0,5,5,0]} barSize={18}/></BarChart></ResponsiveContainer></div><button className="secondary-btn full-btn" onClick={()=>setPage('Learning Gaps')}>Explore learning gaps <ChevronRight size={15}/></button></section></div><div className="bottom-grid"><section className="panel feature-card"><div className="feature-icon violet"><BrainCircuit size={21}/></div><div><h3>Understand learning gaps</h3><p>Find topics that need more practice and identify areas of strength.</p><button className="text-btn" onClick={()=>setPage('Learning Gaps')}>Analyze topics <ChevronRight size={15}/></button></div></section><section className="panel feature-card"><div className="feature-icon mint"><MessageSquareText size={21}/></div><div><h3>Ask the course tutor</h3><p>Get answers grounded in faculty-approved course materials.</p><button className="text-btn" onClick={()=>setPage('AI Tutor')}>Open AI tutor <ChevronRight size={15}/></button></div></section></div></>}
        {page==='Students'&&<section className="panel"><div className="panel-head"><div><h2>Student records</h2><p>Demo records are synthetic and should not be treated as real student data.</p></div><button className="primary-btn" onClick={()=>setShowAdd(true)}>＋ Add student</button></div><StudentTable students={students} onSelect={s=>{setIntervention(v=>({...v,student_id:s.student_id}));setPage('Faculty Support')}}/></section>}
        {page==='Learning Gaps'&&<section className="panel"><div className="panel-head"><div><h2>Topic-wise learning gaps</h2><p>Scores under 60 are marked as weak topics in this prototype.</p></div><button className="primary-btn" disabled={loading} onClick={analyzeGaps}>{loading?'Analyzing…':'Analyze gaps'}</button></div><div className="topic-editor">{topicScores.map((t,i)=><div className="topic-row" key={t.topic}><div><b>{t.topic}</b><small>{t.score<60?'Needs support':t.score>=80?'Strong mastery':'Practice recommended'}</small></div><input type="range" min="0" max="100" value={t.score} onChange={e=>setTopicScores(prev=>prev.map((x,j)=>i===j?{...x,score:Number(e.target.value)}:x))}/><strong>{t.score}%</strong></div>)}</div>{gapResult&&<div className="result-grid"><ResultList title="Weak topics" items={gapResult.weak_topics}/><ResultList title="Strong topics" items={gapResult.strong_topics}/><ResultList title="Topics to practice" items={gapResult.topics_to_practice}/></div>}</section>}
        {page==='Study Plans'&&<section className="panel"><div className="panel-head"><div><h2>Personalized weekly plan</h2><p>Prioritizes lower-scoring topics; faculty can adapt the suggested plan.</p></div><button className="primary-btn" disabled={loading} onClick={makePlan}>{loading?'Generating…':'Generate study plan'}</button></div>{planResult?<div className="plan-list">{planResult.study_plan.map((t,i)=><div className="plan-item" key={t.topic}><div className="plan-number">{String(i+1).padStart(2,'0')}</div><div className="plan-copy"><b>{t.topic}</b><p>{t.activity}</p><small>Current score: {t.current_score ?? 'Diagnostic needed'}%</small></div><div className="hours">{t.hours} h<small>per week</small></div></div>)}</div>:<EmptyState title="Your plan starts with a diagnostic" body="Generate a plan from the current topic scores to see a prioritized weekly schedule."/>}</section>}
        {page==='AI Tutor'&&<div className="tutor-layout"><section className="panel tutor-panel"><div className="tutor-hero"><div className="feature-icon violet"><Sparkles size={23}/></div><div><h2>EduNexus AI Tutor</h2><p>Course-aware help, grounded in indexed learning materials.</p></div></div><form onSubmit={askTutor} className="tutor-form"><label>Course name<input value={course} onChange={e=>setCourse(e.target.value)} required/></label><label>Your question<textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a question about your course…" rows="4" required/></label><button className="primary-btn" disabled={loading}>{loading?'Thinking…':'Ask tutor'} <ChevronRight size={16}/></button></form>{tutorAnswer&&<div className="answer-box"><div className="answer-label"><Sparkles size={15}/> TUTOR RESPONSE {tutorAnswer.grounded&&<span className="subtle-tag">Grounded in course notes</span>}</div><p>{tutorAnswer.answer}</p>{tutorAnswer.sources?.map((s,i)=><details key={i}><summary>Source: {s.source}</summary><small>{s.excerpt}</small></details>)}</div>}<div className="privacy-note">The tutor should answer from approved indexed course notes. If the knowledge base is empty or the API key is missing, configure the backend first.</div></section><section className="panel side-note"><BookOpen size={22}/><h3>How RAG works</h3><ol><li>Faculty adds approved course notes.</li><li>The system creates embeddings and indexes the notes.</li><li>Your question retrieves relevant passages.</li><li>The LLM forms an answer from those passages.</li></ol><a href={`${API}/docs`} target="_blank" rel="noreferrer">Open API docs <ChevronRight size={14}/></a></section></div>}
        {page==='Faculty Support'&&<div className="faculty-grid"><section className="panel"><div className="panel-head"><div><h2>Faculty intervention workflow</h2><p>Log a follow-up action for human review.</p></div></div><form className="stack-form" onSubmit={saveIntervention}><label>Student ID<input value={intervention.student_id} onChange={e=>setIntervention({...intervention,student_id:e.target.value})} required/></label><label>Faculty ID<input value={intervention.faculty_id} onChange={e=>setIntervention({...intervention,faculty_id:e.target.value})} required/></label><label>Suggested action<textarea rows="3" value={intervention.action} onChange={e=>setIntervention({...intervention,action:e.target.value})} required/></label><label>Status<select value={intervention.outcome} onChange={e=>setIntervention({...intervention,outcome:e.target.value})}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label><label>Notes<textarea rows="2" value={intervention.notes} onChange={e=>setIntervention({...intervention,notes:e.target.value})}/></label><button className="primary-btn" disabled={loading}>{loading?'Saving…':'Record intervention'}</button></form><div className="privacy-note">Risk labels are decision-support signals only. A faculty member must verify records and decide what support is appropriate.</div></section><section className="panel"><div className="panel-head"><div><h2>Students needing follow-up</h2><p>Prototype list from currently loaded records</p></div></div><StudentTable students={students.filter(s=>['medium','high'].includes(s.risk_level))} onSelect={s=>setIntervention(v=>({...v,student_id:s.student_id}))}/></section></div>}
      </div>
      <footer>EduNexus AI <span>•</span> Academic decision support prototype <span className="footer-right">Human review required for risk and intervention decisions</span></footer>
    </main>
    {showAdd&&<div className="modal-backdrop" onClick={()=>setShowAdd(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="panel-head"><div><h2>Add student record</h2><p>Use synthetic data while developing this prototype.</p></div><button className="icon-btn" onClick={()=>setShowAdd(false)}><X size={18}/></button></div><form className="form-grid" onSubmit={addStudent}>{[['student_id','Student ID','text'],['name','Full name','text'],['course','Course','text'],['attendance_pct','Attendance %','number'],['internal_marks','Internal marks %','number'],['quiz_average','Quiz average %','number'],['assignment_score','Assignment score %','number'],['previous_gpa','Previous GPA (0–10)','number'],['lms_activity','LMS activity (0–100)','number']].map(([key,label,type])=><label key={key}>{label}<input type={type} min={type==='number'?0:undefined} max={key==='previous_gpa'?10:type==='number'?100:undefined} value={studentForm[key]} onChange={e=>setStudentForm({...studentForm,[key]:e.target.value})} required/></label>)}<div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setShowAdd(false)}>Cancel</button><button className="primary-btn" disabled={loading}>{loading?'Saving…':'Save student'}</button></div></form></div></div>}
  </div>
}
function Metric({icon:Icon,tint,label,value,sub}) { return <div className="panel metric"><div className={`metric-icon ${tint}`}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div> }
function StudentTable({students,onSelect}) { return <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>ATTENDANCE</th><th>INTERNAL</th><th>RISK INDICATOR</th><th></th></tr></thead><tbody>{students.map(s=><tr key={s.student_id} onClick={()=>onSelect(s)}><td><div className="student-name"><div className="mini-avatar">{(s.name||s.student_id).slice(0,1)}</div><div><b>{s.name||s.student_id}</b><small>{s.student_id} · {s.course}</small></div></div></td><td>{s.attendance_pct}%</td><td>{s.internal_marks}%</td><td><span className={riskClass(s.risk_level)}><i/>{s.risk_level||'unknown'}</span></td><td><ChevronRight size={16} className="row-arrow"/></td></tr>)}</tbody></table>{students.length===0&&<EmptyState title="No matching students" body="Student records will appear here when available."/>}</div> }
function ResultList({title,items=[]}) { return <div className="result-card"><h3>{title} <span>{items.length}</span></h3>{items.length?items.map(x=><div className="result-topic" key={x.topic}><span>{x.topic}</span><b>{x.score}%</b></div>):<small>No topics in this group.</small>}</div> }
function EmptyState({title,body}) { return <div className="empty-state"><div className="empty-icon"><BookOpen size={22}/></div><b>{title}</b><p>{body}</p></div> }
export default App
