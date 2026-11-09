import React, { useState, useEffect } from 'react';
import { bookingApi } from '../api/bookingApi';
import TicketCard from '../components/TicketCard';
import CancellationModal from '../components/CancellationModal';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Cancellation modal state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Expanded ticket preview state
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingApi.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (bookingId, reason) => {
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(bookingId, { cancellationReason: reason });
      if (res.success && res.data) {
        // Update local booking state
        setBookings(bookings.map(b => (b._id === bookingId ? res.data : b)));
        setCancelModalOpen(false);
        setSelectedBookingForCancel(null);
      }
    } catch (err) {
      alert('Cancellation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'ALL') return true;
    return b.bookingStatus === statusFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            My Bookings & Tickets
          </h1>
          <p className="text-xs text-slate-500">
            View your journey details, download digital tickets, and manage cancellations
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'ALL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'CONFIRMED'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Confirmed ({bookings.filter(b => b.bookingStatus === 'CONFIRMED').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled ({bookings.filter(b => b.bookingStatus === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-xs text-slate-500">Retrieving your bookings...</p>
        </div>
      )}

      {!loading && filteredBookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
            🎟️
          </div>
          <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any bookings matching this filter. Search for trips to schedule your next bus ride!
          </p>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map(booking => {
          const isCancelled = booking.bookingStatus === 'CANCELLED';
          const isExpanded = expandedBookingId === booking._id;
          const snapshot = booking.tripSnapshot || {};

          return (
            <div
              key={booking._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card Header & Summary Bar */}
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      PNR: {booking.pnr}
                    </span>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase ${
                      isCancelled
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">
                    {snapshot.sourceCity} → {snapshot.destinationCity}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {snapshot.operatorName} • {snapshot.busType}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block">Departure</span>
                  <span className="text-sm font-bold text-slate-800">
                    {new Date(snapshot.departureDateTime || booking.boardingPoint?.time).toLocaleDateString()} at{' '}
                    {new Date(snapshot.departureDateTime || booking.boardingPoint?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Seats: <strong className="text-blue-700 font-mono">{booking.seats.join(', ')}</strong> (₹{booking.totalFare})
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setExpandedBookingId(isExpanded ? null : booking._id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>View Ticket <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(booking)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Ticket View */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 p-6 animate-in slide-in-from-top-1 duration-150">
                  <TicketCard
                    booking={booking}
                    onCancelRequest={handleOpenCancelModal}
                    showCancelBtn={!isCancelled}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancellation Modal */}
      <CancellationModal
        booking={selectedBookingForCancel}
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedBookingForCancel(null);
        }}
        onConfirmCancel={handleConfirmCancel}
        loading={cancelling}
      />
    </div>
  );
}

