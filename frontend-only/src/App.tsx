import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AttendanceRecord, LeaveRequest, Holiday, ProjectProposal } from './types';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { leaveService } from './services/leaveService';
import { holidayService } from './services/holidayService';
import { attendanceService } from './services/attendanceService';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import PhonebookPage from './pages/PhonebookPage';
import AdminMasterPage from './pages/AdminMasterPage';
import AdminPage from './pages/AdminPage';
import ManagerPage from './pages/ManagerPage';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('cygnet_core_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cygnet_core_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('cygnet_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('cygnet_leaves');
    return saved ? JSON.parse(saved) : [];
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('cygnet_holidays');
    return saved ? JSON.parse(saved) : [];
  });

  const [proposals, setProposals] = useState<ProjectProposal[]>(() => {
    const saved = localStorage.getItem('cygnet_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('cygnet_core_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('cygnet_core_current_user', JSON.stringify(currentUser)), [currentUser]);
  useEffect(() => localStorage.setItem('cygnet_attendance', JSON.stringify(attendance)), [attendance]);
  useEffect(() => localStorage.setItem('cygnet_leaves', JSON.stringify(leaves)), [leaves]);
  useEffect(() => localStorage.setItem('cygnet_holidays', JSON.stringify(holidays)), [holidays]);
  useEffect(() => localStorage.setItem('cygnet_proposals', JSON.stringify(proposals)), [proposals]);

  // Fetch users from backend when user logs in
  useEffect(() => {
    if (currentUser) {
      userService.getAllUsers()
        .then(apiUsers => {
          setUsers(apiUsers || []);
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }
  }, [currentUser?.id]);

  // Fetch leaves from backend when user logs in
  useEffect(() => {
    if (currentUser) {
      leaveService.getAllLeaveRequests()
        .then(apiLeaves => {
          setLeaves(apiLeaves || []);
        })
        .catch(err => console.error('Failed to fetch leaves:', err));
    }
  }, [currentUser?.id]);

  // Fetch holidays from backend when user logs in
  useEffect(() => {
    if (currentUser) {
      holidayService.getAllHolidays()
        .then(apiHolidays => {
          setHolidays(apiHolidays || []);
        })
        .catch(err => console.error('Failed to fetch holidays:', err));
    }
  }, [currentUser?.id]);

  // Fetch attendance from backend when user logs in
  useEffect(() => {
    if (currentUser) {
      attendanceService.getAllAttendance()
        .then(apiAttendance => {
          setAttendance(apiAttendance || []);
        })
        .catch(err => console.error('Failed to fetch attendance:', err));
    }
  }, [currentUser?.id]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email: email.toLowerCase(), password });
      
      if (response.token && response.user) {
        // Map API response to local User type
        const user: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          personalEmail: response.user.email,
          role: response.user.role as UserRole,
          department: response.user.department || 'General',
          leaveBalance: response.user.leaveBalance || 17,
          status: 'Active',
          loginCount: 1,
          passwordChanged: true,
        };
        
        setCurrentUser(user);
        // Add to users list if not exists
        setUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (!exists) return [...prev, user];
          return prev.map(u => u.id === user.id ? user : u);
        });
        
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server.' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Invalid credentials.' };
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cygnet_core_current_user');
  };

  const handleChangePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      await authService.changePassword({
        currentPassword: oldPass,
        newPassword: newPass
      });
      const updatedUser = { ...currentUser, passwordChanged: true };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Failed to change password:', error);
      return false;
    }
  };

  const handleOnboard = async (data: Partial<User>): Promise<User> => {
    // Generate a temporary password for the new user
    const tempPassword = Math.random().toString(36).substr(2, 8);
    
    try {
      // Call backend API to create the user
      const response = await userService.createUser({
        name: data.name || '',
        email: data.email || '',
        personalEmail: data.personalEmail || data.email || '',
        password: tempPassword,
        role: data.role || UserRole.EMPLOYEE,
        department: data.department || 'Operations',
        phone: data.phone,
      });
      
      // Create local user object from API response
      const newUser: User = {
        id: response.id || `node-${Math.random().toString(36).substr(2, 6)}`,
        status: 'Active',
        leaveBalance: 15,
        loginCount: 0,
        passwordChanged: false,
        joinDate: new Date().toISOString().split('T')[0],
        name: data.name || '',
        email: data.email || '',
        personalEmail: data.personalEmail || '',
        password: tempPassword, // Store for display to admin
        role: data.role || UserRole.EMPLOYEE,
        department: data.department || 'Operations',
        reportingTo: data.reportingTo,
        reportingManagerName: users.find(u => u.id === data.reportingTo)?.name,
        assignedAdminId: data.assignedAdminId,
        phone: data.phone || '+91 00000 00000'
      };
      
      setUsers([...users, newUser]);
      return newUser;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      // Fallback to local-only user if API fails
      const newUser: User = {
        id: `node-${Math.random().toString(36).substr(2, 6)}`,
        status: 'Active',
        leaveBalance: 15,
        loginCount: 0,
        passwordChanged: false,
        joinDate: new Date().toISOString().split('T')[0],
        name: data.name || '',
        email: data.email || '',
        personalEmail: data.personalEmail || '',
        password: tempPassword,
        role: data.role || UserRole.EMPLOYEE,
        department: data.department || 'Operations',
        reportingTo: data.reportingTo,
        reportingManagerName: users.find(u => u.id === data.reportingTo)?.name,
        assignedAdminId: data.assignedAdminId,
        phone: data.phone || '+91 00000 00000'
      };
      setUsers([...users, newUser]);
      throw new Error(`User created locally but not in database: ${error.message}`);
    }
  };

  const updateLeaveStatus = (id: string, newStatus: LeaveRequest['status']) => {
    setLeaves(prev => prev.map(l => {
      if (l.id !== id) return l;
      
      // Deduction logic on final approval
      if (newStatus === 'Approved' && l.status !== 'Approved') {
        setUsers(usersList => usersList.map(u => 
          u.id === l.employeeId ? { ...u, leaveBalance: u.leaveBalance - l.daysRequested } : u
        ));
      }
      return { ...l, status: newStatus };
    }));
  };

  const updateAttendanceStatus = async (id: string, newStatus: AttendanceRecord['approvalStatus']) => {
    try {
      await attendanceService.updateAttendance(id, { approvalStatus: newStatus });
      setAttendance(prev => prev.map(a => a.id === id ? { ...a, approvalStatus: newStatus } : a));
    } catch (error) {
      console.error('Failed to update attendance:', error);
      alert('Failed to update attendance status');
    }
  };

  const workingDaysThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let count = 0;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => h.date === dateStr);
      if (day !== 0 && day !== 6 && !isHoliday) count++;
    }
    return count;
  }, [holidays]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
        
        <Route path="/*" element={
          currentUser ? (
            <div className="flex min-h-screen bg-[#fcfdfe]">
              <Sidebar role={currentUser.role} onLogout={handleLogout} />
              <div className="flex-1 flex flex-col min-w-0 px-4 py-6 md:px-8">
                <Navbar user={currentUser} onUpdatePassword={handleChangePassword} />
                <main className="flex-1 overflow-auto mt-6">
                  <Routes>
                    <Route path="/" element={<Dashboard user={currentUser} users={users} attendance={attendance} leaves={leaves} holidays={holidays} workingDays={workingDaysThisMonth} />} />
                    <Route path="/attendance" element={<AttendancePage user={currentUser} attendance={attendance} setAttendance={setAttendance} holidays={holidays} />} />
                    <Route path="/leave" element={
                      <LeavePage 
                        user={currentUser} 
                        leaves={leaves} 
                        onAdd={(request) => setLeaves(prev => [request, ...prev])} 
                        onUpdateStatus={updateLeaveStatus} 
                      />
                    } />
                    <Route path="/phonebook" element={<PhonebookPage users={users} currentUser={currentUser} attendanceHistory={attendance} />} />
                    
                    {currentUser.role === UserRole.ADMIN_MASTER && (
                      <Route path="/admin-master" element={<AdminMasterPage users={users} setUsers={setUsers} holidays={holidays} setHolidays={setHolidays} onOnboard={handleOnboard} attendance={attendance} setAttendance={setAttendance} />} />
                    )}
                    
                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.ADMIN_MASTER) && (
                      <Route path="/admin" element={
                        <AdminPage 
                          users={users} 
                          setUsers={setUsers} 
                          onOnboard={handleOnboard} 
                          proposals={proposals} 
                          setProposals={setProposals} 
                          leaves={leaves} 
                          setLeaves={updateLeaveStatus} 
                          attendance={attendance} 
                          setAttendance={updateAttendanceStatus}
                          holidays={holidays}
                          setHolidays={setHolidays}
                        />
                      } />
                    )}

                    {currentUser.role === UserRole.MANAGER && (
                      <Route path="/manager" element={
                        <ManagerPage 
                          user={currentUser} 
                          users={users} 
                          proposals={proposals} 
                          setProposals={setProposals} 
                          attendance={attendance} 
                          setAttendance={updateAttendanceStatus} 
                          leaves={leaves}
                          onUpdateLeaveStatus={updateLeaveStatus}
                        />
                      } />
                    )}
                    
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;