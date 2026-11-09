import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/bookingApi';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Clock,
  Bus,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const trip = location.state?.trip;
  const selectedSeats = location.state?.selectedSeats || [];

  // If accessed directly without state, redirect to search
  useEffect(() => {
    if (!trip || selectedSeats.length === 0) {
      navigate('/search');
    }
  }, [trip, selectedSeats, navigate]);

  // Passengers form state
  const [passengers, setPassengers] = useState(() =>
    selectedSeats.map(seat => ({
      name: '',
      age: '',
      gender: 'Male',
      seatNumber: seat.seatNumber
    }))
  );

  // Boarding & Dropping Points state
  const boardingPoints = trip?.route?.boardingPoints || [
    { pointName: 'Main Terminal', landmark: 'Platform 1', timeOffsetMinutes: 0 }
  ];
  const droppingPoints = trip?.route?.droppingPoints || [
    { pointName: 'Central Station', landmark: 'Gate 2', timeOffsetMinutes: 0 }
  ];

  const [selectedBoardingIdx, setSelectedBoardingIdx] = useState(0);
  const [selectedDroppingIdx, setSelectedDroppingIdx] = useState(0);

  // Contact info
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!trip || selectedSeats.length === 0) return null;

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const calculatePointTime = (baseDateTime, offsetMinutes) => {
    const d = new Date(baseDateTime);
    d.setMinutes(d.getMinutes() + (offsetMinutes || 0));
    return d;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-flight validation
    for (const p of passengers) {
      if (!p.name.trim()) {
        setError(`Please enter the name for passenger assigned to seat ${p.seatNumber}`);
        return;
      }
      if (!p.age || Number(p.age) < 1) {
        setError(`Please enter a valid age for passenger assigned to seat ${p.seatNumber}`);
        return;
      }
    }

    if (!contactEmail || !contactPhone) {
      setError('Please provide contact email and phone number for ticket updates');
      return;
    }

    setLoading(true);

    try {
      const bPoint = boardingPoints[selectedBoardingIdx];
      const dPoint = droppingPoints[selectedDroppingIdx];

      const payload = {
        tripId: trip._id,
        passengers: passengers.map(p => ({
          name: p.name.trim(),
          age: Number(p.age),
          gender: p.gender,
          seatNumber: p.seatNumber
        })),
        boardingPoint: {
          pointName: bPoint.pointName,
          landmark: bPoint.landmark || '',
          time: calculatePointTime(trip.departureDateTime, bPoint.timeOffsetMinutes)
        },
        droppingPoint: {
          pointName: dPoint.pointName,
          landmark: dPoint.landmark || '',
          time: calculatePointTime(trip.arrivalDateTime, dPoint.timeOffsetMinutes)
        },
        contactEmail,
        contactPhone
      };

      const res = await bookingApi.createBooking(payload);

      if (res.success && res.data) {
        navigate(`/confirmation/${res.data.pnr}`, {
          state: { booking: res.data }
        });
      }
    } catch (err) {
      console.error('Booking failed:', err);
      // Double booking conflict (409) or other errors
      if (err.statusCode === 409 || err.message?.includes('already') || err.message?.includes('available')) {
        setError(`⚠️ Double-Booking Conflict: ${err.message}`);
      } else {
        setError(err.message || 'Failed to complete booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const baseFareTotal = selectedSeats.reduce((sum, s) => sum + s.fare, 0);
  const totalAmount = baseFareTotal;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Passenger Details & Confirmation</h1>
        <p className="text-xs text-slate-500">Provide passenger info to confirm your atomic seat reservations</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Booking Error</span>
            <span>{error}</span>
            {error.includes('Conflict') && (
              <p className="mt-2">
                <Link to="/search" className="underline font-bold text-red-800">
                  Click here to return to search and choose alternate seats.
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Passenger & Point Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Passenger Input Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Passenger Information ({passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'})
            </h2>

            <div className="space-y-4">
              {passengers.map((p, idx) => (
                <div key={p.seatNumber} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-800">
                      Passenger {idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-md">
                      Seat: {p.seatNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={p.name}
                        onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        placeholder="e.g. 28"
                        value={p.age}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Gender
                      </label>
                      <select
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boarding and Dropping Points */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Boarding & Dropping Points
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boarding Point ({trip.route?.sourceCity})
                </label>
                <select
                  value={selectedBoardingIdx}
                  onChange={(e) => setSelectedBoardingIdx(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  {boardingPoints.map((b, i) => (
                    <option key={i} value={i}>
                      {b.pointName} {b.landmark ? `(${b.landmark})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dropping Point ({trip.route?.destinationCity})
                </label>
                <select
                  value={selectedDroppingIdx}
                  onChange={(e) => setSelectedDroppingIdx(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  {droppingPoints.map((d, i) => (
                    <option key={i} value={i}>
                      {d.pointName} {d.landmark ? `(${d.landmark})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Contact Information for Ticket Updates
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fare Breakdown & Confirmation Box */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">{trip.operator?.name}</h3>
                <p className="text-[11px] text-slate-400">{trip.bus?.busType}</p>
              </div>
            </div>

            <div className="text-xs space-y-2 border-b border-slate-100 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>Route:</span>
                <span className="font-semibold text-slate-800">{trip.route?.sourceCity} → {trip.route?.destinationCity}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Departure:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(trip.departureDateTime).toLocaleDateString()} {new Date(trip.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Selected Seats:</span>
                <span className="font-bold text-blue-700">{selectedSeats.map(s => s.seatNumber).join(', ')}</span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Seats Base Fare ({selectedSeats.length} seats):</span>
                <span className="font-mono text-slate-800">₹{baseFareTotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Reservation & Service Fee:</span>
                <span className="text-emerald-600 font-semibold">FREE (Assessment)</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-xl font-black text-blue-700 font-mono">₹{totalAmount}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4" />
                Atomic Seat Lock Protection
              </div>
              <p>
                Your seats are reserved in real-time with ACID transaction guarantees.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Locking Seats & Generating PNR...
                </>
              ) : (
                <>
                  Confirm Booking & Pay ₹{totalAmount} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

