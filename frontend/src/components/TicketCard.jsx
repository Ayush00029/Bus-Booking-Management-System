import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TicketCard({
  booking,
  onCancelRequest,
  showCancelBtn = true
}) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const isCancelled = booking.bookingStatus === 'CANCELLED';
  const snapshot = booking.tripSnapshot || {};

  const handleCopyPnr = () => {
    if (!booking.pnr) return;
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalFare = booking.totalFare || 0;
  const baseFare = Math.round(totalFare / 1.05);
  const gstAmount = totalFare - baseFare;

  const verificationPin1 = (booking.pnr || 'ALG8').slice(-4).toUpperCase();
  const verificationPin2 = (booking._id?.toString() || '9948').slice(-4).toUpperCase();

  return (
    <div className="relative bg-surface-container-lowest rounded-3xl shadow-xl border border-surface-container-high overflow-hidden print:border-2 print:shadow-none font-body-md text-on-surface">
      {/* Top Decorative Gradient Bar */}
      <div className="h-2.5 bg-gradient-to-r from-primary via-primary-container to-secondary w-full"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 relative">
        {/* Left / Main Ticket Section (Cols 1-8) */}
        <div className="lg:col-span-8 p-6 sm:p-8 space-y-6 relative">
          {/* Header & Vehicle Specs */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 bg-surface-container-low p-5 rounded-2xl border border-surface-container">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full font-label-md text-label-md shadow-xs ${
                  isCancelled ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {isCancelled ? 'cancel' : 'verified'}
                  </span>
                  <span>{isCancelled ? 'Cancelled' : 'Confirmed'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-md text-label-md font-bold">
                  <span className="material-symbols-outlined text-[16px]">airline_seat_recline_extra</span>
                  <span>{snapshot.busType || 'AC Sleeper'}</span>
                </span>
              </div>

              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {snapshot.operatorName || 'Express Intercity'}
              </h3>

              <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                <span>{snapshot.busNumber || 'KA-01-AB-1234'}</span>
                <span className="text-outline-variant">•</span>
                <span>Scheduled Express</span>
              </p>
            </div>

            {/* PNR Box */}
            <div className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-surface-container-high flex flex-col items-start sm:items-end justify-between min-w-[170px]">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                PNR Number
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-headline-sm text-headline-sm text-primary tracking-widest font-mono font-bold">
                  {booking.pnr}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPnr}
                  className="p-1 rounded-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Copy PNR"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
              <span className={`font-label-sm text-label-sm text-secondary transition-opacity text-[10px] ${copied ? 'opacity-100' : 'opacity-0'}`}>
                Copied!
              </span>
            </div>
          </div>

          {/* Route Schedule Visual Block */}
          <div className="bg-surface rounded-2xl p-5 border border-surface-container">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
              <div className="md:col-span-4 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">Origin</span>
                <h4 className="font-headline-md text-headline-md text-on-surface uppercase">
                  {snapshot.sourceCity}
                </h4>
                <p className="font-label-md text-label-md text-primary font-bold">
                  {formatTime(snapshot.departureDateTime || booking.boardingPoint?.time)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {formatDate(snapshot.departureDateTime || booking.boardingPoint?.time)}
                </p>
              </div>

              <div className="md:col-span-4 flex flex-col items-center justify-center text-center py-2">
                <div className="w-full flex items-center relative my-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary relative flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary bg-surface p-0.5 rounded-full text-sm">
                      directions_bus
                    </span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></div>
                </div>
                <span className="text-[10px] text-outline">
                  {snapshot.distanceKm || 350} km Highway Corridor
                </span>
              </div>

              <div className="md:col-span-4 space-y-0.5 md:text-right">
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider block">Destination</span>
                <h4 className="font-headline-md text-headline-md text-on-surface uppercase">
                  {snapshot.destinationCity}
                </h4>
                <p className="font-label-md text-label-md text-secondary font-bold">
                  {formatTime(snapshot.arrivalDateTime || booking.droppingPoint?.time)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {formatDate(snapshot.arrivalDateTime || booking.droppingPoint?.time)}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger & Berth Manifest */}
          <div className="space-y-3">
            <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">badge</span>
              <span>Passengers & Assigned Berths</span>
            </h4>

            <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container space-y-3">
              {(booking.passengers || []).map((p, idx) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-container last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
                      {p.seatNumber}
                    </div>
                    <div>
                      <p className="font-headline-sm text-sm text-on-surface font-bold">{p.name}</p>
                      <p className="text-xs text-on-surface-variant">{p.age} yrs • {p.gender}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-on-surface">₹{p.fare}</span>
                    <span className="text-[10px] text-secondary block font-bold">Guaranteed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs transition shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Print Boarding Pass</span>
            </button>

            {showCancelBtn && !isCancelled && onCancelRequest && (
              <button
                type="button"
                onClick={() => onCancelRequest(booking)}
                className="font-label-md text-xs text-error hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                <span>Cancel Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Scalloped Perforation Divider (Desktop Visual) */}
        <div className="hidden lg:flex absolute top-0 bottom-0 left-[66.6666%] -ml-4 w-8 flex-col items-center justify-between pointer-events-none z-20">
          <div className="w-8 h-8 rounded-full bg-surface -mt-4 shadow-inner"></div>
          <div className="w-0.5 h-full border-r-2 border-dashed border-outline-variant/60 my-2"></div>
          <div className="w-8 h-8 rounded-full bg-surface -mb-4 shadow-inner"></div>
        </div>

        {/* Right / Conductor Verification Stub & Fare (Cols 9-12) */}
        <div className="lg:col-span-4 bg-surface-container-low p-6 flex flex-col justify-between space-y-6 border-t lg:border-t-0 border-surface-container">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                BOARDING STUB
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-xs font-bold">
                GATE PASS
              </span>
            </div>

            {/* Official Verification Badge & Conductor Pass */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary shadow-xs">
                <span className="material-symbols-outlined text-[30px] text-primary">verified_user</span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider mt-0.5">VERIFIED</span>
              </div>

              {/* Boarding Access PIN Box */}
              <div className="w-full bg-surface-container-low rounded-xl p-2.5 border-dashed border border-outline-variant/60 text-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Conductor PIN
                </span>
                <span className="font-headline-md font-mono font-bold tracking-widest text-primary text-base">
                  {verificationPin1}-{verificationPin2}
                </span>
              </div>
            </div>

            {/* Fare Summary */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high space-y-2 text-xs">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Base Fare:</span>
                <span className="font-mono">₹{baseFare}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>GST (5%):</span>
                <span className="font-mono">₹{gstAmount}</span>
              </div>
              <div className="pt-2 border-t border-surface-container flex justify-between items-center font-bold text-sm">
                <span>{isCancelled ? 'Refunded Total' : 'Total Paid'}:</span>
                <span className={`font-mono text-base ${isCancelled ? 'text-error' : 'text-secondary'}`}>
                  ₹{totalFare}
                </span>
              </div>
            </div>
          </div>

          <Link
            to={`/confirmation/${booking.pnr}`}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-xs font-bold text-center transition block print:hidden"
          >
            View Full Digital E-Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}
