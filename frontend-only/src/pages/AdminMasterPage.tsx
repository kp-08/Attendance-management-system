
import React, { useState } from 'react';
import { User, UserRole, Holiday, AttendanceRecord } from '../types';
import { holidayService } from '../services';

interface AdminMasterPageProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  onOnboard: (u: Partial<User>) => Promise<User>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const AdminMasterPage: React.FC<AdminMasterPageProps> = ({ users, holidays, setHolidays, onOnboard, setUsers, attendance, setAttendance }) => {
  const [showSim, setShowSim] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'holidays'>('admins');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleOnboardAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    
    try {
      const newUser = await onOnboard({
        name,
        personalEmail: fd.get('personal') as string,
        role: UserRole.ADMIN,
        department: 'Central Operations',
        email: `admin_${name.toLowerCase().replace(/\s/g, '')}@company.com`
      });
      
      setShowSim(newUser);
      e.currentTarget.reset();
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  const handleAddHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingHoliday(true);
    setHolidayError(null);
    
    const fd = new FormData(e.currentTarget);
    try {
      const newHoliday = await holidayService.createHoliday({
        name: fd.get('name') as string,
        date: fd.get('date') as string,
        type: fd.get('type') as 'Public' | 'Company'
      });
      setHolidays(prev => [...prev, newHoliday]);
      e.currentTarget.reset();
    } catch (error: any) {
      setHolidayError(error.message || 'Failed to create holiday');
    } finally {
      setIsAddingHoliday(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Core</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Global administrative overrides and settings.</p>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-[22px] border border-slate-200 shadow-sm">
           {['admins', 'holidays'].map(tab => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`px-8 py-3 rounded-[18px] font-bold text-[11px] uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
             >
               {tab === 'admins' ? 'Fleet Admins' : 'Holiday Calendar'}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {activeTab === 'admins' && (
           <>
            <div className="lg:col-span-5 bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
               <h3 className="text-xl font-extrabold text-slate-900 mb-8">Deploy New Administrator</h3>
               <form onSubmit={handleOnboardAdmin} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Name</label>
                     <input name="name" required placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Private Channel (Email)</label>
                     <input name="personal" type="email" required placeholder="personal@email.link" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all" />
                  </div>
                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-xs">Initialize Admin Node</button>
               </form>
            </div>
            
            <div className="lg:col-span-7 bg-white rounded-[40px] p-10 shadow-xl shadow-slate-200/50 border border-slate-50">
               <h3 className="text-xl font-extrabold text-slate-900 mb-8">Active Fleet Administrators</h3>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {users.filter(u => u.role === UserRole.ADMIN).map(admin => (
                    <div key={admin.id} className="p-6 bg-slate-50/50 rounded-3xl flex items-center justify-between group border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-100">{admin.name.charAt(0)}</div>
                          <div>
                             <p className="font-extrabold text-slate-900 text-sm">{admin.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{admin.email}</p>
                          </div>
                       </div>
                       <button onClick={() => setUsers(prev => prev.filter(u => u.id !== admin.id))} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                          <i className="fas fa-trash-alt"></i>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
           </>
         )}

         {activeTab === 'holidays' && (
            <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-8">Define New Cycle Pause</h3>
                  <form onSubmit={handleAddHoliday} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Event Label</label>
                        <input name="name" required placeholder="Event Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Occurrence Date</label>
                        <input name="date" type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select name="type" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all">
                           <option value="Public">Public Holiday</option>
                           <option value="Company">Company Restricted</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all text-xs">Add to Calendar</button>
                  </form>
               </div>
               <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-8">Temporal Calendar</h3>
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
                          <button onClick={() => setHolidays(prev => prev.filter(hi => hi.id !== h.id))} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                             <i className="fas fa-times"></i>
                          </button>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>

      {showSim && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white rounded-[40px] p-12 max-w-md w-full shadow-2xl border border-white text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 text-3xl mb-6 mx-auto">
                 <i className="fas fa-check-circle"></i>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Admin Account Synchronized</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Access identifiers transmitted to {showSim.personalEmail}</p>
              
              <div className="bg-slate-50 p-8 rounded-[32px] space-y-4 mb-10 text-left border border-slate-100">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Node Identifier</span>
                    <span className="text-sm font-bold text-slate-900">{showSim.email}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Key</span>
                    <span className="text-sm font-bold text-indigo-600 font-mono tracking-widest">{showSim.password}</span>
                 </div>
              </div>
              
              <button onClick={() => setShowSim(null)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl">Confirm Sync</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminMasterPage;
