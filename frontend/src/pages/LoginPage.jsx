import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (from.startsWith('/admin')) {
      setEmail('admin@algions.com');
      setPassword('admin123');
    }
  }, [from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        // Passengers should never be directed to the restricted admin console
        const destination = from.startsWith('/admin') ? '/' : from;
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
            <Bus className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to AlgionsBus
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Access your tickets, booking history, and management portal
          </p>
        </div>

        {/* Demo Credentials Helper Card */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs">
          <span className="font-bold text-blue-900 flex items-center gap-1 mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Quick Demo Autofill Credentials (Click to fill):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@algions.com', 'admin123')}
              className="text-left p-2 bg-white rounded-lg border border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 transition"
            >
              <span className="font-bold text-indigo-700 block text-[11px]">🛡️ System Admin</span>
              <span className="text-slate-500 text-[10px] truncate block">admin@algions.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('rahul@gmail.com', 'password123')}
              className="text-left p-2 bg-white rounded-lg border border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 transition"
            >
              <span className="font-bold text-blue-700 block text-[11px]">👤 Passenger (Rahul)</span>
              <span className="text-slate-500 text-[10px] truncate block">rahul@gmail.com</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

