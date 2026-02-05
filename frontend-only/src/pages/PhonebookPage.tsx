
import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, AttendanceRecord } from '../types';

interface PhonebookPageProps {
  users: User[];
  currentUser: User;
  attendanceHistory: AttendanceRecord[];
}

const ITEMS_PER_PAGE = 8;

const PhonebookPage: React.FC<PhonebookPageProps> = ({ users, currentUser, attendanceHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'department' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const isAdminMaster = currentUser.role === UserRole.ADMIN_MASTER;

  // Filter, sort, and paginate users
  const { paginatedUsers, totalPages, totalCount } = useMemo(() => {
    // Filter
    let filtered = users.filter(u => 
      u.status === 'Active' && (
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Sort
    filtered.sort((a, b) => {
      let aVal = '', bVal = '';
      if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === 'department') {
        aVal = a.department.toLowerCase();
        bVal = b.department.toLowerCase();
      } else if (sortBy === 'role') {
        aVal = a.role.toLowerCase();
        bVal = b.role.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return { paginatedUsers, totalPages, totalCount };
  }, [users, searchTerm, sortBy, sortOrder, currentPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const getUserAttendance = (userId: string) => {
    return attendanceHistory.filter(a => a.employeeId === userId);
  };

  const handleSort = (field: 'name' | 'department' | 'role') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'department' | 'role' }) => (
    <span className="ml-1">
      {sortBy === field ? (
        sortOrder === 'asc' ? '↑' : '↓'
      ) : (
        <span className="text-slate-300">↕</span>
      )}
    </span>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Personnel Directory</h2>
          <p className="text-slate-500 font-medium text-sm">Unified identity database for all active nodes. <span className="text-indigo-600 font-bold">{totalCount} employees</span></p>
        </div>
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Search by name or division..."
            className="w-full bg-white border border-slate-200 py-4 pl-14 pr-6 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort by:</span>
        <button 
          onClick={() => handleSort('name')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'name' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Name <SortIcon field="name" />
        </button>
        <button 
          onClick={() => handleSort('department')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'department' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Department <SortIcon field="department" />
        </button>
        <button 
          onClick={() => handleSort('role')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${sortBy === 'role' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          Role <SortIcon field="role" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedUsers.map(emp => (
          <div 
            key={emp.id} 
            onClick={() => isAdminMaster && setViewingUser(emp)}
            className={`bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all duration-300 group ${isAdminMaster ? 'cursor-pointer hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1' : ''}`}
          >
            <div className="flex items-start justify-between mb-8">
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl font-extrabold text-indigo-600 shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {emp.name.charAt(0)}
               </div>
               <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  {emp.department}
               </span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-all">{emp.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{emp.role.replace('_', ' ')}</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <i className="fas fa-envelope text-indigo-300 w-4 text-center"></i>
                <span className="truncate">{emp.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <i className="fas fa-phone text-indigo-300 w-4 text-center"></i>
                <span>{emp.phone || 'N/A'}</span>
              </div>
            </div>

            {isAdminMaster && (
              <div className="mt-6 flex items-center gap-2 text-indigo-600 text-[9px] font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all uppercase">
                <i className="fas fa-clock-rotate-left"></i>
                Audit Attendance
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-angles-left"></i>
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="flex items-center gap-1">
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
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                    currentPage === pageNum 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
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
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <i className="fas fa-angles-right"></i>
          </button>
          
          <span className="ml-4 text-xs font-bold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Audit Modal for Admin Master */}
      {viewingUser && isAdminMaster && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Attendance Audit: {viewingUser.name}</h3>
                <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mt-1">Full History Record Access</p>
              </div>
              <button 
                onClick={() => setViewingUser(null)} 
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-slate-100">
                        <th className="pb-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">Cycle Date</th>
                        <th className="pb-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">Init</th>
                        <th className="pb-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">Term</th>
                        <th className="pb-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">Status</th>
                        <th className="pb-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-right">Verification</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {getUserAttendance(viewingUser.id).map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 font-bold text-slate-900 text-sm">{record.date}</td>
                        <td className="py-6 text-indigo-600 font-bold text-sm">{record.clockIn}</td>
                        <td className="py-6 text-slate-500 font-bold text-sm">{record.clockOut || '---'}</td>
                        <td className="py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${
                            record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {record.approvalStatus.replace('_', ' ')}
                        </td>
                      </tr>
                    ))}
                    {getUserAttendance(viewingUser.id).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-300 font-bold text-sm italic">No records found.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhonebookPage;
