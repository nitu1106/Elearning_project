import React, { useState, useEffect } from 'react';
import { DashboardLayout, Spinner, StatusBadge, Modal } from '../../components/common';
import { adminAPI } from '../../api';
import { Users, BookOpen, Award, TrendingUp, UserCheck, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data.data))
      .catch(err => {
        console.error('Stats error:', err);
        setError(err.response?.data?.message || 'Failed to load stats');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Admin Dashboard">
      <div className="loading-center"><div className="spinner"/></div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--red)', marginBottom: 16 }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </DashboardLayout>
  );

  const trend = (stats?.monthlyTrend || []).map(d => ({
    name: `${d._id.month}/${d._id.year}`,
    enrollments: d.count
  }));

  return (
    <DashboardLayout title="Admin Dashboard">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Real-time analytics and management</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Students',  value: stats?.totalStudents    || 0, color: 'var(--accent)', icon: Users },
          { label: 'Instructors',     value: stats?.totalInstructors || 0, color: 'var(--gold)',   icon: UserCheck },
          { label: 'Active Courses',  value: stats?.approvedCourses  || 0, color: 'var(--green)',  icon: BookOpen },
          { label: 'Certificates',    value: stats?.totalCertificates|| 0, color: 'var(--coral)',  icon: Award },
        ].map(({ label, value, color, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <Icon size={20} color={color}/>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
            Enrollment Trend
          </h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text2)' }}/>
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }}/>
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}/>
                <Bar dataKey="enrollments" radius={[4,4,0,0]} fill="var(--accent)"/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              No enrollment data yet. Approve courses and get students enrolled!
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
            Quick Stats
          </h3>
          {[
            ['Total Courses',     stats?.totalCourses     || 0],
            ['Pending Approval',  stats?.pendingCourses   || 0],
            ['Total Enrollments', stats?.totalEnrollments || 0],
            ['Total Revenue',     `₹${stats?.totalRevenue || 0}`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── User Management ────────────────────────────────────────────────────────────
export const AdminUsersPage = () => {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [instrForm, setInstrForm]   = useState({ name:'',email:'',password:'' });

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.getUsers(roleFilter ? { role:roleFilter } : {})
      .then(r=>setUsers(r.data.data)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetchUsers(); },[roleFilter]);

  const toggleStatus = async (id) => {
    try { await adminAPI.toggleUser(id); fetchUsers(); toast.success('Status updated'); } catch {}
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await adminAPI.deleteUser(id); fetchUsers(); toast.success('User deleted'); } catch {}
  };

  const createInstructor = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createInstructor(instrForm);
      toast.success('Instructor account created!');
      setShowModal(false); setInstrForm({name:'',email:'',password:''});
      fetchUsers();
    } catch {}
  };

  return (
    <DashboardLayout title="User Management">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">Manage all platform users</p></div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}><UserCheck size={16}/>Add Instructor</button>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:20 }}>
        {['','student','instructor','admin'].map(r=>(
          <button key={r} className={`btn btn-sm ${roleFilter===r?'btn-primary':'btn-ghost'}`}
            onClick={()=>setRoleFilter(r)}>{r||'All'}</button>
        ))}
      </div>

      {loading ? <Spinner/> : (
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{u.name}</div>
                    <div style={{ fontSize:12,color:'var(--text2)' }}>{u.email}</div>
                  </td>
                  <td><span className={`badge ${u.role==='admin'?'badge-red':u.role==='instructor'?'badge-gold':'badge-blue'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.isActive?'badge-green':'badge-gray'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                  <td style={{ fontSize:13,color:'var(--text2)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display:'flex',gap:8 }}>
                      {u.role!=='admin' && (
                        <button className="btn btn-ghost btn-sm" onClick={()=>toggleStatus(u._id)}>
                          <RefreshCw size={13}/>{u.isActive?'Deactivate':'Activate'}
                        </button>
                      )}
                      {u.role!=='admin' && (
                        <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u._id)}><Trash2 size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length===0 && <div className="empty-state"><Users size={48}/><p>No users found</p></div>}
        </div>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Create Instructor Account">
        <form onSubmit={createInstructor} style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={instrForm.name} onChange={e=>setInstrForm({...instrForm,name:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={instrForm.email} onChange={e=>setInstrForm({...instrForm,email:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input className="form-input" type="password" value={instrForm.password} onChange={e=>setInstrForm({...instrForm,password:e.target.value})} required/>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-primary" type="submit">Create Account</button>
            <button type="button" className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

// ── Course Management ──────────────────────────────────────────────────────────
export const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCourses = () => {
    setLoading(true);
    adminAPI.getAllCourses(statusFilter?{status:statusFilter}:{})
      .then(r=>setCourses(r.data.data)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetchCourses(); },[statusFilter]);

  const removeCourse = async (id) => {
    if (!window.confirm('Remove this course?')) return;
    try { await adminAPI.removeCourse(id); fetchCourses(); toast.success('Course removed'); } catch {}
  };

  return (
    <DashboardLayout title="Course Management">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">All Courses</h1>
        <p className="page-subtitle">Manage the full course catalog</p>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:20 }}>
        {['','approved','pending','draft','rejected'].map(s=>(
          <button key={s} className={`btn btn-sm ${statusFilter===s?'btn-primary':'btn-ghost'}`}
            onClick={()=>setStatusFilter(s)}>{s||'All'}</button>
        ))}
      </div>

      {loading ? <Spinner/> : (
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <table className="table">
            <thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Enrolled</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.map(c=>(
                <tr key={c._id}>
                  <td style={{ fontWeight:500,maxWidth:240 }}>{c.title}</td>
                  <td style={{ fontSize:13,color:'var(--text2)' }}>{c.instructor?.name}</td>
                  <td><StatusBadge status={c.status}/></td>
                  <td>{c.enrollmentCount}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={()=>removeCourse(c._id)}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length===0 && <div className="empty-state"><BookOpen size={48}/><p>No courses found</p></div>}
        </div>
      )}
    </DashboardLayout>
  );
};

// ── Pending Approvals ──────────────────────────────────────────────────────────
export const AdminApprovalsPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchPending = () => {
    setLoading(true);
    adminAPI.getPendingCourses().then(r=>setCourses(r.data.data)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ fetchPending(); },[]);

  const review = async (action) => {
    if (!selected) return;
    try {
      await adminAPI.reviewCourse(selected._id, { action, feedback });
      toast.success(`Course ${action}d!`);
      setSelected(null); setFeedback('');
      fetchPending();
    } catch {}
  };

  return (
    <DashboardLayout title="Approvals">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">Course Approvals</h1>
        <p className="page-subtitle">{courses.length} courses pending review</p>
      </div>

      {loading ? <Spinner/> : courses.length===0 ? (
        <div className="empty-state"><CheckCircle size={48} color="var(--green)"/><p>All caught up! No pending approvals.</p></div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {courses.map(c=>(
            <div className="card" key={c._id}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontSize:16,fontWeight:600,marginBottom:4 }}>{c.title}</h3>
                  <p style={{ fontSize:13,color:'var(--text2)',marginBottom:8 }}>by {c.instructor?.name} · {c.instructor?.email}</p>
                  <p style={{ fontSize:13,color:'var(--text2)',lineHeight:1.6 }}>{c.description?.slice(0,200)}…</p>
                  <div style={{ display:'flex',gap:8,marginTop:10 }}>
                    <span className="badge badge-blue">{c.category}</span>
                    <span className="badge badge-gray">{c.level}</span>
                    <span className="badge badge-gray">{c.totalLectures||0} lectures</span>
                  </div>
                </div>
                <div style={{ display:'flex',gap:8,marginLeft:16 }}>
                  <button className="btn btn-primary btn-sm"
                    onClick={()=>{ setSelected(c); }}>Review</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={()=>{ setSelected(null); setFeedback(''); }} title={`Review: ${selected?.title}`}>
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <p style={{ fontSize:13,color:'var(--text2)' }}>Submitted by: <strong style={{ color:'var(--text)' }}>{selected?.instructor?.name}</strong></p>
          <div className="form-group">
            <label className="form-label">Feedback (optional for approval, required for rejection)</label>
            <textarea className="form-input" rows={3} placeholder="Leave feedback for the instructor…"
              value={feedback} onChange={e=>setFeedback(e.target.value)}/>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-primary" onClick={()=>review('approve')} style={{ background:'var(--green2)' }}>
              <CheckCircle size={15}/> Approve
            </button>
            <button className="btn btn-danger" onClick={()=>review('reject')}>
              <XCircle size={15}/> Reject
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ── Reports ────────────────────────────────────────────────────────────────────
export const AdminReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getReport().then(r=>setReport(r.data.data)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Reports"><Spinner/></DashboardLayout>;

  const qs = report?.quizStats;
  const topCourses = report?.topCourses || [];

  return (
    <DashboardLayout title="Reports">
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">Learning Reports</h1>
        <p className="page-subtitle">Platform-wide analytics</p>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color:'var(--accent)' }}>{Math.round(qs?.avgScore||0)}%</div>
          <div className="stat-label">Avg Quiz Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color:'var(--green)' }}>{qs?.passed||0}</div>
          <div className="stat-label">Quizzes Passed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color:'var(--gold)' }}>{qs?.totalAttempts||0}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-serif)',marginBottom:16 }}>Top Courses by Enrollment</h3>
          {topCourses.slice(0,8).map((c,i)=>(
            <div key={c._id} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:11,color:'var(--text3)',minWidth:20 }}>#{i+1}</span>
                <span style={{ fontSize:13,fontWeight:500 }}>{c.title}</span>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <span style={{ fontSize:12,color:'var(--text2)' }}>{c.enrollmentCount} enrolled</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--font-serif)',marginBottom:16 }}>Top Students</h3>
          {(report?.topStudents||[]).slice(0,8).map((s,i)=>(
            <div key={i} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <span style={{ fontSize:11,color:'var(--text3)',minWidth:20 }}>#{i+1}</span>
                <div>
                  <div style={{ fontSize:13,fontWeight:500 }}>{s.student?.name}</div>
                  <div style={{ fontSize:11,color:'var(--text2)' }}>{s.student?.email}</div>
                </div>
              </div>
              <span className="badge badge-green">{s.completedCourses} completed</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Monitor Enrollments ────────────────────────────────────────────────────────
export const AdminEnrollmentsPage = () => {
  const [courses, setCourses]         = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selCourse, setSelCourse]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    adminAPI.getAllCourses({})
      .then(r => setCourses(r.data.data || []))
      .catch(() => setCourses([]));
  }, []);

  const fetchEnrollments = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setEnrollments([]);
    try {
      const res = await adminAPI.getCourseEnrollments(courseId);
      setEnrollments(res.data.data || []);
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Monitor Enrollments">
      <div style={{ marginBottom:24 }}>
        <h1 className="page-title">Enrollment Monitor</h1>
        <p className="page-subtitle">Track student enrollments per course</p>
      </div>

      <select className="form-input" style={{ maxWidth:400, marginBottom:20 }}
        value={selCourse}
        onChange={e => {
          setSelCourse(e.target.value);
          fetchEnrollments(e.target.value);
        }}>
        <option value="">Select a course to view enrollments</option>
        {courses.map(c => (
          <option key={c._id} value={c._id}>
            {c.title} ({c.enrollmentCount || 0} enrolled)
          </option>
        ))}
      </select>

      {error && (
        <div style={{ padding:16, background:'rgba(248,113,113,0.1)',
          borderRadius:8, border:'1px solid rgba(248,113,113,0.3)',
          color:'var(--red)', marginBottom:16, fontSize:13 }}>
          Error: {error}
        </div>
      )}

      {loading ? <Spinner/> : enrollments.length > 0 ? (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Enrolled On</th>
                <th>Completed On</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e._id}>
                  <td>
                    <div style={{ fontWeight:500 }}>
                      {e.student?.name || 'Unknown'}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>
                      {e.student?.email}
                    </div>
                  </td>
                  <td style={{ width:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress-bar" style={{ flex:1 }}>
                        <div className="progress-fill green"
                          style={{ width:`${e.progressPercent||0}%` }}/>
                      </div>
                      <span style={{ fontSize:12, minWidth:34 }}>
                        {e.progressPercent||0}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      e.status==='completed' ? 'badge-green' :
                      e.status==='active'    ? 'badge-blue'  : 'badge-gray'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ fontSize:13, color:'var(--text2)' }}>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td style={{ fontSize:13, color:'var(--text2)' }}>
                    {e.completedAt
                      ? new Date(e.completedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selCourse && !loading ? (
        <div className="empty-state">
          <Users size={48}/>
          <p>No students enrolled in this course yet</p>
        </div>
      ) : null}
    </DashboardLayout>
  );
};
