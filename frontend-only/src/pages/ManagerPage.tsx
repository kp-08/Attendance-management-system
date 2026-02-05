
import React, { useState } from 'react';
import { User, UserRole, ProjectProposal, AttendanceRecord, LeaveRequest } from '../types';

interface ManagerPageProps {
  user: User;
  users: User[];
  proposals: ProjectProposal[];
  setProposals: React.Dispatch<React.SetStateAction<ProjectProposal[]>>;
  attendance: AttendanceRecord[];
  setAttendance: (id: string, status: AttendanceRecord['approvalStatus']) => void;
  leaves: LeaveRequest[];
  onUpdateLeaveStatus: (id: string, status: LeaveRequest['status']) => void;
}

const ManagerPage: React.FC<ManagerPageProps> = ({ user, users, proposals, setProposals, attendance, setAttendance, leaves, onUpdateLeaveStatus }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'attendance' | 'leaves'>('attendance');
  
  const myTeam = users.filter(u => u.reportingTo === user.id);
  const employeePool = users.filter(u => u.role === UserRole.EMPLOYEE);

  const handleProposeProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const projectName = fd.get('name') as string;
    
    const newProposal: ProjectProposal = {
      id: `prop-${Date.now()}`,
      projectName,
      managerId: user.id,
      managerName: user.name,
      employeeIds: selectedSquad,
      status: 'Pending_Admin',
      timestamp: new Date().toISOString()
    };
    
    setProposals(prev => [newProposal, ...prev]);
    setShowAssign(false);
    setSelectedSquad([]);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Unit Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Personnel oversight and squad deployment requests.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button onClick={() => setActiveView('attendance')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Attendance</button>
             <button onClick={() => setActiveView('leaves')} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'leaves' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Leaves</button>
          </div>
          <button 
            onClick={() => setShowAssign(true)} 
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
          >
            Deploy Project Squad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-extrabold text-slate-900 mb-8">
              {activeView === 'attendance' ? 'Pending Attendance Verification' : 'Pending Leave Requests'}
            </h3>
            
            <div className="space-y-4">
               {activeView === 'attendance' ? (
                 attendance.filter(a => myTeam.find(u => u.id === a.employeeId) && a.approvalStatus === 'Pending_Manager').map(a => (
                   <div key={a.id} className="p-6 bg-slate-50/50 rounded-3xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 text-xl font-extrabold border border-slate-100">{a.employeeName.charAt(0)}</div>
                         <div>
                            <p className="font-extrabold text-slate-900 text-sm leading-none mb-2">{a.employeeName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle: {a.date} • Init: {a.clockIn}</p>
                         </div>
                      </div>
                      <button onClick={() => setAttendance(a.id, 'Pending_Admin')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 hover:bg-indigo-700">Verify</button>
                   </div>
                 ))
               ) : (
                 leaves.filter(l => myTeam.find(u => u.id === l.employeeId) && l.status === 'Pending_Manager').map(l => (
                  <div key={l.id} className="p-6 bg-slate-50/50 rounded-3xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 text-xl font-extrabold border border-slate-100">{l.employeeName.charAt(0)}</div>
                        <div>
                           <p className="font-extrabold text-slate-900 text-sm leading-none mb-2">{l.employeeName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.type} • {l.startDate} to {l.endDate}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => onUpdateLeaveStatus(l.id, 'Rejected')} className="bg-rose-50 text-rose-500 px-5 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Decline</button>
                        <button onClick={() => onUpdateLeaveStatus(l.id, 'Pending_Admin')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-extrabold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 hover:bg-indigo-700">Approve</button>
                     </div>
                  </div>
                ))
               )}

               {activeView === 'attendance' && attendance.filter(a => myTeam.find(u => u.id === a.employeeId) && a.approvalStatus === 'Pending_Manager').length === 0 && (
                 <div className="py-24 text-center text-slate-300 font-bold text-sm uppercase italic">No temporal records awaiting verification.</div>
               )}
               {activeView === 'leaves' && leaves.filter(l => myTeam.find(u => u.id === l.employeeId) && l.status === 'Pending_Manager').length === 0 && (
                 <div className="py-24 text-center text-slate-300 font-bold text-sm uppercase italic">No leave requests awaiting authorization.</div>
               )}
            </div>
         </div>

         <div className="lg:col-span-4 bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-extrabold text-slate-900 mb-8">Unit Deployment Log</h3>
            <div className="space-y-4">
               {proposals.filter(p => p.managerId === user.id).map(p => (
                 <div key={p.id} className="p-6 bg-slate-50/50 rounded-[32px] border-l-4 border-indigo-600 shadow-sm relative overflow-hidden group hover:bg-white transition-all">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Force Identity</p>
                    <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors mb-4">{p.projectName}</h4>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                       <span className={`text-[9px] font-bold px-3 py-1 rounded-xl uppercase tracking-widest ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-500'}`}>
                         {p.status.replace('_', ' ')}
                       </span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.employeeIds.length} Nodes</span>
                    </div>
                 </div>
               ))}
               {proposals.filter(p => p.managerId === user.id).length === 0 && (
                 <div className="py-20 text-center text-slate-300 font-bold text-xs uppercase italic">No active deployment logs.</div>
               )}
            </div>
         </div>
      </div>

      {showAssign && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white rounded-[40px] p-12 max-w-lg w-full shadow-2xl border border-white relative overflow-hidden animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Squad Deployment Request</h3>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select tactical nodes from the global pool</p>
                </div>
                <button onClick={() => setShowAssign(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                   <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleProposeProject} className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Squad Assignment Name</label>
                    <input 
                       name="name" 
                       required 
                       placeholder="e.g. Phoenix Initiative" 
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                    />
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tactical Personnel Pool</label>
                       <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{selectedSquad.length} Marked</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                       {employeePool.map(emp => (
                         <label key={emp.id} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                           selectedSquad.includes(emp.id) ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500'
                         }`}>
                            <input 
                               type="checkbox" 
                               className="hidden" 
                               checked={selectedSquad.includes(emp.id)}
                               onChange={() => {
                                 setSelectedSquad(prev => prev.includes(emp.id) ? prev.filter(i => i !== emp.id) : [...prev, emp.id])
                               }}
                            />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${selectedSquad.includes(emp.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                               {emp.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-sm">{emp.name}</span>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAssign(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 font-extrabold rounded-[24px] uppercase tracking-widest text-xs hover:bg-slate-100">Cancel</button>
                    <button 
                       type="submit" 
                       disabled={selectedSquad.length === 0}
                       className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs transition-all disabled:opacity-30 hover:bg-indigo-700"
                    >
                       Propose Force Squad
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPage;
