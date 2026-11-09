import React, { useState } from 'react';
import { bookingApi } from '../api/bookingApi';
import TicketCard from '../components/TicketCard';

export default function TicketLookupPage() {
  const [pnrInput, setPnrInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      const res = await bookingApi.lookupTicket(pnrInput.trim(), contactInput.trim());
      if (res.success && res.data) {
        setBooking(res.data);
      }
    } catch (err) {
      setError(err.message || `No booking found for PNR: ${pnrInput}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 bg-primary-fixed text-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <span className="material-symbols-outlined text-3xl">confirmation_number</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Digital E-Ticket & PNR Lookup
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Enter your official 10-character booking PNR (e.g., <span className="font-mono font-bold text-primary">ALG-XXXXXX</span>) to inspect your live boarding pass, conductor PIN, and journey status.
          </p>

          {/* Search Form */}
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 pt-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-outline text-lg">
                search
              </span>
              <input
                type="text"
                required
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                placeholder="Enter PNR Code (e.g. ALG-XXXXXX)"
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-surface-container-high rounded-xl text-sm font-mono uppercase font-bold text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-hidden shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary hover:bg-primary-container text-white font-headline-sm text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Retrieve Ticket</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-error-container text-on-error-container text-xs rounded-2xl flex items-center gap-2.5 max-w-xl mx-auto shadow-xs">
            <span className="material-symbols-outlined text-lg">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {booking && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <TicketCard booking={booking} showCancelBtn={false} />
          </div>
        )}
      </div>
    </div>
  );
}
