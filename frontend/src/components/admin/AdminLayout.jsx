import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

/**
 * Universal Admin Layout Shell
 * Provides persistent left dark executive sidebar, top telemetry header,
 * and responsive content container across all admin management sections.
 */
export default function AdminLayout({ children, title = 'Fleet Operations & Analytics' }) {
  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* 1. Persistent Left Dark Executive Sidebar */}
      <AdminSidebar />

      {/* 2. Main Content Canvas Padded for Sidebar */}
      <div className="pl-64">
        {/* Top Header with Global Search and Hub Filter */}
        <AdminHeader title={title} />

        {/* Content Body */}
        <main className="relative pt-16 bg-surface min-h-screen w-full px-6 lg:px-8 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}

