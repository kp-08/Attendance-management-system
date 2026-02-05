
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: 'fa-house' },
    { name: 'Attendance', path: '/attendance', icon: 'fa-clock' },
    { name: 'Leave Requests', path: '/leave', icon: 'fa-calendar-minus' },
    { name: 'Directory', path: '/phonebook', icon: 'fa-address-book' },
  ];

  if (role === UserRole.ADMIN_MASTER) {
    menuItems.push({ name: 'System Settings', path: '/admin-master', icon: 'fa-gears' });
  }

  if (role === UserRole.ADMIN || role === UserRole.ADMIN_MASTER) {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: 'fa-user-shield' });
  }

  if (role === UserRole.MANAGER) {
    menuItems.push({ name: 'Team Management', path: '/manager', icon: 'fa-users-gear' });
  }

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-white/5 p-8 relative h-screen sticky top-0 z-50">
      {/* Brand Section */}
      <div className="flex items-center gap-4 mb-14">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <i className="fas fa-feather-pointed text-xl text-black"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Cygnet</h2>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">HR Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">Navigation</div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <i className={`fas ${item.icon} w-5 text-center transition-transform group-hover:scale-110`}></i>
            <span className="font-semibold text-sm tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-white/5">
        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 mb-6">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Session</span>
           </div>
           <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{role.replace('_', ' ')}</p>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-3 px-6 py-4 w-full text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl border border-rose-500/10 transition-all font-bold text-sm"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
