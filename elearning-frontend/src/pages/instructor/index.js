import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, Spinner, StatusBadge, Modal } from '../../components/common';
import { instructorAPI, courseAPI, quizAPI } from '../../api';
import { BookOpen, Plus, Users, BarChart2, Eye, Trash2, Send, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Instructor Dashboard ──────────────────────────────────────────────────────
export const InstructorDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorAPI.getDashboard().then(r=>setData(r.data.data)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Dashboard"><Spinner/></DashboardLayout>;
  const { stats, courses=[], recentSubmissions=[] } = data || {};

  return (
    <DashboardLayout title="Instructor Dashboard">
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">Instructor Dashboard</h1>
        <p className="page-subtitle">Manage your courses and students</p>
      </div>

      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:'Total Courses',     value:stats?.totalCourses||0,     color:'var(--accent)' },
          { label:'Published',         value:stats?.publishedCourses||0,  color:'var(--green)' },
          { label:'Total Enrollments', value:stats?.totalEnrollments||0,  color:'var(--gold)' },
          { label:'Avg Rating',        value:stats?.avgRating||'—',       color:'var(--coral)' },
        ].map(({label,value,color})=>(
          <div className="stat-card" key={label}>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
            <h3 style={{ fontFamily:'var(--font-serif)' }}>My Courses</h3>
            <Link to="/instructor/create" className="btn btn-primary btn-sm"><Plus size={14}/>New</Link>
          </div>
          {courses.slice(0,5).map(c=>(
            <div key={c._id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize:13,fontWeight:500 }}>{c.title}</div>
                <div style={{ fontSize:11,color:'var(--text2)' }}>{c.enrollmentCount} enrolled</div>
              </div>
              <StatusBadge status={c.status}/>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--font-serif)',marginBottom:16 }}>Recent Submissions</h3>
          {recentSubmissions.length===0
            ? <p style={{ color:'var(--text3)',fontSize:13 }}>No submissions yet.</p>
            : recentSubmissions.slice(0,6).map(s=>(
              <div key={s._id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:500 }}>{s.student?.name}</div>
                  <div style={{ fontSize:11,color:'var(--text2)' }}>{s.quiz?.title}</div>
                </div>
                <span style={{ fontSize:14,fontWeight:600,color:s.passed?'var(--green)':'var(--red)' }}>{s.percentage}%</span>
              </div>
            ))
          }
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── My Courses List ────────────────────────────────────────────────────────────
export const InstructorCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = () => {
    setLoading(true);
    courseAPI.getMyCourses().then(r=>setCourses(r.data.data)).finally(()=>setLoading(false));
  };

  useEffect(()=>{ fetchCourses(); },[]);

  const handleSubmit = async (id) => {
    try { await courseAPI.submit(id); toast.success('Submitted for review!'); fetchCourses(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await courseAPI.delete(id); toast.success('Course deleted'); fetchCourses(); } catch {}
  };

  return (
    <DashboardLayout title="My Courses">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Manage your course catalog</p>
        </div>
        <Link to="/instructor/create" className="btn btn-primary"><Plus size={16}/>Create Course</Link>
      </div>

      {loading ? <Spinner/> : (
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Course</th><th>Status</th><th>Enrolled</th><th>Lectures</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {courses.map(c=>(
                <tr key={c._id}>
                  <td style={{ fontWeight:500 }}>{c.title}</td>
                  <td><StatusBadge status={c.status}/></td>
                  <td>{c.enrollmentCount}</td>
                  <td>{c.totalLectures||0}</td>
                  <td>
                    <div style={{ display:'flex',gap:8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>navigate(`/instructor/course/${c._id}`)}>
                        <Eye size={13}/>Manage
                      </button>
                      {c.status==='draft' && (
                        <button className="btn btn-primary btn-sm" onClick={()=>handleSubmit(c._id)}>
                          <Send size={13}/>Submit
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c._id)}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length===0 && <div className="empty-state"><BookOpen size={48}/><p>No courses yet</p></div>}
        </div>
      )}
    </DashboardLayout>
  );
};

// ── Create Course ──────────────────────────────────────────────────────────────
export const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title:'',description:'',category:'',level:'beginner',language:'English',price:0,tags:'',requirements:'',outcomes:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      const res = await courseAPI.create(fd);
      toast.success('Course created!');
      navigate(`/instructor/course/${res.data.data._id}`);
    } catch {
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Create Course">
      <div style={{ maxWidth:700 }}>
        <div style={{ marginBottom:24 }}>
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Fill in the details to publish your course</p>
        </div>
        <form onSubmit={handleSubmit} className="card" style={{ display:'flex',flexDirection:'column',gap:20 }}>
          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input className="form-input" placeholder="e.g. Complete JavaScript Course 2024"
              value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-input" rows={4} placeholder="What will students learn?"
              value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} required>
                <option value="">Select category</option>
                <option>Programming</option><option>Design</option><option>Business</option>
                <option>Data Science</option><option>Marketing</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-input" value={form.level} onChange={e=>setForm({...form,level:e.target.value})}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <input className="form-input" value={form.language} onChange={e=>setForm({...form,language:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹ 0 = free)</label>
              <input className="form-input" type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" placeholder="javascript, web dev, react" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Requirements (comma separated)</label>
            <input className="form-input" placeholder="Basic HTML, Computer with internet" value={form.requirements} onChange={e=>setForm({...form,requirements:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Learning Outcomes (comma separated)</label>
            <input className="form-input" placeholder="Build websites, Understand JS" value={form.outcomes} onChange={e=>setForm({...form,outcomes:e.target.value})}/>
          </div>
          <div style={{ display:'flex',gap:12 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Course'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={()=>navigate('/instructor/courses')}>Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

// ── Manage Course (Add Modules/Lectures) ──────────────────────────────────────
export const ManageCoursePage = () => {
  const { id } = useParams();
  const [course, setCourse]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modTitle, setModTitle]     = useState('');

  // Edit module state
  const [editModId, setEditModId]   = useState(null);
  const [editModTitle, setEditModTitle] = useState('');

  // Add lecture modal
  const [showLecModal, setShowLecModal] = useState(false);
  const [activeModId, setActiveModId]   = useState(null);
  const [lecForm, setLecForm] = useState({ title:'', description:'', isFree:false, videoUrl:'', videoType:'url' });
  const [videoFile, setVideoFile]   = useState(null);

  // Edit lecture state
  const [editLec, setEditLec]       = useState(null); // { modId, lec }
  const [editLecForm, setEditLecForm] = useState({ title:'', description:'', isFree:false, videoUrl:'' });

  const fetchCourse = () => {
    courseAPI.getOne(id).then(r=>setCourse(r.data.data)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetchCourse(); },[id]);

  // ── Add module ──────────────────────────────────────────────────────────────
  const addModule = async () => {
    if (!modTitle.trim()) return;
    try {
      await courseAPI.addModule(id, { title: modTitle });
      setModTitle(''); fetchCourse(); toast.success('Module added!');
    } catch {}
  };

  // ── Save module title edit ──────────────────────────────────────────────────
  const saveModuleEdit = async (modId) => {
    if (!editModTitle.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}/modules/${modId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: editModTitle }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Module updated!');
        setEditModId(null);
        fetchCourse();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch { toast.error('Update failed'); }
  };

  // ── Add lecture ─────────────────────────────────────────────────────────────
  const addLecture = async () => {
    if (!lecForm.title.trim()) { toast.error('Title required'); return; }
    try {
      const payload = {
        title:       lecForm.title.trim(),
        description: lecForm.description || '',
        isFree:      lecForm.isFree,
        videoUrl:    lecForm.videoType === 'url' ? (lecForm.videoUrl || '') : '',
        duration:    0,
      };
      await courseAPI.addLecture(id, activeModId, payload);
      toast.success('Lecture added!');
      setShowLecModal(false);
      setLecForm({ title:'', description:'', isFree:false, videoUrl:'', videoType:'url' });
      setVideoFile(null);
      fetchCourse();
    } catch {}
  };

  // ── Save lecture edit ───────────────────────────────────────────────────────
  const saveLectureEdit = async () => {
    if (!editLecForm.title.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/courses/${id}/modules/${editLec.modId}/lectures/${editLec.lec._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(editLecForm),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Lecture updated!');
        setEditLec(null);
        fetchCourse();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch { toast.error('Update failed'); }
  };

  if (loading) return <DashboardLayout title="Manage Course"><Spinner/></DashboardLayout>;
  if (!course) return <DashboardLayout title="Manage Course"><p>Not found</p></DashboardLayout>;

  return (
    <DashboardLayout title={`Manage: ${course.title}`}>
      <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 className="page-title">{course.title}</h1>
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <StatusBadge status={course.status}/>
            <span className="badge badge-gray">{course.totalLectures || 0} lectures</span>
          </div>
        </div>
      </div>

      {/* Add Module */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontFamily:'var(--font-serif)', marginBottom:12 }}>Add New Module</h3>
        <div style={{ display:'flex', gap:10 }}>
          <input className="form-input" placeholder="e.g. Introduction to JavaScript"
            value={modTitle} onChange={e=>setModTitle(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addModule()}
            style={{ flex:1 }}/>
          <button className="btn btn-primary" onClick={addModule}>
            <Plus size={15}/>Add Module
          </button>
        </div>
      </div>

      {/* Modules list */}
      {course.modules?.map((mod, mi) => (
        <div className="card" key={mod._id || mi} style={{ marginBottom:16 }}>

          {/* Module header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            {editModId === mod._id ? (
              // ── Edit module title inline ──
              <div style={{ display:'flex', gap:8, flex:1, marginRight:12 }}>
                <input className="form-input" value={editModTitle}
                  onChange={e=>setEditModTitle(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') saveModuleEdit(mod._id); if(e.key==='Escape') setEditModId(null); }}
                  autoFocus style={{ flex:1 }}/>
                <button className="btn btn-primary btn-sm" onClick={()=>saveModuleEdit(mod._id)}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditModId(null)}>Cancel</button>
              </div>
            ) : (
              // ── Module title (click to edit) ──
              <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:15, cursor:'pointer' }}
                  onClick={()=>{ setEditModId(mod._id); setEditModTitle(mod.title); }}
                  title="Click to edit module title">
                  Module {mi+1}: {mod.title}
                </h3>
                <button
                  onClick={()=>{ setEditModId(mod._id); setEditModTitle(mod.title); }}
                  style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4 }}
                  title="Edit module title">
                  ✏️
                </button>
              </div>
            )}

            {editModId !== mod._id && (
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary btn-sm"
                  onClick={()=>{ setActiveModId(mod._id); setShowLecModal(true); }}>
                  <Plus size={13}/>Add Lecture
                </button>
                <button
                  onClick={async()=>{
                    if(!window.confirm(`Delete module "${mod.title}" and all its lectures?`)) return;
                    try { await courseAPI.deleteModule(id, mod._id); toast.success('Module deleted!'); fetchCourse(); }
                    catch { toast.error('Failed to delete'); }
                  }}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px',
                    borderRadius:8, background:'rgba(244,63,94,0.08)',
                    border:'1px solid rgba(244,63,94,0.25)', color:'#f43f5e',
                    fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            )}
          </div>

          {/* Lectures */}
          {mod.lectures?.length === 0 && (
            <p style={{ color:'var(--text3)', fontSize:13, padding:'8px 0' }}>
              No lectures yet. Click "+ Add Lecture" to add one.
            </p>
          )}

          {mod.lectures?.map((lec, li) => (
            <div key={lec._id || li} style={{ borderBottom:'1px solid var(--border)', paddingBottom:10, marginBottom:10 }}>

              {editLec?.lec._id === lec._id ? (
                // ── Edit lecture inline ──
                <div style={{ background:'var(--bg4)', borderRadius:10, padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:4 }}>
                    Editing Lecture
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={editLecForm.title}
                      onChange={e=>setEditLecForm({...editLecForm,title:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} value={editLecForm.description}
                      onChange={e=>setEditLecForm({...editLecForm,description:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Video URL</label>
                    <input className="form-input" placeholder="https://youtube.com/watch?v=..."
                      value={editLecForm.videoUrl}
                      onChange={e=>setEditLecForm({...editLecForm,videoUrl:e.target.value})}/>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                    <input type="checkbox" checked={editLecForm.isFree}
                      onChange={e=>setEditLecForm({...editLecForm,isFree:e.target.checked})}
                      style={{ accentColor:'var(--accent)', width:16, height:16 }}/>
                    Free preview lecture
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveLectureEdit}>
                      Save Changes
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setEditLec(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // ── Normal lecture view ──
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:2 }}>
                      {li+1}. {lec.title}
                    </div>
                    {lec.description && (
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{lec.description}</div>
                    )}
                  </div>
                  {lec.isFree && <span className="badge badge-green" style={{ fontSize:10 }}>Free</span>}
                  {lec.videoUrl && <span className="badge badge-blue" style={{ fontSize:10 }}>Video</span>}

                  {/* Edit lecture button */}
                  <button
                    onClick={()=>{
                      setEditLec({ modId: mod._id, lec });
                      setEditLecForm({
                        title:       lec.title,
                        description: lec.description || '',
                        isFree:      lec.isFree || false,
                        videoUrl:    lec.videoUrl || '',
                      });
                    }}
                    style={{ background:'rgba(108,143,255,0.08)', border:'1px solid rgba(108,143,255,0.2)',
                      color:'var(--accent)', fontSize:11, fontWeight:600, padding:'5px 10px',
                      borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}
                    title="Edit lecture">
                    ✏️ Edit
                  </button>

                  {/* Material upload */}
                  <label style={{ cursor:'pointer' }}>
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                      style={{ display:'none' }}
                      onChange={async(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('name', file.name);
                        try {
                          await courseAPI.uploadMaterial(id, mod._id, lec._id, fd);
                          toast.success('Material uploaded!');
                          fetchCourse();
                        } catch {
                          toast.error('Material upload requires Cloudinary setup');
                        }
                        e.target.value = '';
                      }}/>
                    <span style={{
                      background:'rgba(52,211,153,0.08)',
                      border:'1px solid rgba(52,211,153,0.2)',
                      color:'var(--green)', fontSize:11, fontWeight:600,
                      padding:'5px 10px', borderRadius:6, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:4
                    }}>
                      + Material
                    </span>
                  </label>

                  {/* Delete lecture */}
                  <button
                    onClick={async()=>{
                      if(!window.confirm(`Delete "${lec.title}"?`)) return;
                      try { await courseAPI.deleteLecture(id, mod._id, lec._id); toast.success('Deleted!'); fetchCourse(); }
                      catch { toast.error('Failed'); }
                    }}
                    style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)',
                      color:'#f43f5e', fontSize:11, padding:'5px 10px', borderRadius:6, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              )}

              {/* Materials list */}
              {lec.materials?.length > 0 && (
                <div style={{ paddingLeft:20, marginTop:6, display:'flex', flexWrap:'wrap', gap:6 }}>
                  {lec.materials.map((mat,mi2)=>(
                    <a key={mi2} href={mat.url} target="_blank" rel="noreferrer"
                      style={{ fontSize:11, color:'var(--accent)', background:'rgba(108,143,255,0.08)',
                        padding:'2px 10px', borderRadius:4, textDecoration:'none' }}>
                      📄 {mat.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Add Lecture Modal */}
      <Modal open={showLecModal} onClose={()=>setShowLecModal(false)} title="Add Lecture">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="form-group">
            <label className="form-label">Lecture Title *</label>
            <input className="form-input" placeholder="e.g. What is JavaScript?"
              value={lecForm.title} onChange={e=>setLecForm({...lecForm,title:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="What will students learn?"
              value={lecForm.description} onChange={e=>setLecForm({...lecForm,description:e.target.value})}/>
          </div>
          <div className="form-group">
            <label className="form-label">Video Option</label>
            <select className="form-input" value={lecForm.videoType}
              onChange={e=>setLecForm({...lecForm,videoType:e.target.value})}>
              <option value="url">Paste Video URL (YouTube / Direct link)</option>
              <option value="none">No Video</option>
            </select>
          </div>
          {lecForm.videoType === 'url' && (
            <div className="form-group">
              <label className="form-label">Video URL</label>
              <input className="form-input" placeholder="https://www.youtube.com/watch?v=..."
                value={lecForm.videoUrl} onChange={e=>setLecForm({...lecForm,videoUrl:e.target.value})}/>
            </div>
          )}
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
            <input type="checkbox" checked={lecForm.isFree}
              onChange={e=>setLecForm({...lecForm,isFree:e.target.checked})}
              style={{ accentColor:'var(--accent)', width:16, height:16 }}/>
            Free preview (visible without enrollment)
          </label>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" onClick={addLecture}>Add Lecture</button>
            <button className="btn btn-ghost" onClick={()=>setShowLecModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ── Quiz Management ───────────────────────────────────────────────────────────
export const InstructorQuizzesPage = () => {
  const emptyQ = () => ({
    questionText: '',
    type: 'mcq',
    marks: 2,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  });

  const [courses, setCourses]     = useState([]);
  const [quizzes, setQuizzes]     = useState([]);
  const [selCourse, setSelCourse] = useState('');
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quizForm, setQuizForm]   = useState({ title:'', courseId:'', durationMins:30, passingMarks:8, maxAttempts:3 });
  const [questions, setQuestions] = useState([emptyQ()]);

  useEffect(() => {
    courseAPI.getMyCourses().then(r => setCourses(r.data.data || []));
  }, []);

  const fetchQuizzes = (cid) => {
    if (!cid) return;
    setLoading(true);
    quizAPI.getCourseQuizzes(cid).then(r => setQuizzes(r.data.data || [])).finally(() => setLoading(false));
  };

  const addQuestion = () => setQuestions([...questions, emptyQ()]);
  const removeQuestion = (qi) => { if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== qi)); };

  const updateQText  = (qi, val) => { const q=[...questions]; q[qi].questionText=val; setQuestions(q); };
  const updateQMarks = (qi, val) => { const q=[...questions]; q[qi].marks=Number(val); setQuestions(q); };
  const updateOptTxt = (qi, oi, val) => { const q=[...questions]; q[qi].options[oi].text=val; setQuestions(q); };
  const setCorrect   = (qi, oi) => {
    const q=[...questions];
    q[qi].options = q[qi].options.map((o,i) => ({ ...o, isCorrect: i===oi }));
    setQuestions(q);
  };

  const createQuiz = async () => {
    if (!quizForm.title.trim())  { toast.error('Quiz title is required'); return; }
    if (!quizForm.courseId)      { toast.error('Please select a course'); return; }
    for (let i=0; i<questions.length; i++) {
      if (!questions[i].questionText.trim())           { toast.error(`Q${i+1}: Enter question text`); return; }
      if (!questions[i].options.every(o=>o.text.trim())){ toast.error(`Q${i+1}: Fill all 4 options`); return; }
      if (!questions[i].options.some(o=>o.isCorrect))  { toast.error(`Q${i+1}: Mark the correct answer`); return; }
    }
    try {
      await quizAPI.create({ ...quizForm, questions });
      toast.success('Quiz created!');
      setShowModal(false);
      setQuizForm({ title:'', courseId:'', durationMins:30, passingMarks:8, maxAttempts:3 });
      setQuestions([emptyQ()]);
      fetchQuizzes(quizForm.courseId);
    } catch {}
  };

  const togglePublish = async (id) => {
    try { await quizAPI.togglePublish(id); fetchQuizzes(selCourse); toast.success('Updated!'); } catch {}
  };
  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    try { await quizAPI.delete(id); fetchQuizzes(selCourse); toast.success('Quiz deleted!'); } catch {}
  };

  return (
    <DashboardLayout title="Quizzes">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div><h1 className="page-title">Quizzes</h1><p className="page-subtitle">Create and manage assessments</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/> New Quiz</button>
      </div>

      <select className="form-input" style={{ maxWidth:340, marginBottom:20 }} value={selCourse}
        onChange={e => { setSelCourse(e.target.value); fetchQuizzes(e.target.value); }}>
        <option value="">Select a course to view quizzes</option>
        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
      </select>

      {loading ? <Spinner/> : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="table">
            <thead><tr><th>Quiz Title</th><th>Total Marks</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q._id}>
                  <td style={{ fontWeight:600 }}>{q.title}</td>
                  <td>{q.totalMarks}</td>
                  <td>{q.durationMins} min</td>
                  <td><span className={`badge ${q.isPublished ? 'badge-green' : 'badge-gray'}`}>{q.isPublished ? 'Published' : 'Draft'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(q._id)}>
                        {q.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteQuiz(q._id)}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quizzes.length === 0 && selCourse && <div className="empty-state"><p>No quizzes yet for this course</p></div>}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setQuestions([emptyQ()]); }} title="Create New Quiz">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Quiz Title — FIRST FIELD */}
          <div className="form-group">
            <label className="form-label">Quiz Title *</label>
            <input className="form-input" placeholder="e.g. JavaScript Basics Quiz"
              value={quizForm.title}
              onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}/>
          </div>

          {/* Course */}
          <div className="form-group">
            <label className="form-label">Course *</label>
            <select className="form-input" value={quizForm.courseId}
              onChange={e => setQuizForm({ ...quizForm, courseId: e.target.value })}>
              <option value="">Select a course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {/* Settings */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Duration (min)</label>
              <input className="form-input" type="number" min="1" value={quizForm.durationMins}
                onChange={e => setQuizForm({ ...quizForm, durationMins: Number(e.target.value) })}/>
            </div>
            <div className="form-group">
              <label className="form-label">Passing Marks</label>
              <input className="form-input" type="number" min="1" value={quizForm.passingMarks}
                onChange={e => setQuizForm({ ...quizForm, passingMarks: Number(e.target.value) })}/>
            </div>
            <div className="form-group">
              <label className="form-label">Max Attempts</label>
              <input className="form-input" type="number" min="1" value={quizForm.maxAttempts}
                onChange={e => setQuizForm({ ...quizForm, maxAttempts: Number(e.target.value) })}/>
            </div>
          </div>

          {/* Questions */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontWeight:700, fontSize:15 }}>Questions ({questions.length})</span>
              <button className="btn btn-ghost btn-sm" onClick={addQuestion}><Plus size={13}/> Add Question</button>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} style={{ background:'var(--bg4)', borderRadius:12, padding:16, marginBottom:14, border:'1px solid var(--border2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)', letterSpacing:'0.06em' }}>QUESTION {qi+1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)}
                      style={{ background:'none', border:'none', color:'var(--red)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                      Remove
                    </button>
                  )}
                </div>

                <input className="form-input" placeholder={`Type question ${qi+1} here...`}
                  value={q.questionText} onChange={e => updateQText(qi, e.target.value)}
                  style={{ marginBottom:12 }}/>

                <p style={{ fontSize:11, color:'var(--text3)', marginBottom:10, fontWeight:500 }}>
                  ● Click the circle to mark the correct answer
                </p>

                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'center' }}>
                    <button onClick={() => setCorrect(qi, oi)} style={{
                      width:26, height:26, borderRadius:'50%', flexShrink:0, cursor:'pointer',
                      border:`2px solid ${opt.isCorrect ? '#10b981' : 'var(--border3)'}`,
                      background: opt.isCorrect ? '#10b981' : 'transparent',
                      color:'#fff', fontSize:14, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'all 0.2s',
                    }}>
                      {opt.isCorrect ? '✓' : ''}
                    </button>
                    <input className="form-input" placeholder={`Option ${oi+1}`}
                      value={opt.text} onChange={e => updateOptTxt(qi, oi, e.target.value)}
                      style={{ flex:1, borderColor: opt.isCorrect ? '#10b981' : undefined }}/>
                    {opt.isCorrect && <span style={{ fontSize:11, color:'#10b981', fontWeight:700, minWidth:55 }}>✓ Correct</span>}
                  </div>
                ))}

                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
                  <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>Marks:</span>
                  <input className="form-input" type="number" min="1" value={q.marks}
                    onChange={e => updateQMarks(qi, e.target.value)} style={{ width:70 }}/>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <button className="btn btn-primary" onClick={createQuiz} style={{ flex:1, justifyContent:'center' }}>
              Create Quiz
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowModal(false); setQuestions([emptyQ()]); }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export const InstructorStudentsPage = () => {
  const [courses, setCourses]   = useState([]);
  const [students, setStudents] = useState([]);
  const [selCourse, setSelCourse] = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(()=>{ courseAPI.getMyCourses().then(r=>setCourses(r.data.data)); },[]);

  const fetchStudents = (cid) => {
    if (!cid) return;
    setLoading(true);
    instructorAPI.getCourseStudents(cid).then(r=>setStudents(r.data.data)).finally(()=>setLoading(false));
  };

  return (
    <DashboardLayout title="Students">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">Student Performance</h1>
        <p className="page-subtitle">View enrolled students and their progress</p>
      </div>

      <select className="form-input" style={{ maxWidth:340,marginBottom:20 }} value={selCourse}
        onChange={e=>{ setSelCourse(e.target.value); fetchStudents(e.target.value); }}>
        <option value="">Select a course</option>
        {courses.map(c=><option key={c._id} value={c._id}>{c.title}</option>)}
      </select>

      {loading ? <Spinner/> : students.length>0 ? (
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <table className="table">
            <thead><tr><th>Student</th><th>Progress</th><th>Status</th><th>Enrolled</th></tr></thead>
            <tbody>
              {students.map(s=>(
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{s.student?.name}</div>
                    <div style={{ fontSize:12,color:'var(--text2)' }}>{s.student?.email}</div>
                  </td>
                  <td style={{ width:200 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <div className="progress-bar" style={{ flex:1 }}>
                        <div className="progress-fill green" style={{ width:`${s.progressPercent}%` }}/>
                      </div>
                      <span style={{ fontSize:12,minWidth:30 }}>{s.progressPercent}%</span>
                    </div>
                  </td>
                  <td><StatusBadge status={s.status}/></td>
                  <td style={{ fontSize:13,color:'var(--text2)' }}>{new Date(s.enrolledAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selCourse ? (
        <div className="empty-state"><Users size={48}/><p>No students enrolled yet</p></div>
      ) : null}
    </DashboardLayout>
  );
};


