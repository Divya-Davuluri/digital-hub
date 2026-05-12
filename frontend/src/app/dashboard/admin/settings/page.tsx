'use client';

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleGuard from "@/components/RoleGuard";
import apiCall from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'workspaces'>('profile');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, workspacesData] = await Promise.all([
          apiCall('/settings/profile').catch(() => ({ name: '', email: '' })),
          apiCall('/settings/workspaces').catch(() => [])
        ]);
        setProfile({ 
          name: profileData?.name || '', 
          email: profileData?.email || '' 
        });
        setWorkspaces(Array.isArray(workspacesData) ? workspacesData : []);
      } catch (err) {
        console.error("Load settings failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiCall('/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile)
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setMessage('Passwords do not match');
    }
    setSaving(true);
    try {
      await apiCall('/settings/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });
      setMessage('Password updated successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setMessage(err.message || 'Password update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar role="admin" />
        <div className="flex-1 ml-[260px]">
          <Header />
          <main className="p-8 max-w-5xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Agency Settings</h1>
              <p className="text-slate-500">Manage your profile, security, and agency workspaces.</p>
            </div>

            <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 mb-8 w-fit shadow-sm">
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Profile</TabButton>
              <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')}>Security</TabButton>
              <TabButton active={activeTab === 'workspaces'} onClick={() => setActiveTab('workspaces')}>Workspaces</TabButton>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message}
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-10">
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Full Name</label>
                    <input 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 font-medium"
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Email Address</label>
                    <input 
                      disabled
                      className="w-full px-5 py-3.5 bg-slate-100 border border-slate-100 rounded-2xl text-slate-400 font-medium cursor-not-allowed"
                      value={profile.email}
                    />
                  </div>
                  <button 
                    disabled={saving}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Profile'}
                  </button>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Current Password</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={passwords.current}
                      onChange={e => setPasswords({...passwords, current: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">New Password</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Confirm New Password</label>
                    <input 
                      type="password"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={saving}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all"
                  >
                    {saving ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              )}

              {activeTab === 'workspaces' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Agency Workspaces</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workspaces.map(ws => (
                      <div key={ws.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{ws.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{ws.id.substring(0,8)}...</p>
                        </div>
                        <div className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">Active</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function TabButton({ children, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${
        active 
          ? 'bg-primary text-white shadow-md' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
