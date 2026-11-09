import React, { useState } from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    const handleSwitchToAdmin = async () => {
      setSwitching(true);
      setError('');
      try {
        await login('admin@algions.com', 'admin123');
      } catch (err) {
        setError(err.message || 'Failed to switch to administrator account');
      } finally {
        setSwitching(false);
      }
    };

    const handleSignOut = async () => {
      await logout();
      navigate('/login', { state: { from: location } });
    };

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface">
        <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-red-200/80 text-center max-w-md w-full space-y-5 animate-fadeIn">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-[32px]">shield_person</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Admin Console Restricted</h2>
            <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
              You are currently browsing the <strong>Operator Control Panel</strong> (<code className="text-primary font-mono font-bold">/admin</code>), which is reserved for fleet dispatchers and administrators.
            </p>
          </div>

          {/* Current Account Card */}
          <div className="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/40 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface truncate max-w-[170px]">
                  {user?.name || 'Passenger User'}
                </span>
                <span className="text-[10px] text-on-surface-variant truncate max-w-[170px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
              {user?.role || 'Passenger'}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <Link
              to="/"
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">directions_bus</span>
              <span>Go to Passenger Booking App</span>
            </Link>

            <button
              type="button"
              disabled={switching}
              onClick={handleSwitchToAdmin}
              className="w-full py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {switching ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span>Switching to Admin...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] text-secondary">admin_panel_settings</span>
                  <span>Switch to Admin Account (1-Click)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full py-1.5 text-on-surface-variant hover:text-on-surface font-medium text-xs transition cursor-pointer"
            >
              Sign In with Other Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
