import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/buses', label: 'Buses', icon: 'directions_bus' },
    { path: '/admin/routes', label: 'Routes', icon: 'alt_route' },
    { path: '/admin/trips', label: 'Trips', icon: 'schedule' },
    { path: '/admin/bookings', label: 'Bookings', icon: 'confirmation_number' },
    { path: '/admin/manifests', label: 'Manifests', icon: 'assignment' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: 'receipt_long' }
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-inverse-surface z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] font-body-md select-none print:hidden">
      <div className="flex flex-col">
        {/* Header / Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-outline/20">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-on-primary text-[20px]">directions_bus</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-inverse-on-surface tracking-tight leading-none">
                AlgionsBus
              </span>
              <span className="font-label-sm text-[10px] text-inverse-on-surface/60 uppercase tracking-widest mt-0.5">
                Fleet Ops
              </span>
            </div>
          </Link>
          <span className="material-symbols-outlined text-inverse-on-surface/60 text-[18px]">
            tune
          </span>
        </div>

        {/* Section Title */}
        <div className="px-6 py-3">
          <div className="text-inverse-on-surface/40 font-label-sm text-[10px] uppercase tracking-wider font-bold">
            Operations Core
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-xs transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                    : 'text-inverse-on-surface/75 hover:bg-white/10 hover:text-inverse-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Passenger App Switch */}
        <div className="px-4 mt-6">
          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-inverse-on-surface/75 hover:text-inverse-on-surface text-xs font-semibold transition"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary-fixed">open_in_new</span>
              <span>Passenger App</span>
            </div>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

