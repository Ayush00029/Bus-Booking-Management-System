import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import TicketCard from '../../components/TicketCard';
import CancellationModal from '../../components/CancellationModal';
import { Ticket, Search, Filter, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pnrSearch, setPnrSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (pnrSearch) params.pnr = pnrSearch;

      const res = await bookingApi.getAllBookings(params);
      if (res.success && res.data) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadBookings();
  };

  const handleConfirmCancel = async (bookingId, reason) => {
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(bookingId, { cancellationReason: reason });
      if (res.success && res.data) {
        setBookings(bookings.map(b => (b._id === bookingId ? res.data : b)));
        setCancelModalOpen(false);
        setSelectedBookingForCancel(null);
      }
    } catch (err) {
      alert('Cancel failed: ' + (err.message || 'Error cancelling booking'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-amber-600" />
            Master Booking Management
          </h1>
          <p className="text-xs text-slate-500">
            Audit and manage passenger tickets, verify payment reconciliation, and process refunds
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by PNR..."
              value={pnrSearch}
              onChange={(e) => setPnrSearch(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PNR</th>
                <th className="py-3 px-4">Booked By</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4 text-right">Total Fare</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No bookings found matching query.
                  </td>
                </tr>
              ) : (
                bookings.map(b => {
                  const isExpanded = expandedBookingId === b._id;
                  const snapshot = b.tripSnapshot || {};

                  return (
                    <React.Fragment key={b._id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {b.pnr}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block text-slate-900">{b.user?.name || 'N/A'}</span>
                          <span className="text-[11px] text-slate-400">{b.contactEmail}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {snapshot.sourceCity} → {snapshot.destinationCity}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {new Date(snapshot.departureDateTime || b.boardingPoint?.time).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-800">
                          {b.seats.join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{b.totalFare}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${
                            b.bookingStatus === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setExpandedBookingId(isExpanded ? null : b._id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px]"
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                            {b.bookingStatus === 'CONFIRMED' && (
                              <button
                                onClick={() => {
                                  setSelectedBookingForCancel(b);
                                  setCancelModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded text-[11px]"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-slate-50 border-y border-slate-200">
                            <TicketCard booking={b} showCancelBtn={false} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

