
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const lowerEmail = email.toLowerCase().trim();
    if (!lowerEmail.endsWith('@company.com')) {
       setError('Incorrect email format. Please use your @company.com email.');
       setLoading(false);
       return;
    }

    try {
      const result = await onLogin(email, password);
      if (!result.success) {
        setError(result.message || 'Login failed. Check your email and password.');
        setLoading(false);
      }
    } catch (err) {
      setError('Connection error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-700">
        {/* Visual Brand Panel */}
        <div className="hidden lg:flex flex-col justify-between p-20 bg-gradient-to-br from-slate-950 to-black relative overflow-hidden">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                 <i className="fas fa-feather-pointed text-black text-3xl"></i>
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-6">Cygnet</h1>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Employee Management System</p>
           </div>

           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-xs font-semibold uppercase tracking-widest">System Online</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Welcome to your company workspace. Please log in to access your dashboard, attendance, and team tools.
              </p>
           </div>
        </div>

        {/* Form Panel */}
        <div className="p-12 md:p-20 bg-slate-900/50 backdrop-blur-md">
           <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Enter your work credentials</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role Identifier</label>
                 <div className="relative group">
                    <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-colors"></i>
                    <input 
                       type="email"
                       required
                       placeholder="your_email@company.com"
                       className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                 <div className="relative group">
                    <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-white transition-colors"></i>
                    <input 
                       type="password"
                       required
                       placeholder="••••••••"
                       className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                    />
                 </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 px-5 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 animate-in shake">
                   <i className="fas fa-exclamation-circle text-sm"></i>
                   <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                </div>
              )}

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-slate-100 active:scale-95 disabled:opacity-50 shadow-xl"
              >
                 {loading ? 'Logging in...' : 'Sign In'}
              </button>
           </form>

           <div className="mt-20 pt-8 border-t border-white/5 flex items-center justify-between opacity-30">
              <span className="text-[10px] font-bold uppercase tracking-widest">v4.2.0</span>
              <div className="flex gap-4">
                 <i className="fas fa-shield-alt"></i>
                 <i className="fas fa-info-circle"></i>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
