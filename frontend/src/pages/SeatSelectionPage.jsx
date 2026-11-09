import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { tripApi } from '../api/tripApi';

export default function SeatSelectionPage() {
  const { id: tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(location.state?.trip || null);
  const [loading, setLoading] = useState(!location.state?.trip);
  const [error, setError] = useState('');

  // Deck view mode: 'lower' | 'upper' | 'both'
  const [deckMode, setDeckMode] = useState('lower');

  // Selected seats state
  const [selectedSeats, setSelectedSeats] = useState(location.state?.selectedSeats || []);
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);

  // Add-ons & protection
  const [shieldProtection, setShieldProtection] = useState(true);

  // Seat Lock Reservation Timer (dynamically synced from server lock)
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lockingSeat, setLockingSeat] = useState(false);

  useEffect(() => {
    fetchTripDetails(true);
  }, [tripId]);

  // Periodic real-time background sync (every 4 seconds) to detect other users' seat locks
  useEffect(() => {
    const pollTimer = setInterval(() => {
      fetchTripDetails(false);
    }, 4000);
    return () => clearInterval(pollTimer);
  }, [tripId]);

  // Live countdown timer for active seat hold
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // Handle lock expiration notification
  useEffect(() => {
    if (secondsLeft === 0 && selectedSeats.length > 0) {
      alert('Your 10-minute temporary seat reservation has expired. Please re-select your berths to continue.');
      setSelectedSeats([]);
      fetchTripDetails(false);
    }
  }, [secondsLeft]);

  const fetchTripDetails = async (isInitial = true) => {
    if (!tripId) return;
    try {
      if (isInitial) {
        setLoading(true);
        setError('');
      }
      const res = await tripApi.getTripById(tripId);
      if (res.success && res.data) {
        const tripData = res.data;
        setTrip(tripData);

        if (tripData.route?.boardingPoints?.length > 0 && !selectedBoardingPoint) {
          setSelectedBoardingPoint(tripData.route.boardingPoints[0]);
        }
        if (tripData.route?.droppingPoints?.length > 0 && !selectedDroppingPoint) {
          setSelectedDroppingPoint(tripData.route.droppingPoints[0]);
        }

        // Sync real-time countdown from server lock remaining seconds
        if (tripData.lockRemainingSeconds > 0) {
          setSecondsLeft(tripData.lockRemainingSeconds);
        }

        // If seats were already locked by this client in a previous tab or page reload
        if (isInitial && tripData.userLockedSeats?.length > 0 && selectedSeats.length === 0) {
          const lockedByMe = (tripData.seatLayout || []).filter((s) =>
            tripData.userLockedSeats.includes(s.seatNumber)
          );
          if (lockedByMe.length > 0) {
            setSelectedSeats(lockedByMe);
          }
        }
      } else if (isInitial) {
        setError('Failed to load trip seat inventory');
      }
    } catch (err) {
      if (isInitial) {
        setError(err.message || 'Could not fetch trip schedule');
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  // Seat layout partitioning
  const seatLayout = trip?.seatLayout || [];
  const hasUpperDeck = seatLayout.some((s) => s.deck === 'upper');

  const lowerDeckSeats = useMemo(() => {
    return seatLayout.filter((s) => s.deck === 'lower');
  }, [seatLayout]);

  const upperDeckSeats = useMemo(() => {
    return seatLayout.filter((s) => s.deck === 'upper');
  }, [seatLayout]);

  const lowerFreeCount = lowerDeckSeats.filter((s) => s.status === 'available').length;
  const upperFreeCount = upperDeckSeats.filter((s) => s.status === 'available').length;

  // Toggle seat selection with real-time backend seat locking
  const handleSeatClick = async (seat) => {
    if (seat.status === 'booked') return;

    if (seat.status === 'locked') {
      alert(`Berth ${seat.seatNumber} is currently held by another passenger. Please choose a different berth.`);
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);

    if (isAlreadySelected) {
      // Unselect: remove locally and release lock in database
      const newSelected = selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber);
      setSelectedSeats(newSelected);
      try {
        await tripApi.unlockSeats(tripId, [seat.seatNumber]);
        fetchTripDetails(false);
      } catch (err) {
        console.warn('Seat unlock error:', err);
      }
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 berths per booking.');
        return;
      }

      setLockingSeat(true);
      try {
        // Acquire real-time 10-minute temporary lock in MongoDB
        const res = await tripApi.lockSeats(tripId, [seat.seatNumber]);
        if (res.success && res.data) {
          setSelectedSeats([...selectedSeats, seat]);
          if (res.data.expiresInSeconds) {
            setSecondsLeft(res.data.expiresInSeconds);
          }
          fetchTripDetails(false);
        }
      } catch (err) {
        alert(err.message || `Berth ${seat.seatNumber} could not be reserved.`);
        fetchTripDetails(false);
      } finally {
        setLockingSeat(false);
      }
    }
  };

  // Pricing calculations
  const baseTicketFare = selectedSeats.reduce((sum, s) => sum + s.fare, 0);
  const gstAmount = Math.round(baseTicketFare * 0.05);
  const shieldFee = shieldProtection && selectedSeats.length > 0 ? 49 : 0;
  const totalPayable = Math.max(0, baseTicketFare + gstAmount + shieldFee);

  // Format timer
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Date & Time formatting
  const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (iso) => {
    if (!iso) return 'Today';
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (dep, arr) => {
    if (!dep || !arr) return '8h 30m';
    const diff = new Date(arr) - new Date(dep);
    if (isNaN(diff) || diff <= 0) return '8h 30m';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m journey`;
  };

  // Proceed to Checkout
  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat before proceeding.');
      return;
    }

    navigate('/checkout', {
      state: {
        trip,
        selectedSeats,
        selectedBoardingPoint,
        selectedDroppingPoint,
        shieldProtection,
        totalPayable
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-surface-container-high border-t-primary mb-4"></div>
        <h3 className="font-headline-md text-headline-md text-on-surface">Initializing Cabin Simulator...</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Locking real-time berth availability across all regional counters.
        </p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="font-headline-md text-headline-md text-on-surface">Trip Not Found</h3>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1 mb-6">
          {error || 'Unable to load cabin plan for the requested trip ID.'}
        </p>
        <Link
          to="/search"
          className="px-6 py-3 rounded-xl bg-primary text-white font-headline-sm text-label-lg shadow-sm"
        >
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* 1. Top Context Navigation & Journey Metadata Strip */}
      <section className="w-full bg-surface-container-lowest shadow-sm border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Breadcrumb & Live Badges */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-primary font-label-md text-label-md hover:text-primary-container transition-colors group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                arrow_back
              </span>
              <span>Back to Search Results</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Live GPS Tracking Active
              </span>
              <span className="text-outline-variant hidden sm:inline">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
                Trip ID: #{trip._id?.toString().slice(-8).toUpperCase() || 'TRIP-9600'}
              </span>
            </div>
          </div>

          {/* Bus Profile & Schedule Info Card */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  {trip.operator?.name || 'IntrCity SmartBus Premium Lounge'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-semibold">
                  {trip.bus?.busType || 'Volvo 9600 B11R Multi-Axle'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                  {trip.operator?.rating || 4.9} ({trip.operator?.reviewCount || '2,890'} reviews)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-on-surface-variant font-body-md text-body-md">
                <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                  <span>{trip.route?.sourceCity || 'Bengaluru'}</span>
                  <span className="text-primary font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-high rounded">
                    {formatTime(trip.departureDateTime)}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary">trending_flat</span>
                  <span>{trip.route?.destinationCity || 'Goa'}</span>
                  <span className="text-primary font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-high rounded">
                    {formatTime(trip.arrivalDateTime)}
                  </span>
                </div>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
                  {formatDate(trip.departureDateTime)}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1 text-secondary font-medium">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {calculateDuration(trip.departureDateTime, trip.arrivalDateTime)}
                </span>
              </div>
            </div>

            {/* Amenities Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm shadow-xs" title="Starlink Satellite WiFi">
                <span className="material-symbols-outlined text-[16px] text-primary">wifi</span>
                <span>Starlink Wi-Fi</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm shadow-xs" title="65W Fast USB-C Port">
                <span className="material-symbols-outlined text-[16px] text-primary">power</span>
                <span>USB-C 65W</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm shadow-xs" title="Sanitized Fleece Blanket & Pillow">
                <span className="material-symbols-outlined text-[16px] text-primary">bed</span>
                <span>Linen Set</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm shadow-xs" title="Individual Reading Lamp & AC">
                <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                <span>Lamp & AC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Legend Bar */}
      <section className="w-full bg-surface-container-low py-3 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 font-label-sm text-label-sm">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span className="font-headline-sm text-label-lg text-on-surface uppercase tracking-wider font-bold">
                Legend:
              </span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-surface-container-lowest border border-surface-container-high shadow-xs flex items-center justify-center">
                  <span className="w-2.5 h-1 bg-surface-container-highest rounded-full"></span>
                </div>
                <span className="text-on-surface-variant">Available</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-secondary text-on-secondary shadow-xs flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <span className="text-on-surface font-semibold">Selected</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                </div>
                <span className="text-outline">Booked</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
                  <span className="material-symbols-outlined text-[13px]">lock_clock</span>
                </div>
                <span className="text-amber-800 font-semibold">Held by Others</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-700">
                  <span className="material-symbols-outlined text-[13px]">female</span>
                </div>
                <span className="text-on-surface-variant">Women Reserved</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-7 rounded-md bg-primary-fixed border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                </div>
                <span className="text-on-surface-variant">Solo Window Berth</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 text-primary font-label-sm text-label-sm bg-surface-container px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[15px]">info</span>
              <span>Click any available berth to reserve (max 6 seats)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Workstation Layout: Dual-Deck Bus Simulator & Sticky Reservation Drawer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT / CENTER: BUS CABIN CANVAS (8 Cols on xl) */}
          <div className="xl:col-span-8 space-y-6">
            {/* Deck Switcher & Cabin Telemetry Head */}
            <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[22px]">directions_bus</span>
                </div>
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">
                    {trip.bus?.busType || 'Volvo 9600 Multi-Axle Deck Plan'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    2+1 Sleeper Architecture • Ultra-Low Vibration Bogie
                  </p>
                </div>
              </div>

              {/* Deck Selector Pills */}
              <div className="inline-flex p-1 rounded-xl bg-surface-container-low shadow-inner border border-surface-container">
                <button
                  type="button"
                  onClick={() => setDeckMode('lower')}
                  className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all flex items-center gap-2 ${
                    deckMode === 'lower'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">airline_seat_flat</span>
                  <span>Lower Deck</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-primary/10 rounded-full font-semibold">
                    {lowerFreeCount} Free
                  </span>
                </button>

                {hasUpperDeck && (
                  <button
                    type="button"
                    onClick={() => setDeckMode('upper')}
                    className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all flex items-center gap-2 ${
                      deckMode === 'upper'
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">airline_seat_flat_angled</span>
                    <span>Upper Deck</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-surface-container rounded-full font-semibold">
                      {upperFreeCount} Free
                    </span>
                  </button>
                )}

                {hasUpperDeck && (
                  <button
                    type="button"
                    onClick={() => setDeckMode('both')}
                    className={`px-3 py-2 rounded-lg font-label-md text-label-md transition-all hidden md:flex items-center gap-1.5 ${
                      deckMode === 'both'
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">splitscreen</span>
                    <span>Dual View</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cabin Visualization Decks */}
            <div className="space-y-6">
              {/* LOWER DECK */}
              {(deckMode === 'lower' || deckMode === 'both') && (
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border border-surface-container-high relative overflow-hidden transition-all duration-300">
                  {/* Metallic Chassis Banner */}
                  <div className="flex items-center justify-between pb-6 border-b border-surface-container">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-secondary"></span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">Lower Deck</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Air Suspension Level • Ergonomic Low Entry
                      </span>
                    </div>
                    <span className="font-label-md text-label-md text-primary bg-primary-fixed/50 px-3 py-1 rounded-full font-bold">
                      Base Fare ₹{trip.baseFare}
                    </span>
                  </div>

                  {/* Cockpit & Front Indicator */}
                  <div className="mt-6 mb-8 bg-surface-container-low rounded-2xl p-4 flex items-center justify-between text-on-surface-variant shadow-inner border border-surface-container">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface font-bold">Passenger Front Door</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Pneumatic Step-Well Access</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-xs border border-surface-container">
                      <span className="material-symbols-outlined text-primary text-[20px] animate-spin" style={{ animationDuration: '20s' }}>
                        mode_fan
                      </span>
                      <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface">
                        Driver Cockpit
                      </span>
                      <span className="material-symbols-outlined text-outline text-[20px]">airline_seat_recline_extra</span>
                    </div>
                  </div>

                  {/* Render Lower Deck Seats Grid */}
                  <DeckGrid
                    deckSeats={lowerDeckSeats}
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                  />

                  {/* Rear Emergency Exit & Bio-Toilet */}
                  <div className="mt-8 pt-4 border-t border-surface-container flex flex-wrap items-center justify-between text-on-surface-variant gap-4">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[18px] text-error">emergency</span>
                      <span>Rear Emergency Hatch & Hammer</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low font-label-sm text-label-sm text-on-surface border border-surface-container">
                      <span className="material-symbols-outlined text-[16px] text-primary">wc</span>
                      <span>Bio-Toilet with Touchless Sanitizer</span>
                    </div>
                  </div>
                </div>
              )}

              {/* UPPER DECK */}
              {hasUpperDeck && (deckMode === 'upper' || deckMode === 'both') && (
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border border-surface-container-high relative overflow-hidden transition-all duration-300">
                  <div className="flex items-center justify-between pb-6 border-b border-surface-container">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">Upper Deck</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Sky Panoramic View • Extra Overhead Headroom
                      </span>
                    </div>
                    <span className="font-label-md text-label-md text-primary bg-primary-fixed/50 px-3 py-1 rounded-full font-bold">
                      Base Fare ₹{Math.round(trip.baseFare * 1.05)}
                    </span>
                  </div>

                  {/* Front View Indicator */}
                  <div className="mt-6 mb-8 bg-surface-container-low rounded-2xl p-4 flex items-center justify-between text-on-surface-variant shadow-inner border border-surface-container">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-xl">panorama</span>
                      <span className="font-label-md text-label-md">Panoramic Front Windshield</span>
                    </div>
                    <span className="text-[11px] font-mono text-outline uppercase tracking-wider font-semibold">
                      Upper Level Forward
                    </span>
                  </div>

                  {/* Render Upper Deck Seats Grid */}
                  <DeckGrid
                    deckSeats={upperDeckSeats}
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                  />

                  {/* Rear Upper Indicator */}
                  <div className="mt-8 pt-4 border-t border-surface-container flex flex-wrap items-center justify-between text-on-surface-variant gap-4">
                    <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[18px] text-error">emergency</span>
                      <span>Upper Emergency Glass Breaker</span>
                    </div>
                    <span className="text-[11px] text-outline">Acoustic Soundproofing Lining</span>
                  </div>
                </div>
              )}
            </div>

            {/* Coach Specification & Hygiene Accreditation Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high flex items-start gap-3">
                <div className="p-2 rounded-xl bg-surface-container-low text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">air</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">HEPA Air Purifiers</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Continuous cabin air circulation every 4 minutes
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high flex items-start gap-3">
                <div className="p-2 rounded-xl bg-surface-container-low text-secondary flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">sanitizer</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Single-Use Sealed Linen</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Autoclaved fleece blanket and pillow kit provided
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-surface-container-high flex items-start gap-3">
                <div className="p-2 rounded-xl bg-surface-container-low text-primary-container flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-bold">Female Co-Passenger Shield</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Adjacent berths exclusively reserved for women
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY BOOKING DRAWER & SPECIFICATIONS (4 Cols on xl) */}
          <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-20">
            {/* Live Reservation Lock Timer Pill */}
            <div className="bg-amber-50 rounded-2xl p-3.5 flex items-center justify-between text-amber-900 shadow-xs border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 animate-spin" style={{ animationDuration: '6s' }}>
                  timer
                </span>
                <span className="font-label-sm text-label-sm font-semibold">Seat Lock Reserved for:</span>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-amber-700 tracking-wider font-mono">
                {formatTimer(secondsLeft)}
              </span>
            </div>

            {/* Selected Berth Detail Card */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border border-surface-container-high space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Selected Berths</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    <span>{selectedSeats.length}</span> passenger berth{selectedSeats.length === 1 ? '' : 's'} selected
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-sm text-label-sm font-bold">
                  Guaranteed Seat
                </span>
              </div>

              {/* Dynamic Active Selected Berths Badges */}
              {selectedSeats.length === 0 ? (
                <div className="p-6 rounded-2xl bg-surface-container-low border border-dashed border-surface-container-high text-center">
                  <span className="material-symbols-outlined text-outline text-3xl mb-1">airline_seat_flat</span>
                  <p className="font-label-md text-label-md text-on-surface font-bold">No Berth Selected Yet</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Click any green or available berth on the layout to pick your seat.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.seatNumber}
                      className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-secondary text-on-secondary flex flex-col items-center justify-center font-bold shadow-xs">
                          <span className="font-headline-sm text-headline-sm leading-none">{seat.seatNumber}</span>
                          <span className="text-[8px] uppercase tracking-wider font-semibold">
                            {seat.deck || 'Deck'}
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface font-bold">
                            {seat.isWindow ? 'Solo Window Berth' : 'Aisle Luxury Berth'}
                          </p>
                          <p className="text-[11px] text-on-surface-variant">4-inch Memory Foam Mattress</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-headline-sm text-headline-sm text-on-surface font-bold font-mono">
                          ₹{seat.fare}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSeatClick(seat)}
                          className="font-label-sm text-label-sm text-error hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Boarding & Dropping Point Pickers */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-semibold">
                    Select Boarding Point ({trip.route?.sourceCity || 'Origin'})
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBoardingPoint?.pointName || ''}
                      onChange={(e) => {
                        const bp = trip.route?.boardingPoints?.find((p) => p.pointName === e.target.value);
                        setSelectedBoardingPoint(bp);
                      }}
                      className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-3 font-body-md text-body-md border border-surface-container-high appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                    >
                      {(trip.route?.boardingPoints || [{ pointName: 'Central Terminal', landmark: 'Main Stand' }]).map((bp) => (
                        <option key={bp.pointName} value={bp.pointName}>
                          {bp.pointName} • {bp.landmark || 'Main Hub'}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5 font-semibold">
                    Select Dropping Point ({trip.route?.destinationCity || 'Destination'})
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDroppingPoint?.pointName || ''}
                      onChange={(e) => {
                        const dp = trip.route?.droppingPoints?.find((p) => p.pointName === e.target.value);
                        setSelectedDroppingPoint(dp);
                      }}
                      className="w-full bg-surface-container-low text-on-surface rounded-xl px-4 py-3 font-body-md text-body-md border border-surface-container-high appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer"
                    >
                      {(trip.route?.droppingPoints || [{ pointName: 'Main Terminal', landmark: 'Platform 1' }]).map((dp) => (
                        <option key={dp.pointName} value={dp.pointName}>
                          {dp.pointName} • {dp.landmark || 'City Drop'}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Free Cancellation Toggle Add-On */}
              <div className="p-3.5 rounded-2xl bg-surface-container flex items-center justify-between gap-3 border border-surface-container-high">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-bold">Algions Shield™ Protection</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">100% full refund up to 8 hrs before trip (+₹49)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shieldProtection}
                    onChange={(e) => setShieldProtection(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>

              {/* Comprehensive Fare Breakdown */}
              <div className="pt-2 space-y-2.5 text-on-surface-variant font-body-md text-body-md">
                <div className="flex justify-between">
                  <span>Base Ticket Fare ({selectedSeats.length} Berth{selectedSeats.length === 1 ? '' : 's'})</span>
                  <span className="font-semibold text-on-surface font-mono">₹{baseTicketFare.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>GST & Transit Toll (5%)</span>
                  <span className="font-semibold text-on-surface font-mono">₹{gstAmount.toFixed(2)}</span>
                </div>

                {shieldProtection && selectedSeats.length > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      Trip Insurance & Refund Protection
                    </span>
                    <span className="font-semibold font-mono">₹49.00</span>
                  </div>
                )}

                {/* Net Total Bar */}
                <div className="pt-3 border-t border-surface-container flex items-baseline justify-between">
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface font-bold">Total Payable</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">All taxes & surge waivers applied</p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight font-mono">
                      ₹{totalPayable.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout CTA Button */}
              <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={handleProceedToCheckout}
                className={`w-full py-4 rounded-2xl font-headline-sm text-headline-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                  selectedSeats.length > 0
                    ? 'bg-secondary hover:bg-on-secondary-container text-on-secondary shadow-secondary/20 hover:shadow-secondary/30'
                    : 'bg-surface-container text-outline cursor-not-allowed opacity-60 shadow-none'
                }`}
              >
                <span>Proceed to Passenger Details</span>
                <span className="material-symbols-outlined group-hover:translate-x-1.5 transition-transform text-[22px]">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Zero Double-Booking Trust Card */}
            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-3 text-on-surface-variant font-label-sm text-label-sm border border-surface-container">
              <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
              <div>
                <p className="text-on-surface font-bold">Zero Double-Booking Guarantee</p>
                <p className="font-body-sm text-body-sm mt-0.5">
                  Your seat is cryptographically locked in real-time across all state counters.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Security & Safety Strip */}
        <section className="w-full bg-surface-container-lowest mt-12 rounded-3xl p-6 shadow-xs border border-surface-container-high">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-on-surface">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">lock_clock</span>
              <div>
                <h5 className="font-label-md text-label-md font-bold">256-Bit SSL Checkout</h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Bank-grade encryption for all payments</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">support_agent</span>
              <div>
                <h5 className="font-label-md text-label-md font-bold">24x7 Emergency Transit Line</h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Toll-free on-road helpline & crew SOS</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">cleaning_services</span>
              <div>
                <h5 className="font-label-md text-label-md font-bold">Sanitized & Clean Linen</h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant">100% hygienic fresh berth kit</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[28px]">currency_exchange</span>
              <div>
                <h5 className="font-label-md text-label-md font-bold">Instant UPI Refunds</h5>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Reversed in &lt; 15 minutes to source</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Subcomponent: Grid for Lower or Upper Deck
function DeckGrid({ deckSeats = [], selectedSeats = [], onSeatClick }) {
  // Group seats by row
  const rowMap = new Map();
  deckSeats.forEach((seat) => {
    if (!rowMap.has(seat.row)) {
      rowMap.set(seat.row, []);
    }
    rowMap.get(seat.row).push(seat);
  });

  const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);

  return (
    <div className="relative py-2">
      <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* LEFT SIDE: DOUBLE BERTHS (Window + Aisle) -> 7 cols */}
        <div className="col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1 text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">window</span> Window (Double)
            </span>
            <span>Aisle Berth</span>
          </div>

          {sortedRows.map((rowNum) => {
            const seatsInRow = rowMap.get(rowNum) || [];
            const leftSeats = seatsInRow.filter((s) => s.column <= 2).sort((a, b) => a.column - b.column);

            return (
              <div key={rowNum} className="grid grid-cols-2 gap-3">
                {leftSeats.map((seat) => (
                  <BerthCard
                    key={seat.seatNumber}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.seatNumber === seat.seatNumber)}
                    onClick={() => onSeatClick(seat)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* CENTRAL AISLE: WALKING GANGWAY (1 col) */}
        <div className="col-span-1 flex flex-col items-center justify-between py-4 bg-surface-container-low/60 rounded-xl relative border border-surface-container">
          <div className="w-1.5 h-full rounded-full bg-primary/20 flex flex-col items-center justify-around py-6">
            <span className="w-2 h-2 rounded-full bg-primary/40"></span>
            <span className="w-2 h-2 rounded-full bg-primary/40"></span>
            <span className="w-2 h-2 rounded-full bg-primary/40"></span>
            <span className="w-2 h-2 rounded-full bg-primary/40"></span>
          </div>
          <span className="[writing-mode:vertical-rl] rotate-180 font-label-sm text-[10px] uppercase tracking-widest text-outline-variant select-none my-auto">
            Walking Gangway
          </span>
        </div>

        {/* RIGHT SIDE: SOLO SINGLE BERTH COLUMN (Window) -> 4 cols */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1 text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <span className="material-symbols-outlined text-[14px]">star</span> Solo Window
            </span>
            <span className="material-symbols-outlined text-[14px]">window</span>
          </div>

          {sortedRows.map((rowNum) => {
            const seatsInRow = rowMap.get(rowNum) || [];
            const rightSeats = seatsInRow.filter((s) => s.column > 2).sort((a, b) => a.column - b.column);

            return (
              <div key={rowNum} className="space-y-3">
                {rightSeats.map((seat) => (
                  <BerthCard
                    key={seat.seatNumber}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.seatNumber === seat.seatNumber)}
                    onClick={() => onSeatClick(seat)}
                    isSolo={true}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Individual Berth Card
function BerthCard({ seat, isSelected, onClick, isSolo = false }) {
  const isBooked = seat.status === 'booked';
  const isLocked = seat.status === 'locked';

  if (isBooked) {
    return (
      <div
        className="h-32 rounded-2xl bg-surface-container-highest p-3 flex flex-col justify-between opacity-70 cursor-not-allowed relative overflow-hidden border border-outline-variant/30 select-none"
        title="Already Booked Permanently"
      >
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-bold text-outline">{seat.seatNumber}</span>
          <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full"></div>
        <div className="text-center font-label-sm text-label-sm text-outline font-medium">Booked</div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div
        className="h-32 rounded-2xl bg-amber-50/90 p-3 flex flex-col justify-between opacity-85 cursor-not-allowed relative overflow-hidden border border-amber-300 select-none shadow-xs"
        title={`Berth ${seat.seatNumber} is temporarily held by another passenger`}
      >
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-bold text-amber-900">{seat.seatNumber}</span>
          <span className="material-symbols-outlined text-[15px] text-amber-700 animate-pulse">lock_clock</span>
        </div>
        <div className="w-full py-1 bg-amber-200/60 rounded-lg text-center font-label-sm text-[10px] text-amber-900 font-bold uppercase tracking-wider">
          Held by Others
        </div>
        <div className="flex items-center justify-between font-label-sm text-[10px] text-amber-800">
          <span className="font-mono font-semibold">₹{seat.fare}</span>
          <span className="font-medium">In Checkout</span>
        </div>
      </div>
    );
  }

  if (isSelected) {
    return (
      <div
        onClick={onClick}
        className="h-32 rounded-2xl bg-secondary text-on-secondary p-3 flex flex-col justify-between shadow-md ring-2 ring-secondary ring-offset-2 relative cursor-pointer select-none transition-all scale-102"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm font-bold text-on-secondary leading-none">
              {seat.seatNumber}
            </span>
            {isSolo && (
              <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                SOLO
              </span>
            )}
          </div>
          <div className="w-6 h-6 rounded-full bg-on-secondary text-secondary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[16px]">check</span>
          </div>
        </div>
        <div className="w-full py-1 bg-on-secondary/15 rounded-lg text-center font-label-sm text-label-sm text-on-secondary font-medium">
          Selected by You
        </div>
        <div className="flex items-center justify-between font-label-sm text-label-sm">
          <span className="font-bold text-on-secondary font-mono">₹{seat.fare}</span>
          <span className="text-[11px] underline opacity-90">Change</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left h-32 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 p-3 flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer relative border border-surface-container-high hover:border-primary/50 select-none"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-label-md text-label-md font-bold text-on-surface group-hover:text-primary">
            {seat.seatNumber}
          </span>
          {isSolo && (
            <span className="text-[10px] px-1 bg-primary/10 text-primary rounded font-semibold">
              SOLO
            </span>
          )}
        </div>
        <div className="w-6 h-2 rounded bg-surface-container-high group-hover:bg-primary/20"></div>
      </div>

      <div className="w-full py-1 bg-surface-container-low rounded-lg text-center font-label-sm text-label-sm text-on-surface-variant truncate">
        {isSolo ? 'Solo Window' : seat.isWindow ? 'Double Window' : 'Aisle Berth'}
      </div>

      <div className="flex items-center justify-between font-label-sm text-label-sm">
        <span className="text-on-surface font-bold font-mono">₹{seat.fare}</span>
        <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
          <span>Pick</span>
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </span>
      </div>
    </button>
  );
}

