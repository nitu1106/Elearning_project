import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, LayoutDashboard, Users, Settings, LogOut,
  GraduationCap, ClipboardList, TrendingUp, Award,
  PlusCircle, FileText, BarChart2, CheckSquare,
  UserCheck, ShieldCheck, BookMarked, Menu, X
} from 'lucide-react';

// ── PrivateRoute ──────────────────────────────────────────────────────────────
export const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

// ── Role-aware nav items ──────────────────────────────────────────────────────
const studentNav = [
  { to: '/student/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/courses',     icon: BookOpen,        label: 'Browse Courses' },
  { to: '/student/my-courses',  icon: BookMarked,      label: 'My Courses' },
  { to: '/student/progress',    icon: TrendingUp,      label: 'Progress' },
  { to: '/student/certificates',icon: Award,           label: 'Certificates' },
];

const instructorNav = [
  { to: '/instructor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/instructor/courses',   icon: BookOpen,        label: 'My Courses' },
  { to: '/instructor/create',    icon: PlusCircle,      label: 'Create Course' },
  { to: '/instructor/quizzes',   icon: ClipboardList,   label: 'Quizzes' },
  { to: '/instructor/students',  icon: Users,           label: 'Students' },
];

const adminNav = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/courses',      icon: BookOpen,        label: 'Courses' },
  { to: '/admin/approvals',    icon: CheckSquare,     label: 'Approvals' },
  { to: '/admin/enrollments',  icon: TrendingUp,      label: 'Enrollments' },
  { to: '/admin/reports',      icon: BarChart2,       label: 'Reports' },
];

const roleNav = { student: studentNav, instructor: instructorNav, admin: adminNav };
const roleBadgeClass = { student: 'badge-blue', instructor: 'badge-gold', admin: 'badge-red' };

// ── Sidebar ───────────────────────────────────────────────────────────────────
export const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = roleNav[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {open && <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:40 }}/>}
      <aside style={{
        position: 'fixed', top: 0, left: open ? 0 : '-260px',
        width: 240, height: '100vh',
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50, transition: 'left 0.25s ease',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap size={20} color="#fff"/>
            </div>
            <span style={{ fontFamily:'var(--font-serif)', fontSize:18, color:'var(--text)' }}>EduSphere</span>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:600, color:'var(--accent)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{user?.name}</div>
              <span className={`badge ${roleBadgeClass[user?.role]}`} style={{ marginTop:3, fontSize:11 }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'12px 12px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', borderRadius: 8,
                fontSize:14, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'rgba(108,143,255,0.1)' : 'transparent',
                marginBottom: 2, transition:'all 0.15s',
              })}
            >
              <Icon size={17}/>{label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding:'12px', borderTop:'1px solid var(--border)' }}>
          <NavLink to="/profile" onClick={onClose}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, fontSize:14, color:'var(--text2)', marginBottom:4 }}>
            <Settings size={17}/>Profile & Settings
          </NavLink>
          <button onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, fontSize:14, color:'var(--red)', background:'transparent', border:'none', width:'100%' }}>
            <LogOut size={17}/>Logout
          </button>
        </div>
      </aside>
    </>
  );
};

// ── TopBar ────────────────────────────────────────────────────────────────────
export const TopBar = ({ title, onMenuClick }) => (
  <header style={{
    height: 60, background:'var(--bg2)', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', paddingLeft:20, paddingRight:24, gap:16,
    position:'sticky', top:0, zIndex:30,
  }}>
    <button onClick={onMenuClick}
      style={{ background:'none', border:'none', color:'var(--text2)', display:'flex', alignItems:'center' }}>
      <Menu size={20}/>
    </button>
    <span style={{ fontFamily:'var(--font-serif)', fontSize:17, color:'var(--text)' }}>{title}</span>
  </header>
);

// ── DashboardLayout ───────────────────────────────────────────────────────────
export const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div style={{ flex:1, marginLeft:0, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)}/>
        <main style={{ flex:1, padding:'28px 24px', maxWidth:1200, width:'100%', margin:'0 auto' }}>
          <div className="fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

// ── Misc shared UI ─────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="loading-center"><div className="spinner"/></div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    approved: 'badge-green', active: 'badge-green', completed: 'badge-green',
    pending:  'badge-gold',
    draft:    'badge-gray',
    rejected: 'badge-red',
    dropped:  'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
};

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-serif)',fontSize:18 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text2)' }}><X size={18}/></button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
};
