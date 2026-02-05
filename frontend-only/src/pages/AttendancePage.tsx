
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, AttendanceRecord, Holiday, AttendanceEntry } from '../types';
import { attendanceService } from '../services';

interface AttendancePageProps {
  user: User;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  holidays: Holiday[];
}

const ITEMS_PER_PAGE = 10;

const AttendancePage: React.FC<AttendancePageProps> = ({ user, attendance, setAttendance, holidays }) => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'clockIn' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Attendance logs state
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [entryReason, setEntryReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = new Date().toISOString().split('T')[0];
  const isHoliday = holidays.some(h => h.date === dateStr);
  const todayRecord = attendance.find(a => a.employeeId === user.id && a.date === dateStr);

  // Filter, sort, and paginate attendance
  const myAttendance = useMemo(() => {
    let records = attendance.filter(a => a.employeeId === user.id);
    
    // Sort
    records.sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortBy === 'date') {
        aVal = a.date;
        bVal = b.date;
      } else if (sortBy === 'clockIn') {
        aVal = a.clockIn || '';
        bVal = b.clockIn || '';
      } else if (sortBy === 'status') {
        aVal = a.status;
        bVal = b.status;
      }
      
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    return records;
  }, [attendance, user.id, sortBy, sortOrder]);

  const { paginatedRecords, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(myAttendance.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRecords = myAttendance.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    return { paginatedRecords, totalPages };
  }, [myAttendance, currentPage]);

  const handleSort = (field: 'date' | 'clockIn' | 'status') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handlePunch = async () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      if (!todayRecord) {
        // Clock in - call API
        const status = now.getHours() >= 9 && now.getMinutes() > 15 ? 'Late' : 'Present';
        const newRecord = await attendanceService.markAttendance({
          employeeId: user.id,
          clockIn: timeStr,
          status: status as 'Present' | 'Late' | 'Absent' | 'Holiday'
        });
        setAttendance(prev => [newRecord, ...prev.filter(a => a.id !== newRecord.id)]);
      } else {
        // Clock out - call API
        const updatedRecord = await attendanceService.updateAttendance(todayRecord.id, {
          clockOut: timeStr
        });
        setAttendance(prev => prev.map(a => a.id === todayRecord.id ? updatedRecord : a));
      }
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    }
  };

  // Load entries for today's record
  const loadEntries = async () => {
    if (!todayRecord) return;
    setLoadingEntries(true);
    try {
      const data = await attendanceService.getAttendanceEntries(todayRecord.id);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Add a new entry (check-in or check-out)
  const handleAddEntry = async (entryType: 'in' | 'out') => {
    if (!todayRecord) return;
    setAddingEntry(true);
    try {
      const newEntry = await attendanceService.addAttendanceEntry(todayRecord.id, entryType, entryReason || undefined);
      setEntries(prev => [...prev, newEntry]);
      setEntryReason('');
      // Refresh attendance to update entriesCount
      const updatedAttendance = await attendanceService.getAllAttendance();
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
    } finally {
      setAddingEntry(false);
    }
  };

  // Confirm attendance and submit for verification
  const handleConfirmAttendance = async () => {
    if (!todayRecord) return;
    setConfirming(true);
    try {
      await attendanceService.confirmAttendance(todayRecord.id);
      // Refresh attendance
      const updatedAttendance = await attendanceService.getAllAttendance();
      setAttendance(updatedAttendance);
      setShowLogsModal(false);
      alert('Attendance confirmed and submitted for verification!');
    } catch (error: any) {
      console.error('Failed to confirm attendance:', error);
      alert(error?.response?.data?.detail || 'Failed to confirm attendance.');
    } finally {
      setConfirming(false);
    }
  };

  // Open logs modal and load entries
  const openLogsModal = () => {
    setShowLogsModal(true);
    loadEntries();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-10">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">My Attendance</h2>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-[11px]">Record your daily work hours</p>
        </div>
        <div className="text-right">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Current Time</span>
           <span className="text-4xl font-bold text-white font-mono tabular-nums">{currentTime}</span>
        </div>
      </div>

      {isHoliday ? (
        <div className="bg-slate-900 rounded-3xl p-20 text-center border border-white/5 shadow-xl">
           <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl text-emerald-500 mx-auto mb-8">
             <i className="fas fa-calendar-star"></i>
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">Today is a Holiday!</h3>
           <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Attendance tracking is not required today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl p-12 h-full flex flex-col justify-between border border-white/5 shadow-xl">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {todayRecord ? (todayRecord.clockOut ? 'Shift Completed' : 'You are Clocked In') : 'Ready to Start?'}
                </h3>
                <p className="text-slate-400 font-medium text-sm max-w-md">
                  {todayRecord ? (todayRecord.clockOut ? 'Your shift for today has ended. See you tomorrow!' : `You clocked in at ${todayRecord.clockIn}. Have a great workday!`) : 'Please clock in to start your attendance record for today.'}
                </p>
              </div>

              <div className="flex items-center gap-8 mt-12">
                 <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl transition-all ${
                   todayRecord ? (todayRecord.clockOut ? 'bg-white/5 text-slate-600' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20') : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                 }`}>
                   <i className={`fas ${todayRecord ? (todayRecord.clockOut ? 'fa-lock' : 'fa-stopwatch') : 'fa-fingerprint'}`}></i>
                 </div>
                 
                 <button 
                   onClick={handlePunch}
                   disabled={todayRecord && !!todayRecord.clockOut}
                   className={`flex-1 py-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                     todayRecord ? (todayRecord.clockOut ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-500') : 'bg-white text-black hover:bg-slate-100'
                   }`}
                 >
                   {todayRecord ? (todayRecord.clockOut ? 'Clocked Out' : 'Clock Out Now') : 'Clock In Now'}
                 </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-xl">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Daily Details</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status</span>
                  <span className="text-xs font-bold text-emerald-500 uppercase">Active</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase">Approval Tier</span>
                  <span className="text-xs font-bold text-white uppercase">{user.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-xs font-bold text-slate-400 uppercase">System Date</span>
                  <span className="text-xs font-bold text-white">{dateStr}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Entries Today</span>
                  <span className="text-xs font-bold text-indigo-400">{todayRecord?.entriesCount || 0} logs</span>
                </div>
              </div>
            </div>

            {/* Attendance Logs Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
              <i className="fas fa-list-check text-3xl mb-4 opacity-50"></i>
              <h4 className="text-lg font-bold mb-1">Attendance Logs</h4>
              <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-4">
                Track multiple check-ins/outs during the day (lunch, meetings, etc.) and confirm before leaving.
              </p>
              {todayRecord && !todayRecord.isConfirmed && (
                <button
                  onClick={openLogsModal}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                >
                  <i className="fas fa-clock-rotate-left mr-2"></i>
                  Manage Logs
                </button>
              )}
              {todayRecord?.isConfirmed && (
                <div className="bg-white/20 rounded-xl p-4 text-center">
                  <i className="fas fa-check-circle mr-2"></i>
                  Confirmed at {todayRecord.confirmedAt}
                </div>
              )}
              {!todayRecord && (
                <p className="text-xs text-indigo-200 italic">Clock in first to manage logs</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h4 className="font-bold text-white uppercase text-xs tracking-widest">Attendance History <span className="text-indigo-400">({myAttendance.length} records)</span></h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Sort:</span>
            <button 
              onClick={() => handleSort('date')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('clockIn')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === 'clockIn' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              Time {sortBy === 'clockIn' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              onClick={() => handleSort('status')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === 'status' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clock In</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clock Out</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5 text-sm text-white font-bold">{rec.date}</td>
                  <td className="px-8 py-5 text-sm text-indigo-400 font-bold">{rec.clockIn}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-bold">{rec.clockOut || '--:--'}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase border ${
                      rec.status === 'Present' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider italic">
                      {rec.approvalStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myAttendance.length === 0 && (
            <div className="py-20 text-center text-slate-700 font-bold uppercase tracking-widest text-xs">No attendance records found.</div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-white/5 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-angles-left"></i>
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white/10 text-slate-400 hover:bg-white/20'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <i className="fas fa-angles-right"></i>
            </button>
            
            <span className="ml-4 text-xs font-bold text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>

      {/* Attendance Logs Modal */}
      {showLogsModal && todayRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Attendance Logs</h3>
                <p className="text-xs text-slate-400 mt-1">Track your check-ins and check-outs for today</p>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Current Status */}
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Today's Status</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    todayRecord.isConfirmed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {todayRecord.isConfirmed ? 'Confirmed' : 'Pending Confirmation'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500">Clock In</span>
                    <p className="text-lg font-bold text-indigo-400">{todayRecord.clockIn || '--:--'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Clock Out</span>
                    <p className="text-lg font-bold text-slate-400">{todayRecord.clockOut || '--:--'}</p>
                  </div>
                </div>
              </div>

              {/* Entry List */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Log Entries ({entries.length})</h4>
                {loadingEntries ? (
                  <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-indigo-400"></i>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <i className="fas fa-inbox text-3xl mb-2"></i>
                    <p className="text-sm">No additional log entries yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            entry.entryType === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            <i className={`fas ${entry.entryType === 'in' ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket'}`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              {entry.entryType === 'in' ? 'Check In' : 'Check Out'}
                            </p>
                            <p className="text-xs text-slate-400">{entry.reason || 'No reason specified'}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-indigo-400">{entry.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Entry Section */}
              {!todayRecord.isConfirmed && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Add New Entry</h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={entryReason}
                      onChange={(e) => setEntryReason(e.target.value)}
                      placeholder="Reason (e.g., Lunch break, Meeting)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAddEntry('in')}
                        disabled={addingEntry}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        <i className="fas fa-arrow-right-to-bracket mr-2"></i>
                        {addingEntry ? 'Adding...' : 'Check In'}
                      </button>
                      <button
                        onClick={() => handleAddEntry('out')}
                        disabled={addingEntry}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        <i className="fas fa-arrow-right-from-bracket mr-2"></i>
                        {addingEntry ? 'Adding...' : 'Check Out'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            <div className="p-6 border-t border-white/10">
              {!todayRecord.isConfirmed ? (
                <button
                  onClick={handleConfirmAttendance}
                  disabled={confirming}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
                >
                  <i className="fas fa-check-circle mr-2"></i>
                  {confirming ? 'Confirming...' : 'Confirm & Submit for Verification'}
                </button>
              ) : (
                <div className="text-center py-4 bg-emerald-500/10 rounded-xl">
                  <i className="fas fa-check-circle text-emerald-400 mr-2"></i>
                  <span className="text-emerald-400 font-bold">Attendance Confirmed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
