import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="w-full bg-surface-container-low border-t border-slate-200/80 pt-14 pb-10 text-on-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
          {/* Col 1: Popular Bus Routes */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-on-surface">Popular Bus Routes</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-on-surface-variant">
              <li>
                <Link to="/search?origin=Bengaluru&destination=Hyderabad" className="hover:text-primary transition-colors">
                  Bengaluru to Hyderabad Bus
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Mumbai&destination=Pune" className="hover:text-primary transition-colors">
                  Mumbai to Pune Express
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Delhi&destination=Manali" className="hover:text-primary transition-colors">
                  Delhi to Manali Volvo
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Chennai&destination=Coimbatore" className="hover:text-primary transition-colors">
                  Chennai to Coimbatore Sleeper
                </Link>
              </li>
              <li>
                <Link to="/search?origin=Bengaluru&destination=Goa" className="hover:text-primary transition-colors">
                  Bengaluru to Goa Superfast
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Top Bus Operators */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-on-surface">Top Bus Operators</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-on-surface-variant">
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>VRL Logistics Travels</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>SRS Travels Royal Fleet</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>Orange Premium Travels</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>KSRTC Swift Multi-Axle</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>IntrCity SmartBus Network</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Support */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-on-surface">Customer Support</h4>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              24x7 Dedicated Passenger Assistance hotline across India.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-slate-200/60 shadow-xs">
              <span className="material-symbols-outlined text-primary text-[26px]">support_agent</span>
              <div>
                <p className="text-[11px] text-on-surface-variant">Toll Free Hotline</p>
                <p className="text-sm font-bold text-on-surface">1800 209 8899</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant">Email: support@algionsbus.com</p>
          </div>

          {/* Col 4: Evaluation & Mobile App */}
          <div className="space-y-4">
            <h4 className="font-bold text-base text-on-surface">Assessment Credentials</h4>
            <div className="p-3 bg-surface-container-lowest rounded-2xl border border-slate-200/80 shadow-xs text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">Admin:</span>
                <span className="font-mono text-slate-600">admin@algions.com</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-1">
                <span className="font-bold text-secondary">Passenger:</span>
                <span className="font-mono text-slate-600">rahul@gmail.com</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">Click demo buttons on login page to autofill.</p>
            </div>
          </div>
        </div>

        {/* 100% Secure Checkout Banner */}
        <div className="py-6 bg-surface-container rounded-3xl px-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/60">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-secondary text-[32px]">verified_user</span>
            <div>
              <p className="text-sm font-bold text-on-surface">100% ACID Protected Seat Reservation</p>
              <p className="text-xs text-on-surface-variant">MongoDB compound unique locks prevent double-booking with instant automated refunds.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-on-surface-variant text-xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">lock</span>
              <span className="font-semibold">Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">shield</span>
              <span className="font-semibold">Passenger Insurance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">sync</span>
              <span className="font-semibold">Instant Refund</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-on-surface-variant text-xs border-t border-slate-200/70 pt-6">
          <p>© {new Date().getFullYear()} AlgionsBus Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/api-docs" target="_blank" className="hover:text-primary transition-colors">Swagger API</Link>
            <Link to="/ticket-lookup" className="hover:text-primary transition-colors">Lookup Ticket</Link>
            <Link to="/search" className="hover:text-primary transition-colors">Search Trips</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
