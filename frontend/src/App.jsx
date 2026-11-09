import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Navigation & Layout
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Passenger Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import ConfirmationPage from './pages/ConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import TicketLookupPage from './pages/TicketLookupPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import BusManagementPage from './pages/admin/BusManagementPage';
import RouteManagementPage from './pages/admin/RouteManagementPage';
import TripManagementPage from './pages/admin/TripManagementPage';
import BookingManagementPage from './pages/admin/BookingManagementPage';
import PassengerManifestPage from './pages/admin/PassengerManifestPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import AdminLayout from './components/admin/AdminLayout';

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] text-[#0b1c30] font-sans">
      <Navbar />

      <main className={`flex-1 ${isAdminRoute ? '' : 'pt-16'}`}>
        <Routes>
              {/* Public & Passenger Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/trips/:id/seats" element={<SeatSelectionPage />} />
              <Route path="/select-seats/:id" element={<SeatSelectionPage />} />
              <Route path="/ticket-lookup" element={<TicketLookupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Passenger Routes */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/confirmation/:pnr"
                element={
                  <ProtectedRoute>
                    <ConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes with Universal Persistent Sidebar Shell */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout title="Fleet Operations & Executive Analytics">
                      <AdminDashboardPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/buses"
                element={
                  <AdminRoute>
                    <AdminLayout title="Bus Fleet & Operator Management">
                      <BusManagementPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/routes"
                element={
                  <AdminRoute>
                    <AdminLayout title="Route Network Management">
                      <RouteManagementPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/trips"
                element={
                  <AdminRoute>
                    <AdminLayout title="Trip Schedule Management">
                      <TripManagementPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <AdminRoute>
                    <AdminLayout title="Master Booking Management">
                      <BookingManagementPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/manifests"
                element={
                  <AdminRoute>
                    <AdminLayout title="Passenger Manifest Generator">
                      <PassengerManifestPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <AdminRoute>
                    <AdminLayout title="Security & Compliance Audit Trail">
                      <AuditLogPage />
                    </AdminLayout>
                  </AdminRoute>
                }
              />

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
