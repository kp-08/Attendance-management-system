
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';

interface NavbarProps { 
  user: User; 
  onUpdatePassword: (oldPass: string, newPass: string) => Promise<boolean> | boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, onUpdatePassword }) => {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const getActiveTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/attendance') return 'Attendance';
    if (path === '/leave') return 'Leave Requests';
    if (path === '/phonebook') return 'Employee Directory';
    if (path === '/admin') return 'Admin Panel';
    if (path === '/admin-master') return 'System Settings';
    if (path === '/manager') return 'Team Management';
    return 'Cygnet Portal';
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      const success = await onUpdatePassword(oldPass, newPass);
      if (success) {
        setShowSecurityModal(false);
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setError('Verification failed. Incorrect old password.');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="h-24 bg-white/5 backdrop-blur-md border-b border-white/10 px-10 flex items-center justify-between sticky top-0 z-20">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white tracking-tight">{getActiveTitle()}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 pr-6 border-r border-white/10">
             <div className="text-right">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Role</p>
               <span className="text-xs font-bold text-white uppercase tracking-wide">{user.role.replace('_', ' ')}</span>
             </div>
             <button 
                onClick={() => setShowSecurityModal(true)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center justify-center"
                title="Change Password"
             >
                <i className="fas fa-key"></i>
             </button>
          </div>

          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShowSecurityModal(true)}>
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-white mb-0.5">{user.name}</span>
              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{user.department}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {showSecurityModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/10">
             <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <button onClick={() => setShowSecurityModal(false)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                   <i className="fas fa-times"></i>
                </button>
             </div>
             <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6">
                {error && (
                  <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-rose-500"></i>
                    <p className="text-xs text-rose-500 font-bold">{error}</p>
                  </div>
                )}
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                   <input 
                     type="password"
                     required 
                     className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white focus:outline-none focus:border-indigo-500 transition-all" 
                     placeholder="Enter old password"
                     value={oldPass}
                     onChange={(e) => setOldPass(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                   <input 
                     type="password"
                     required 
                     className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white focus:outline-none focus:border-indigo-500 transition-all" 
                     placeholder="Min. 6 characters"
                     value={newPass}
                     onChange={(e) => setNewPass(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                   <input 
                     type="password"
                     required 
                     className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white focus:outline-none focus:border-indigo-500 transition-all" 
                     placeholder="Confirm new password"
                     value={confirmPass}
                     onChange={(e) => setConfirmPass(e.target.value)}
                   />
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowSecurityModal(false)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-xl transition-all text-sm" disabled={loading}>Cancel</button>
                   <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm disabled:opacity-50" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
