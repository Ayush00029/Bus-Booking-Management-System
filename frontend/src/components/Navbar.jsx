import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  User,
  LogOut,
  LayoutDashboard,
  Ticket,
  Search,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Left Section: Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-xs">
              <Bus className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-primary tracking-tight font-headline">
                AlgionsBus
              </span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider -mt-1">
                Intercity Transit
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/search"
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/search')
                  ? 'bg-surface-container text-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <Search className="w-4 h-4 text-primary" />
              <span>Bus Tickets</span>
            </Link>

            <Link
              to="/ticket-lookup"
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/ticket-lookup')
                  ? 'bg-surface-container text-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>Lookup Ticket</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/my-bookings')
                    ? 'bg-surface-container text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Currency, Auth & Admin Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Region / Currency Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-slate-200/70 text-on-surface text-xs font-semibold shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">language</span>
            <span>ENG</span>
            <span className="text-outline-variant">|</span>
            <span>₹ INR</span>
          </div>

          {/* Admin Portal Shortcut */}
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-primary rounded-xl text-xs font-bold hover:bg-primary-fixed-dim transition shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-slate-200/80 transition shadow-xs text-xs font-semibold text-on-surface"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
                <span className="hidden sm:inline text-[10px] bg-surface-container text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                  {user?.role}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] text-on-surface-variant">Signed in as</p>
                    <p className="text-xs font-bold text-on-surface truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/my-bookings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-low transition font-medium"
                  >
                    <Ticket className="w-4 h-4 text-primary" />
                    <span>My Bookings</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-primary hover:bg-primary-fixed transition font-bold"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>Admin Management</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs text-error hover:bg-error-container/20 transition font-medium"
                    >
                      <LogOut className="w-4 h-4 text-error" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:bg-on-secondary-container transition-all shadow-md shadow-secondary/20 active:scale-95"
              >
                Login / Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle button */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200/80 bg-surface-container-lowest px-4 pt-3 pb-5 space-y-2.5 shadow-xl">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <Search className="w-4 h-4 text-primary" />
            <span>Bus Tickets</span>
          </Link>

          <Link
            to="/ticket-lookup"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Lookup Ticket</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                <Ticket className="w-4 h-4 text-secondary" />
                <span>My Bookings</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-primary bg-primary-fixed"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Admin Console</span>
                </Link>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-error hover:bg-error-container/20 rounded-xl"
                >
                  Sign Out ({user?.name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm shadow-sm"
              >
                Login / Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
