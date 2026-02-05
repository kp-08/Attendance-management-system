
import React, { useState } from 'react';
import { User, UserRole, LeaveRequest } from '../types';
import { leaveService } from '../services';

interface LeavePageProps {
  user: User;
  leaves: LeaveRequest[];
  onAdd: (request: LeaveRequest) => void;
  onUpdateStatus: (id: string, status: LeaveRequest['status']) => void;
}

const LeavePage: React.FC<LeavePageProps> = ({ user, leaves, onAdd, onUpdateStatus }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'Vacation' as any, startDate: '', endDate: '', reason: '' });
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isApprover = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN || user.role === UserRole.ADMIN_MASTER;
  const canApplyLeave = user.role === UserRole.EMPLOYEE || user.role === UserRole.MANAGER;

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateDays(formData.startDate, formData.endDate);
    if (days > user.leaveBalance) {
      alert("Insufficient leave balance.");
      return;
    }

    try {
      // Call the backend API to create leave request
      const newRequest = await leaveService.createLeaveRequest({
        employeeId: user.id,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      });
      
      onAdd(newRequest);
      setShowModal(false);
      setFormData({ type: 'Vacation', startDate: '', endDate: '', reason: '' });
    } catch (error) {
      console.error('Failed to create leave request:', error);
      alert('Failed to create leave request. Please try again.');
    }
  };

  const filteredLeaves = isApprover ? leaves : leaves.filter(l => l.employeeId === user.id);

  const handleApprove = async (leaveId: string) => {
    setProcessingId(leaveId);
    try {
      await leaveService.approveLeaveRequest(leaveId);
      onUpdateStatus(leaveId, 'Approved');
    } catch (error) {
      console.error('Failed to approve leave:', error);
      alert('Failed to approve leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    setProcessingId(leaveId);
    try {
      await leaveService.rejectLeaveRequest(leaveId, reason || undefined);
      onUpdateStatus(leaveId, 'Rejected');
    } catch (error) {
      console.error('Failed to reject leave:', error);
      alert('Failed to reject leave request');
    } finally {
      setProcessingId(null);
    }
  };

  const canApprove = (leave: LeaveRequest) => {
    if (leave.status === 'Approved' || leave.status === 'Rejected') return false;
    if (leave.employeeId === user.id) return false; // Can't approve own leave
    return isApprover;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Time-Off Requests</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Request and manage tactical rest periods.</p>
        </div>
        {canApplyLeave && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-3xl font-extrabold shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-3 text-xs uppercase tracking-widest"
          >
            <i className="fas fa-plus"></i>
            Initialize Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-8 relative z-10">Accrued Liquidity</h4>
            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <p className="text-xs font-bold text-slate-500">Available Balance</p>
                  <p className="text-3xl font-extrabold text-indigo-600 tracking-tight">{user.leaveBalance} <span className="text-xs text-slate-400 font-bold uppercase">Days</span></p>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${(user.leaveBalance/20)*100}%` }}></div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notice</p>
                 <p className="text-xs font-bold text-slate-600 leading-relaxed">Requests require initial Manager verification followed by Admin final sign-off.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/50 overflow-hidden">
             <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
               <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">Temporal Log History</h4>
               <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                 <button className="px-6 py-2 rounded-xl text-[10px] font-extrabold bg-indigo-50 text-indigo-600 uppercase tracking-widest">Active Records</button>
               </div>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-10 py-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Identity</th>
                    <th className="px-10 py-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-10 py-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Days</th>
                    <th className="px-10 py-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Auth Status</th>
                    {isApprover && <th className="px-10 py-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeaves.map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-8">
                        <div className="font-extrabold text-slate-900 text-sm mb-1">{leave.employeeName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.type}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="text-sm font-extrabold text-slate-700">{leave.startDate}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">to {leave.endDate}</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-sm font-extrabold text-indigo-600">{leave.daysRequested}</span>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                          leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          leave.status.includes('Pending') ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          {leave.status.replace('_', ' ')}
                        </span>
                      </td>
                      {isApprover && (
                        <td className="px-10 py-8">
                          {canApprove(leave) ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(leave.id)}
                                disabled={processingId === leave.id}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === leave.id ? '...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                disabled={processingId === leave.id}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingId === leave.id ? '...' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredLeaves.length === 0 && (
                    <tr>
                      <td colSpan={isApprover ? 5 : 4} className="py-24 text-center text-slate-300 font-bold text-xs uppercase italic tracking-[0.2em]">No temporal logs detected.</td>
                    </tr>
                  )}
                </tbody>
               </table>
             </div>
          </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">New Absence Node</h3>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="Vacation">Vacation</option>
                    <option value="Sick">Sick</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Calculated Days</label>
                  <div className="px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 font-extrabold text-sm">
                    {calculateDays(formData.startDate, formData.endDate)} Units
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                  <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Mission Rationale</label>
                <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all resize-none" placeholder="Primary reason for rest..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-5 btn-gradient rounded-[24px] font-extrabold uppercase tracking-widest text-xs shadow-xl shadow-indigo-100">Submit Request</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
