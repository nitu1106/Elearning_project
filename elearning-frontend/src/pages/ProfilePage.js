import React, { useState } from 'react';
import { DashboardLayout } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm]   = useState({ name: user?.name||'', bio: user?.bio||'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'' });
  const [loading, setLoading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('bio', form.bio);
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch {
    } finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'' });
    } catch {
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Profile">
      <div style={{ maxWidth:600 }}>
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-subtitle">Manage your account</p>

        <div style={{ display:'flex',gap:8,margin:'20px 0' }}>
          {[['profile','Profile'],['password','Password']].map(([key,label])=>(
            <button key={key} className={`btn btn-sm ${tab===key?'btn-primary':'btn-ghost'}`} onClick={()=>setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab==='profile' && (
          <form onSubmit={saveProfile} className="card" style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:8 }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:'var(--accent)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:16 }}>{user?.name}</div>
                <div style={{ fontSize:13,color:'var(--text2)' }}>{user?.email}</div>
                <span className={`badge ${user?.role==='admin'?'badge-red':user?.role==='instructor'?'badge-gold':'badge-blue'}`} style={{ marginTop:4 }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
                <input className="form-input" style={{ paddingLeft:36 }} value={form.name}
                  onChange={e=>setForm({...form,name:e.target.value})}/>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} placeholder="Tell us about yourself…"
                value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'fit-content' }}>
              <Save size={15}/>{loading?'Saving…':'Save Changes'}
            </button>
          </form>
        )}

        {tab==='password' && (
          <form onSubmit={changePassword} className="card" style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
                <input className="form-input" style={{ paddingLeft:36 }} type="password"
                  value={pwForm.currentPassword} onChange={e=>setPwForm({...pwForm,currentPassword:e.target.value})} required/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)' }}/>
                <input className="form-input" style={{ paddingLeft:36 }} type="password" placeholder="Min. 6 characters"
                  value={pwForm.newPassword} onChange={e=>setPwForm({...pwForm,newPassword:e.target.value})} required/>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'fit-content' }}>
              <Save size={15}/>{loading?'Updating…':'Update Password'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
