import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminHeader({ title = 'Fleet Operations & Analytics' }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 border-b border-outline-variant/30 flex items-center justify-between px-6 font-body-md select-none print:hidden">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search buses, trips, PNR, manifests..."
            className="w-full bg-surface-container-low pl-9 pr-4 py-2 rounded-xl border border-outline-variant/50 text-xs font-medium text-on-surface placeholder:text-outline focus:outline-hidden focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
          title="System Notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="font-label-sm text-xs font-bold text-on-surface leading-none">
              {user?.name || 'Administrator'}
            </span>
            <span className="text-[10px] text-on-surface-variant leading-none mt-1">
              Dispatch Admin
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={logout}
          className="p-2 text-outline hover:text-error rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </header>
  );
}

