
import React from 'react';
import { User, UserRole, AttendanceRecord, Holiday, LeaveRequest } from '../types';

interface DashboardProps {
  user: User;
  users: User[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  workingDays: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, users, attendance, leaves, holidays, workingDays }) => {
  const getStats = () => {
    const common = [
      { label: 'Work Days', value: workingDays, icon: 'fa-calendar-check', color: 'bg-indigo-600' }
    ];

    switch(user.role) {
      case UserRole.ADMIN_MASTER:
        return [
          ...common,
          { label: 'Total Staff', value: users.length, icon: 'fa-users', color: 'bg-emerald-600' },
          { label: 'Admins', value: users.filter(u => u.role === UserRole.ADMIN).length, icon: 'fa-user-shield', color: 'bg-violet-600' },
          { label: 'System Status', value: 'Active', icon: 'fa-circle-check', color: 'bg-amber-600' }
        ];
      case UserRole.ADMIN:
        return [
          ...common,
          { label: 'Total Employees', value: users.filter(u => u.role !== UserRole.ADMIN_MASTER).length, icon: 'fa-users', color: 'bg-emerald-600' },
          { label: 'Leave Reviews', value: leaves.filter(l => l.status === 'Pending_Admin').length, icon: 'fa-file-signature', color: 'bg-amber-600' },
          { label: 'Pending Approvals', value: attendance.filter(a => a.approvalStatus === 'Pending_Admin').length, icon: 'fa-clock-rotate-left', color: 'bg-rose-600' }
        ];
      case UserRole.MANAGER:
        return [
          ...common,
          { label: 'Team Size', value: users.filter(u => u.reportingTo === user.id).length, icon: 'fa-people-group', color: 'bg-indigo-600' },
          { label: 'Leave Requests', value: leaves.filter(l => l.status === 'Pending_Manager').length, icon: 'fa-envelope-open-text', color: 'bg-rose-600' },
          { label: 'Unverified Attendance', value: attendance.filter(a => a.approvalStatus === 'Pending_Manager').length, icon: 'fa-clipboard-check', color: 'bg-amber-600' }
        ];
      default:
        return [
          ...common,
          { label: 'Leave Balance', value: user.leaveBalance, icon: 'fa-umbrella-beach', color: 'bg-indigo-600' },
          { label: 'Approved Days', value: attendance.filter(a => a.employeeId === user.id && a.approvalStatus === 'Approved').length, icon: 'fa-check-double', color: 'bg-emerald-600' },
          { label: 'Upcoming Holiday', value: holidays.length > 0 ? holidays[0].name.split(' ')[0] : 'None', icon: 'fa-sun', color: 'bg-amber-600' }
        ];
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-10">
        <div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Welcome back,</p>
          <h1 className="text-4xl font-bold text-white tracking-tight">{user.name}</h1>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Status</p>
              <span className="text-xs font-bold text-white uppercase">Online</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStats().map((stat, i) => (
          <div key={i} className="bg-slate-900 rounded-3xl p-8 flex flex-col justify-between h-48 border border-white/5 shadow-xl hover:border-indigo-500/30 transition-all group">
             <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fas ${stat.icon}`}></i>
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h4>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-slate-900 rounded-3xl p-10 border border-white/5 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
              <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-4">
               {attendance.slice(0, 5).map(record => (
                 <div key={record.id} className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-transparent hover:border-white/10 transition-all">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-lg font-bold">
                          {record.employeeName.charAt(0)}
                       </div>
                       <div>
                          <p className="font-bold text-white text-base">{record.employeeName}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{record.date} • {record.status}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-base font-bold text-white mb-0.5">{record.clockIn}</p>
                       <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{record.approvalStatus.replace('_', ' ')}</span>
                    </div>
                 </div>
               ))}
               {attendance.length === 0 && <div className="py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No recent activity found.</div>}
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-3xl p-10 border border-white/5 shadow-xl">
               <h3 className="text-xl font-bold text-white mb-8">Upcoming Holidays</h3>
               <div className="space-y-6">
                  {holidays.map(h => (
                    <div key={h.id} className="flex gap-4 items-center group">
                       <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center group-hover:bg-indigo-600 transition-all border border-white/5">
                          <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-white/70 mb-0.5">{new Date(h.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-lg font-bold text-white">{new Date(h.date).getDate()}</span>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white uppercase tracking-tight">{h.name}</p>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">{h.type} Holiday</p>
                       </div>
                    </div>
                  ))}
                  {holidays.length === 0 && <div className="text-center text-slate-700 font-bold uppercase tracking-widest text-[10px] py-10">No upcoming holidays.</div>}
               </div>
            </div>

            <div className="bg-indigo-600/10 rounded-2xl p-6 border border-indigo-500/20">
               <div className="flex items-center gap-3 mb-3">
                 <i className="fas fa-circle-info text-indigo-400"></i>
                 <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Info</h4>
               </div>
               <p className="text-xs text-slate-400 font-medium leading-relaxed">Please ensure you record your attendance daily. Leave requests must be approved by your immediate manager.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
