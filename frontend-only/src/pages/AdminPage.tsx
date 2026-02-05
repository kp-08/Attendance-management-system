
import React, { useState } from 'react';
import { User, UserRole, ProjectProposal, LeaveRequest, AttendanceRecord, Holiday } from '../types';
import { userService, holidayService } from '../services';

interface AdminPageProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onOnboard: (u: Partial<User>) => Promise<User>;
  proposals: ProjectProposal[];
  setProposals: React.Dispatch<React.SetStateAction<ProjectProposal[]>>;
  leaves: LeaveRequest[];
  setLeaves: (id: string, status: LeaveRequest['status']) => void;
  attendance: AttendanceRecord[];
  setAttendance: (id: string, status: AttendanceRecord['approvalStatus']) => void;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

const AdminPage: React.FC<AdminPageProps> = ({ users, setUsers, onOnboard, proposals, setProposals, leaves, setLeaves, attendance, setAttendance, holidays, setHolidays }) => {
  const [activeTab, setActiveTab] = useState<'onboard' | 'proposals' | 'leaves' | 'attendance' | 'holidays'>('onboard');
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  const handleAddHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingHoliday(true);
    setHolidayError(null);
    
    const form = e.currentTarget; // Save form reference before async
    const fd = new FormData(form);
    try {
      const newHoliday = await holidayService.createHoliday({
        name: fd.get('name') as string,
        date: fd.get('date') as string,
        type: fd.get('type') as 'Public' | 'Company'
      });
      setHolidays(prev => [...prev, newHoliday]);
      form.reset();
    } catch (error: any) {
      setHolidayError(error.message || 'Failed to create holiday');
    } finally {
      setIsAddingHoliday(false);
    }
  };

  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);

  const handleDeleteHoliday = async (holidayId: string, holidayName: string) => {
    if (!confirm(`Are you sure you want to delete the holiday "${holidayName}"?`)) {
      return;
    }
    
    setDeletingHolidayId(holidayId);
    try {
      await holidayService.deleteHoliday(holidayId);
      setHolidays(prev => prev.filter(h => h.id !== holidayId));
    } catch (error: any) {
      alert(`Failed to delete holiday: ${error.message}`);
    } finally {
      setDeletingHolidayId(null);
    }
  };
  const [showSim, setShowSim] = useState<User | null>(null);

  const admins = users.filter(u => u.role === UserRole.ADMIN);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANAGER);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingId(userId);
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      alert(`Failed to delete user: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    const form = e.currentTarget; // Save form reference before async
    const fd = new FormData(form);
    const role = fd.get('role') as UserRole;
    const name = fd.get('name') as string;
    
    try {
      const newUser = await onOnboard({
        name,
        personalEmail: fd.get('personal') as string,
        role,
        department: fd.get('department') as string,
        phone: fd.get('phone') as string,
        assignedAdminId: fd.get('assignedAdmin') as string,
        reportingTo: fd.get('reportingTo') as string || undefined,
        email: `${role === UserRole.MANAGER ? 'mgr_' : 'emp_'}${name.toLowerCase().replace(/\s/g, '')}@company.com`
      });

      setShowSim(newUser);
      form.reset();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveProject = (id: string) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Operations Hub</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Personnel orchestrations and high-tier audits.</p>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-[22px] border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
           {['onboard', 'proposals', 'leaves', 'attendance', 'holidays'].map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-8 py-3 rounded-[18px] font-bold text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
             >
               {tab === 'onboard' ? 'Onboard' : tab === 'proposals' ? 'Projects' : tab === 'leaves' ? 'Leave Review' : tab === 'attendance' ? 'Time Audit' : 'Holidays'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {activeTab === 'onboard' && (
           <>
            <div className="lg:col-span-5 bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
               <h3 className="text-xl font-extrabold text-slate-900 mb-8">Initialize Staff Node</h3>
               <form onSubmit={handleOnboardSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Level</label>
                       <select name="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500">
                          <option value={UserRole.MANAGER}>Manager</option>
                          <option value={UserRole.EMPLOYEE}>Employee</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sector</label>
                       <input name="department" required placeholder="Operations" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                     <input name="name" required placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                     <input name="phone" type="tel" placeholder="+1 234 567 8900" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500" />
                  </div>

                  {selectedRole === UserRole.EMPLOYEE && (
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reporting Manager</label>
                       <select name="reportingTo" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500">
                          <option value="">No Direct Manager</option>
                          {users.filter(u => u.role === UserRole.MANAGER).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                    </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Auditor (Admin)</label>
                     <select name="assignedAdmin" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500">
                        <option value="">Select Overseer</option>
                        {admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Private Channel (Email)</label>
                     <input name="personal" type="email" required placeholder="personal@email.com" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs disabled:opacity-50">
                    {isSubmitting ? 'Processing...' : 'Authorize Deployment'}
                  </button>
                  {submitError && <p className="text-red-500 text-sm text-center">{submitError}</p>}
               </form>
            </div>
            
            <div className="lg:col-span-7 bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
               <h3 className="text-xl font-extrabold text-slate-900 mb-8">Deployed Workforce</h3>
               <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {users.filter(u => u.role !== UserRole.ADMIN_MASTER && u.role !== UserRole.ADMIN).map(emp => (
                    <div key={emp.id} className="p-6 bg-slate-50/50 rounded-3xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-extrabold border border-slate-100">{emp.name.charAt(0)}</div>
                          <div>
                             <p className="font-extrabold text-slate-900 text-sm">{emp.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.email}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right">
                             <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">Auditor</span>
                             <span className="text-xs font-extrabold text-slate-600">{users.find(u => u.id === emp.assignedAdminId)?.name || 'Central'}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteUser(emp.id, emp.name)}
                            disabled={deletingId === emp.id}
                            className="p-3 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-xl transition-all disabled:opacity-50"
                            title="Delete user"
                          >
                            {deletingId === emp.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
           </>
         )}

         {activeTab === 'proposals' && (
           <div className="lg:col-span-12 bg-white rounded-[40px] p-12 border border-slate-50 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-10">Strategic Deployment Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {proposals.filter(p => p.status === 'Pending_Admin').map(p => (
                   <div key={p.id} className="p-10 bg-slate-50/50 rounded-[40px] border border-transparent hover:border-indigo-100 hover:bg-white transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                           <h4 className="text-xl font-extrabold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{p.projectName}</h4>
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-extrabold uppercase rounded-lg">Awaiting Auth</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                           Request Lead: <span className="text-slate-900">{p.managerName}</span>
                        </p>
                        <div className="space-y-4 mb-10">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected Personnel Pool</p>
                           <div className="flex flex-wrap gap-2">
                              {p.employeeIds.map(id => (
                                <span key={id} className="px-4 py-2 bg-white rounded-2xl text-[11px] font-bold text-slate-700 shadow-sm border border-slate-100">
                                  {users.find(u => u.id === id)?.name || 'Unknown Node'}
                                </span>
                              ))}
                           </div>
                        </div>
                      </div>
                      <button onClick={() => approveProject(p.id)} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Final Authorization</button>
                   </div>
                 ))}
                 {proposals.filter(p => p.status === 'Pending_Admin').length === 0 && (
                   <div className="col-span-full py-32 text-center text-slate-300 font-bold text-sm">No tactical deployments awaiting authorization.</div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'leaves' && (
           <div className="lg:col-span-12 bg-white rounded-[40px] p-12 border border-slate-50 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-10">High-Tier Leave Review</h3>
              <div className="space-y-4">
                 {leaves.filter(l => l.status === 'Pending_Admin').map(l => (
                   <div key={l.id} className="p-8 bg-slate-50/50 rounded-[32px] flex items-center justify-between border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 text-2xl font-extrabold border border-slate-100">{l.employeeName.charAt(0)}</div>
                        <div>
                           <p className="text-xl font-extrabold text-slate-900 mb-1">{l.employeeName}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{l.type} • {l.startDate} to {l.endDate} ({l.daysRequested} Days)</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setLeaves(l.id, 'Rejected')} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-extrabold text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Decline</button>
                        <button onClick={() => setLeaves(l.id, 'Approved')} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">Sign-Off</button>
                      </div>
                   </div>
                 ))}
                 {leaves.filter(l => l.status === 'Pending_Admin').length === 0 && (
                   <div className="py-32 text-center text-slate-300 font-bold text-sm">No high-tier leave reviews required.</div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'attendance' && (
           <div className="lg:col-span-12 bg-white rounded-[40px] p-12 border border-slate-50 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-10">Global Temporal Audit</h3>
              <div className="space-y-4">
                 {attendance.filter(a => a.approvalStatus === 'Pending_Admin').map(a => (
                   <div key={a.id} className="p-8 bg-slate-50/50 rounded-[32px] flex items-center justify-between border border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 text-2xl font-extrabold border border-slate-100">{a.employeeName.charAt(0)}</div>
                        <div>
                           <p className="text-xl font-extrabold text-slate-900 mb-1">{a.employeeName}</p>
                           <div className="flex gap-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle: {a.date}</span>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Initialization: {a.clockIn}</span>
                           </div>
                        </div>
                      </div>
                      <button onClick={() => setAttendance(a.id, 'Approved')} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-extrabold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">Verify Temporal Record</button>
                   </div>
                 ))}
                 {attendance.filter(a => a.approvalStatus === 'Pending_Admin').length === 0 && (
                   <div className="py-32 text-center text-slate-300 font-bold text-sm">All temporal logs are fully verified.</div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'holidays' && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-8">Add New Holiday</h3>
                  <form onSubmit={handleAddHoliday} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Name</label>
                        <input name="name" required placeholder="Holiday Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                        <input name="date" type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select name="type" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all">
                           <option value="Public">Public Holiday</option>
                           <option value="Company">Company Holiday</option>
                        </select>
                     </div>
                     {holidayError && <p className="text-red-500 text-sm">{holidayError}</p>}
                     <button type="submit" disabled={isAddingHoliday} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all text-xs disabled:opacity-50">
                       {isAddingHoliday ? 'Adding...' : 'Add Holiday'}
                     </button>
                  </form>
               </div>
               <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-8">Holiday Calendar</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {holidays.map(h => (
                       <div key={h.id} className="p-5 bg-slate-50/50 rounded-3xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center font-extrabold text-xs text-indigo-500 shadow-sm">
                               {h.date.split('-')[2]}
                             </div>
                             <div>
                                <p className="font-extrabold text-slate-900 text-sm">{h.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h.date}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-extrabold uppercase rounded-lg">{h.type}</span>
                             <button
                               onClick={() => handleDeleteHoliday(h.id, h.name)}
                               disabled={deletingHolidayId === h.id}
                               className="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all flex items-center justify-center disabled:opacity-50"
                               title="Delete holiday"
                             >
                               {deletingHolidayId === h.id ? (
                                 <i className="fas fa-spinner fa-spin text-xs"></i>
                               ) : (
                                 <i className="fas fa-trash text-xs"></i>
                               )}
                             </button>
                          </div>
                       </div>
                     ))}
                     {holidays.length === 0 && (
                       <div className="py-16 text-center text-slate-300 font-bold text-sm">No holidays configured yet.</div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>

      {showSim && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl border border-white text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 text-3xl mb-6 mx-auto">
                 <i className="fas fa-satellite-dish"></i>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Personnel Sync Successful</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Access phase identifiers transmitted to {showSim.personalEmail}</p>

              <div className="bg-slate-50 p-8 rounded-[32px] space-y-4 mb-10 text-left border border-slate-100">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Node Identifier</span>
                    <span className="text-sm font-bold text-slate-900">{showSim.email}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Initial Access Key</span>
                    <span className="text-sm font-bold text-indigo-600 font-mono tracking-widest">{showSim.password}</span>
                 </div>
              </div>
              
              <button onClick={() => setShowSim(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Synchronize</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
