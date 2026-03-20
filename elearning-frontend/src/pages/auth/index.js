import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthShell = ({ children }) => (
  <div style={{
    minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    background:'var(--bg)', padding:20,
    backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(108,143,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(240,180,41,0.04) 0%, transparent 50%)',
  }}>
    <div style={{ width:'100%', maxWidth:420 }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ width:52,height:52,background:'var(--accent)',borderRadius:14,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
          <GraduationCap size={26} color="#fff"/>
        </div>
        <h1 style={{ fontFamily:'var(--font-serif)',fontSize:26,color:'var(--text)' }}>EduSphere</h1>
        <p style={{ color:'var(--text2)',fontSize:13,marginTop:4 }}>Knowledge without boundaries</p>
      </div>
      <div className="card" style={{ boxShadow:'var(--shadow-lg)' }}>
        {children}
      </div>
    </div>
  </div>
);

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const user = await login(form.email, form.password);
    console.log('Logged in user:', user);
    toast.success(`Welcome back, ${user.name}!`);

    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else if (user.role === 'instructor') {
      window.location.href = '/instructor/dashboard';
    } else {
      window.location.href = '/student/dashboard';
    }
  } catch (err) {
    console.error('Login failed:', err);
    toast.error(err?.response?.data?.message || 'Login failed. Check credentials.');
  } finally {
    setLoading(false);
  }
};

  return (
    <AuthShell>
      <h2 style={{ fontFamily:'var(--font-serif)',fontSize:22,marginBottom:4 }}>Sign in</h2>
      <p style={{ color:'var(--text2)',fontSize:13,marginBottom:24 }}>Enter your credentials to continue</p>
      <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <div style={{ position:'relative' }}>
            <Mail size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
            <input className="form-input" style={{ paddingLeft:36 }} type="email" placeholder="you@example.com"
              value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position:'relative' }}>
            <Lock size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
            <input className="form-input" style={{ paddingLeft:36,paddingRight:40 }} type={show?'text':'password'} placeholder="••••••••"
              value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
            <button type="button" onClick={()=>setShow(!show)}
              style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)' }}>
              {show ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%',justifyContent:'center',marginTop:4 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="divider"/>
      <p style={{ textAlign:'center',fontSize:13,color:'var(--text2)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color:'var(--accent)' }}>Create one</Link>
      </p>
    </AuthShell>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name:'', email:'', password:'' });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome.');
      navigate('/student/dashboard');
    } catch {
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h2 style={{ fontFamily:'var(--font-serif)',fontSize:22,marginBottom:4 }}>Create account</h2>
      <p style={{ color:'var(--text2)',fontSize:13,marginBottom:24 }}>Start your learning journey today</p>
      <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
        <div className="form-group">
          <label className="form-label">Full name</label>
          <div style={{ position:'relative' }}>
            <User size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
            <input className="form-input" style={{ paddingLeft:36 }} placeholder="Your name"
              value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email address</label>
          <div style={{ position:'relative' }}>
            <Mail size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
            <input className="form-input" style={{ paddingLeft:36 }} type="email" placeholder="you@example.com"
              value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position:'relative' }}>
            <Lock size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
            <input className="form-input" style={{ paddingLeft:36,paddingRight:40 }} type={show?'text':'password'} placeholder="Min. 6 characters"
              value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
            <button type="button" onClick={()=>setShow(!show)}
              style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text3)' }}>
              {show ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%',justifyContent:'center',marginTop:4 }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <div className="divider"/>
      <p style={{ textAlign:'center',fontSize:13,color:'var(--text2)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color:'var(--accent)' }}>Sign in</Link>
      </p>
    </AuthShell>
  );
};
