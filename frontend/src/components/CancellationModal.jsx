import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert } from 'lucide-react';

export default function CancellationModal({
  booking,
  isOpen,
  onClose,
  onConfirmCancel,
  loading = false
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  // Calculate simulated refund preview
  const departureTime = new Date(booking.tripSnapshot?.departureDateTime || booking.trip?.departureDateTime).getTime();
  const now = Date.now();
  const diffHours = (departureTime - now) / (1000 * 60 * 60);

  let refundPercent = 0;
  if (diffHours > 24) {
    refundPercent = 80;
  } else if (diffHours >= 12) {
    refundPercent = 50;
  } else {
    refundPercent = 0;
  }

  const refundAmount = Math.round((booking.totalFare * refundPercent) / 100);
  const cancellationFee = booking.totalFare - refundAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    onConfirmCancel(booking._id, reason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Booking</h3>
            <p className="text-xs text-slate-500 font-mono">PNR: {booking.pnr}</p>
          </div>
        </div>

        {/* Policy Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Configured Cancellation & Refund Policy:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
            <li className={diffHours > 24 ? 'text-emerald-700 font-semibold' : ''}>
              &gt; 24 hrs prior to departure: <strong>80% Refund</strong> (20% fee)
            </li>
            <li className={diffHours <= 24 && diffHours >= 12 ? 'text-amber-700 font-semibold' : ''}>
              12 to 24 hrs prior to departure: <strong>50% Refund</strong> (50% fee)
            </li>
            <li className={diffHours < 12 ? 'text-red-700 font-semibold' : ''}>
              &lt; 12 hrs prior or post-departure: <strong>No Refund</strong> (100% fee)
            </li>
          </ul>
        </div>

        {/* Fare and Refund Breakdown */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Total Fare Paid:</span>
            <span className="font-semibold text-slate-900">₹{booking.totalFare}</span>
          </div>
          <div className="flex justify-between text-slate-600 text-xs">
            <span>Cancellation Penalty ({100 - refundPercent}%):</span>
            <span className="font-semibold text-red-600">- ₹{cancellationFee}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
            <span>Simulated Refund Amount:</span>
            <span className="text-emerald-600">₹{refundAmount}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            * Reserved seats ({booking.seats.join(', ')}) will be atomically released and returned to public inventory.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, change of plans..."
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

