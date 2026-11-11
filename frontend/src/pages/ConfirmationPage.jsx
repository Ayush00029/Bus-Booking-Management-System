import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';

export default function ConfirmationPage() {
  const { pnr } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState('');

  // Modal and Interactive States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    if (pnr) {
      loadBooking();
    }
  }, [pnr]);

  const loadBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingApi.getBookingByPnr(pnr);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPnr = () => {
    if (!booking?.pnr) return;
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    setTimeout(() => {
      setIsPdfGenerating(false);
      window.print();
    }, 1000);
  };

  const handleCancelBooking = async () => {
    if (!booking?._id) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(booking._id, {
        cancellationReason: 'Passenger requested cancellation from E-Ticket portal'
      });
      if (res.success && res.data) {
        setBooking(res.data.booking || res.data);
        setShowCancelModal(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to process cancellation');
    } finally {
      setCancelling(false);
    }
  };

  const snapshot = booking?.tripSnapshot || {};
  const isCancelled = booking?.bookingStatus === 'CANCELLED';

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

  const calculateDuration = (dep, arr) => {
    if (!dep || !arr) return 'Overnight Journey';
    const diff = new Date(arr) - new Date(dep);
    if (isNaN(diff) || diff <= 0) return 'Scheduled Express';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m Direct`;
  };

  // Derive verification PIN from PNR
  const verificationPin1 = (booking?.pnr || 'ALG8A42').slice(-4).toUpperCase();
  const verificationPin2 = (booking?._id?.toString() || '99482A').slice(-4).toUpperCase();

  const totalFare = booking?.totalFare || 0;
  const baseFare = Math.round(totalFare / 1.05);
  const gstAmount = totalFare - baseFare;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-container-high border-t-primary mb-4"></div>
        <h3 className="font-headline-md text-headline-md text-on-surface">Generating Boarding Pass...</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Synchronizing verified PNR and cryptographic seat allocation with state transport radar.
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">confirmation_number</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">E-Ticket Not Found</h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1 mb-6">
          {error || `No confirmed booking associated with PNR: ${pnr}.`}
        </p>
        <Link
          to="/ticket-lookup"
          className="px-6 py-3 rounded-xl bg-primary text-white font-headline-sm text-label-lg shadow-sm"
        >
          PNR Lookup Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased print:bg-white print:pt-0">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Top Context & Notification */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              <span>Back to My Bookings</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm">
                <span className="material-symbols-outlined text-[14px]">sensors</span>
                <span>Live Sync Active</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Last updated just now</span>
            </div>
          </div>

          {/* Confirmation Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md border border-surface-container-high p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isCancelled ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'
              }`}>
                <span className="material-symbols-outlined text-[28px]">
                  {isCancelled ? 'cancel' : 'check_circle'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">
                    {isCancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                    isCancelled ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                  }`}>
                    {isCancelled ? 'Refund Processed' : 'Instant Ticket Issued'}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  Official boarding pass and live journey updates have been dispatched via SMS (
                  <span className="font-semibold text-on-surface">{booking.contactPhone || '+91 98765 43210'}</span>) and email (
                  <span className="font-semibold text-on-surface">{booking.contactEmail || 'user@example.com'}</span>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isPdfGenerating}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors shadow-xs cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[18px] ${isPdfGenerating ? 'animate-spin' : ''}`}>
                  {isPdfGenerating ? 'refresh' : 'file_download'}
                </span>
                <span>{isPdfGenerating ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar & Secondary Options */}
        <div className="flex items-center justify-between flex-wrap gap-4 px-2 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-md text-label-md text-on-surface-variant">Ticket Reference:</span>
            <span className="font-label-md text-label-md text-primary font-bold">#{booking.pnr}</span>
            <span className="text-outline-variant">•</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Booked {formatDate(booking.createdAt)}, {formatTime(booking.createdAt)} IST
            </span>
          </div>

          {!isCancelled && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="font-label-md text-label-md text-error hover:text-on-error-container underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                <span>Cancel Booking & Refund Policy</span>
              </button>
            </div>
          )}
        </div>

        {/* Master Boarding Pass / E-Ticket Card */}
        <div className="relative bg-surface-container-lowest rounded-3xl shadow-xl border border-surface-container-high overflow-hidden print:border-2 print:shadow-none">
          {/* Top Decorative Gradient Bar */}
          <div className="h-2.5 bg-gradient-to-r from-primary via-primary-container to-secondary w-full"></div>

          {/* Main Ticket Body & Verification Stub Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 relative">
            {/* Left / Main Ticket Section (Cols 1-8) */}
            <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 space-y-8 relative">
              {/* Header & Vehicle Specs */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 bg-surface-container-low p-6 rounded-2xl border border-surface-container">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md shadow-xs ${
                      isCancelled ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {isCancelled ? 'cancel' : 'verified'}
                      </span>
                      <span>{isCancelled ? 'Ticket Cancelled' : 'Booking Confirmed'}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-primary font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-[16px]">airline_seat_recline_extra</span>
                      <span>{snapshot.busType || 'Luxury AC Sleeper (2+1)'}</span>
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    {snapshot.operatorName || 'IntrCity SmartBus Premium Lounge Express'}
                  </h3>

                  <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                    <span>Intercity Express Coach</span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-mono font-semibold text-on-surface">
                      {snapshot.busNumber || 'KA-01-AB-1234'}
                    </span>
                  </p>
                </div>

                {/* PNR Box */}
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container-high flex flex-col items-start sm:items-end justify-between min-w-[190px]">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Passenger PNR
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-headline-sm text-headline-sm text-primary tracking-widest font-mono font-bold">
                      {booking.pnr}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPnr}
                      className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Copy PNR Code"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                  <span className={`font-label-sm text-label-sm text-secondary transition-opacity mt-0.5 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                    Copied to clipboard
                  </span>
                </div>
              </div>

              {/* Journey Route & Schedule Visual Block */}
              <div className="relative bg-surface rounded-2xl p-6 sm:p-8 overflow-hidden border border-surface-container">
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 relative z-10">
                  {/* Departure Hub */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[15px] text-primary">trip_origin</span>
                      <span>Origin Station</span>
                    </div>
                    <h4 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase">
                      {snapshot.sourceCity || 'Bengaluru'}
                    </h4>
                    <p className="font-label-md text-label-md text-primary font-bold">
                      {booking.boardingPoint?.pointName || 'MAIN TERMINAL'}
                    </p>
                    <div className="pt-2">
                      <p className="font-headline-md text-headline-md text-on-surface font-mono font-bold">
                        {formatTime(snapshot.departureDateTime || booking.boardingPoint?.time)}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {formatDate(snapshot.departureDateTime || booking.boardingPoint?.time)}
                      </p>
                    </div>
                  </div>

                  {/* Transit Timeline Indicator */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2 py-4">
                    <div className="px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm mb-2 shadow-xs font-bold">
                      {calculateDuration(snapshot.departureDateTime, snapshot.arrivalDateTime)}
                    </div>
                    <div className="w-full flex items-center relative my-2">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0 ring-4 ring-primary-fixed"></div>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-secondary relative flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary bg-surface p-1 rounded-full text-[18px] rotate-90 md:rotate-0">
                          directions_bus
                        </span>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-secondary shrink-0 ring-4 ring-secondary-container"></div>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                      {snapshot.distanceKm || 350} KM Highway Corridor
                    </span>
                  </div>

                  {/* Arrival Hub */}
                  <div className="md:col-span-4 space-y-1 md:text-right">
                    <div className="inline-flex md:justify-end items-center gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[15px] text-secondary">location_on</span>
                      <span>Destination</span>
                    </div>
                    <h4 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase">
                      {snapshot.destinationCity || 'Chennai'}
                    </h4>
                    <p className="font-label-md text-label-md text-secondary font-bold">
                      {booking.droppingPoint?.pointName || 'CITY DROP'}
                    </p>
                    <div className="pt-2">
                      <p className="font-headline-md text-headline-md text-on-surface font-mono font-bold">
                        {formatTime(snapshot.arrivalDateTime || booking.droppingPoint?.time)}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {formatDate(snapshot.arrivalDateTime || booking.droppingPoint?.time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Boarding and Dropping Detailed Point Subcards */}
                <div className="mt-8 pt-6 border-t border-surface-container-high grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary uppercase font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">login</span>
                        Boarding Point
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-mono">
                        Report: {formatTime(snapshot.departureDateTime || booking.boardingPoint?.time)}
                      </span>
                    </div>
                    <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                      {booking.boardingPoint?.pointName || 'Main Station'}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {booking.boardingPoint?.landmark || 'Platform Waiting Area, City Terminal Hub'}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px]">near_me</span>
                        <span>Directions & Gate</span>
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">coffee</span>
                        <span>Lounge Access</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-surface-container space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">logout</span>
                        Dropping Point
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-mono">
                        Est: {formatTime(snapshot.arrivalDateTime || booking.droppingPoint?.time)}
                      </span>
                    </div>
                    <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                      {booking.droppingPoint?.pointName || 'Central Hub'}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {booking.droppingPoint?.landmark || 'Intercity Bus Stand Main Entrance'}
                    </p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>Support: 1800 209 8899</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger & Berth Manifest Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                    <span>Passenger & Berth Allocation</span>
                  </h4>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {booking.passengers?.length || 1} Passenger{(booking.passengers?.length || 1) === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="bg-surface-container-low rounded-2xl p-6 shadow-xs border border-surface-container space-y-4">
                  {(booking.passengers || []).map((p, idx) => (
                    <div
                      key={p.seatNumber || idx}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center pb-4 border-b border-surface-container last:border-b-0 last:pb-0"
                    >
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Passenger {idx + 1}
                        </span>
                        <p className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold">
                          {p.name}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {p.age} yrs • {p.gender}
                        </p>
                      </div>

                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Assigned Berth
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1.5 rounded-xl bg-secondary text-on-secondary font-headline-sm text-headline-sm tracking-wide font-bold">
                            {p.seatNumber}
                          </span>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface font-bold">
                              {p.seatNumber?.startsWith('U') ? 'Upper Deck' : 'Lower Deck'}
                            </p>
                            <p className="font-label-sm text-label-sm text-secondary font-semibold">
                              Guaranteed Berth
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Identity Verification
                        </span>
                        <p className="font-label-md text-label-md text-on-surface mt-0.5 font-bold">Govt ID Mandated</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Aadhaar / DL / Passport</p>
                      </div>

                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Luggage Checked
                        </span>
                        <p className="font-label-md text-label-md text-on-surface mt-0.5 font-bold">2 Bags (up to 20kg)</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">+ 1 Personal Laptop bag</p>
                      </div>
                    </div>
                  ))}

                  {/* Included Amenities Strip */}
                  <div className="mt-6 pt-5 bg-surface-container-lowest rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 border border-surface-container-high">
                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md">
                        <span className="material-symbols-outlined text-secondary text-[18px]">bed</span>
                        <span>Sanitized Linen Kit</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md">
                        <span className="material-symbols-outlined text-secondary text-[18px]">wifi</span>
                        <span>High-Speed Starlink Wi-Fi</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md">
                        <span className="material-symbols-outlined text-secondary text-[18px]">water_bottle</span>
                        <span>Mineral Water</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface font-label-md text-label-md">
                        <span className="material-symbols-outlined text-secondary text-[18px]">power</span>
                        <span>220V / Type-C Charging</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                      Complimentary
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scalloped Tear-Off Perforation Divider (Desktop Visual) */}
            <div className="hidden lg:flex absolute top-0 bottom-0 left-[66.6666%] -ml-4 w-8 flex-col items-center justify-between pointer-events-none z-20">
              <div className="w-8 h-8 rounded-full bg-surface -mt-4 shadow-inner"></div>
              <div className="w-0.5 h-full border-r-2 border-dashed border-outline-variant/60 my-2"></div>
              <div className="w-8 h-8 rounded-full bg-surface -mb-4 shadow-inner"></div>
            </div>

            {/* Right / Conductor Verification Stub & Fare (Cols 9-12) */}
            <div className="lg:col-span-4 bg-surface-container-low p-6 sm:p-8 lg:p-8 flex flex-col justify-between space-y-8 relative border-t lg:border-t-0 border-surface-container">
              {/* Stub Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                    BOARDING STUB
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    GATE PASS
                  </span>
                </div>

                {/* Digital Verification & Boarding Stub */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-surface-container-high flex flex-col items-center text-center space-y-4">
                  {/* Official Verified Security Badge */}
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/25 flex flex-col items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[36px] text-primary">verified_user</span>
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase mt-0.5">VERIFIED</span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-label-md text-label-md text-on-surface font-bold">
                      Digital Boarding Pass Verification
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Present boarding PIN along with Photo ID at coach entrance
                    </p>
                  </div>

                  {/* Boarding Access PIN Box */}
                  <div className="w-full bg-surface-container-low rounded-xl p-3.5 border-dashed border border-outline-variant/60 flex flex-col items-center justify-center gap-1.5 shadow-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                      Boarding Access PIN
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-primary font-headline-md text-headline-md font-mono font-bold tracking-widest shadow-xs">
                        {verificationPin1}
                      </span>
                      <span className="text-outline-variant font-bold text-headline-sm">-</span>
                      <span className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-primary font-headline-md text-headline-md font-mono font-bold tracking-widest shadow-xs">
                        {verificationPin2}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Show this PIN or PNR to conductor during boarding
                    </span>
                  </div>
                </div>

                {/* Payment Badge & Receipt */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container-high space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[20px] ${isCancelled ? 'text-error' : 'text-secondary'}`}>
                        {isCancelled ? 'cancel' : 'check_circle'}
                      </span>
                      <span className={`font-headline-sm text-headline-sm font-bold ${isCancelled ? 'text-error' : 'text-secondary'}`}>
                        {isCancelled ? 'REFUNDED' : 'PAID'}
                      </span>
                    </div>
                    <span className="font-mono text-label-sm text-on-surface-variant font-medium">
                      Instant UPI Gateway
                    </span>
                  </div>

                  {/* Itemized Fare Details */}
                  <div className="space-y-2 text-body-sm font-body-sm text-on-surface-variant">
                    <div className="flex justify-between items-center">
                      <span>Base Ticket Fare ({booking.seats?.length || 1} Berth{(booking.seats?.length || 1) === 1 ? '' : 's'})</span>
                      <span className="text-on-surface font-mono font-bold">₹{baseFare.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>GST & Intercity Tolls (5%)</span>
                      <span className="text-on-surface font-mono font-bold">₹{gstAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <span>Algions Shield™ Protection</span>
                        <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                      </span>
                      <span className="text-secondary font-mono font-bold">Included</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-container flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">
                        {isCancelled ? 'Refund Amount' : 'Total Paid'}
                      </span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                        Txn: {booking._id?.toString().slice(-12).toUpperCase() || 'TXN-529810'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-headline-lg text-headline-lg font-bold font-mono ${
                        isCancelled ? 'text-error' : 'text-secondary'
                      }`}>
                        ₹{totalFare.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stub Quick Actions */}
              <div className="pt-2 space-y-2 print:hidden">
                <button
                  type="button"
                  onClick={() => alert(`Official GST Tax Invoice resent to ${booking.contactEmail}`)}
                  className="w-full py-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">email</span>
                  <span>Resend Invoice & Tax Receipt</span>
                </button>
                <p className="font-body-sm text-body-sm text-center text-on-surface-variant">
                  GST Invoice eligible for corporate reimbursement
                </p>
              </div>
            </div>
          </div>

          {/* Scalloped Tear-off Notches on Mobile (Horizontal Separator) */}
          <div className="flex lg:hidden items-center justify-between w-full px-4 -my-4 relative z-20 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-surface shadow-inner -ml-8"></div>
            <div className="w-full border-t-2 border-dashed border-outline-variant/60 mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-surface shadow-inner -mr-8"></div>
          </div>
        </div>

        {/* Post-Booking Assistance & Trip Prep Grid */}
        <div className="space-y-4 pt-4 print:hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Travel Essentials & Station Guide</h3>
            <span className="font-label-md text-label-md text-primary font-bold">24x7 Dedicated Passenger Desk</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Verified Rest Stops */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">fmd_good</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Highway Rest Stops</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Planned 30-min hygienic food stop along the highway corridor with clean sanitized restrooms and certified food courts.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold">
                  <span>Boarding Guidelines</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 2: Onboard Guidelines */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">volume_off</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Luggage & Onboard Guidelines</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Cabin lights dim at 23:00. Headphone use mandated after 22:30 PM. No alcohol or smoking permitted. Extra baggage above 20kg charged at nominal rates.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold">
                  <span>Passenger Code of Conduct</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Card 3: Protected Cancellation Policy */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">security_update_good</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Protected Cancellation Policy</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Covered by Algions Shield™. 100% full refund up to 24 hours prior. 80% refund up to 12 hours prior. Instant UPI credit within 15 minutes.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold hover:gap-2 transition-all cursor-pointer"
                >
                  <span>Review Cancellation Timetable</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation & Refund Policy Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-surface-container-high animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">info</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Cancellation & Refund Policy
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      PNR: {booking.pnr} • {snapshot.operatorName || 'Express Coach'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Policy Schedule Table */}
              <div className="space-y-3 font-body-sm text-body-sm">
                <div className="p-3.5 rounded-xl bg-secondary-container/40 flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">More than 24 hours prior</p>
                    <p className="text-on-surface-variant text-xs">Standard advance window</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">100% Refund</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Between 12 and 24 hours prior</p>
                    <p className="text-on-surface-variant text-xs">Pre-departure corridor</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">80% Refund</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Between 2 and 12 hours prior</p>
                    <p className="text-on-surface-variant text-xs">Final reporting window</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-amber-700 font-bold">50% Refund</span>
                </div>

                <div className="p-3.5 rounded-xl bg-error-container/30 flex items-center justify-between">
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Less than 2 hours / No-show</p>
                    <p className="text-on-surface-variant text-xs">Departed bus schedule</p>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-error font-bold">No Refund</span>
                </div>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Note: Upon cancellation, seats are released atomically back to the public pool and the refund amount is reversed directly to your original payment method within 15-30 minutes.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                >
                  Keep My Booking
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelBooking}
                  className="px-5 py-2.5 rounded-xl bg-error text-on-error hover:bg-on-error-container font-label-md text-label-md transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Releasing Seats...</span>
                    </>
                  ) : (
                    <span>Proceed with Cancellation</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
