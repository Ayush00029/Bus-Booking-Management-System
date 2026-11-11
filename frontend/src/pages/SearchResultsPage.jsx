import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import SeatMap from '../components/SeatMap';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const originParam = searchParams.get('origin') || 'Bengaluru';
  const destParam = searchParams.get('destination') || 'Chennai';
  const dateParam = searchParams.get('travelDate') || new Date().toISOString().split('T')[0];

  const [origin, setOrigin] = useState(originParam);
  const [destination, setDestination] = useState(destParam);
  const [travelDate, setTravelDate] = useState(dateParam);
  const [isModifyOpen, setIsModifyOpen] = useState(false);

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting state
  const [selectedBusTypes, setSelectedBusTypes] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [filterPrimoOnly, setFilterPrimoOnly] = useState(false);
  const [sortBy, setSortBy] = useState('departure');
  const [sortOrder, setSortOrder] = useState('asc');

  // Expanded Trip & Selected Seats State
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [tripDetail, setTripDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);

  // Sync state if search params change externally
  useEffect(() => {
    setOrigin(searchParams.get('origin') || 'Bengaluru');
    setDestination(searchParams.get('destination') || 'Chennai');
    setTravelDate(searchParams.get('travelDate') || new Date().toISOString().split('T')[0]);
    fetchTrips();
  }, [searchParams, sortBy, sortOrder]);

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    setSelectedSeats([]);
    setExpandedTripId(null);

    try {
      const res = await tripApi.searchTrips({
        origin: searchParams.get('origin') || origin,
        destination: searchParams.get('destination') || destination,
        travelDate: searchParams.get('travelDate') || travelDate,
        sortBy,
        sortOrder
      });

      if (res.success && res.data) {
        setTrips(res.data.trips || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
      travelDate
    });
    setIsModifyOpen(false);
  };

  const handleDateSelect = (newDate) => {
    setTravelDate(newDate);
    setSearchParams({
      origin: searchParams.get('origin') || origin,
      destination: searchParams.get('destination') || destination,
      travelDate: newDate
    });
  };

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Toggle Seat Map for a Trip
  const toggleSeatMap = async (tripId) => {
    if (expandedTripId === tripId) {
      setExpandedTripId(null);
      setTripDetail(null);
      setSelectedSeats([]);
      setSelectedBoardingPoint(null);
      setSelectedDroppingPoint(null);
      return;
    }

    setExpandedTripId(tripId);
    setLoadingDetail(true);
    setSelectedSeats([]);

    try {
      const res = await tripApi.getTripById(tripId);
      if (res.success && res.data) {
        setTripDetail(res.data);
        if (res.data.route?.boardingPoints?.length > 0) {
          setSelectedBoardingPoint(res.data.route.boardingPoints[0]);
        }
        if (res.data.route?.droppingPoints?.length > 0) {
          setSelectedDroppingPoint(res.data.route.droppingPoints[0]);
        }
      }
    } catch (err) {
      alert('Could not load seat layout: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle Seat Selection in SeatMap
  const handleSeatToggle = (seat) => {
    const isAlreadySelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seatNumber !== seat.seatNumber));
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select up to 6 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Proceed to Checkout
  const handleProceedToCheckout = (trip) => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat before proceeding.');
      return;
    }

    navigate('/checkout', {
      state: {
        trip,
        selectedSeats,
        selectedBoardingPoint,
        selectedDroppingPoint
      }
    });
  };

  // Available operators list from current trips
  const availableOperators = useMemo(() => {
    const opMap = new Map();
    trips.forEach(t => {
      const name = t.operator?.name || 'Express Line';
      const rating = t.operator?.rating || 4.5;
      if (!opMap.has(name)) {
        opMap.set(name, { name, rating, count: 0 });
      }
      opMap.get(name).count += 1;
    });
    return Array.from(opMap.values());
  }, [trips]);

  // Client-side filtering logic
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // 1. Bus Type
      if (selectedBusTypes.length > 0 && !selectedBusTypes.includes(trip.bus?.busType)) {
        return false;
      }

      // 2. Max Price
      if (trip.baseFare > maxPrice) {
        return false;
      }

      // 3. Operator
      if (selectedOperators.length > 0 && !selectedOperators.includes(trip.operator?.name)) {
        return false;
      }

      // 4. Primo Certified filter (rating >= 4.5)
      if (filterPrimoOnly && (trip.operator?.rating || 4.0) < 4.5) {
        return false;
      }

      // 5. Departure Time Slot
      if (selectedTimeSlots.length > 0) {
        const depHour = new Date(trip.departureDateTime).getHours();
        const matchesSlot = selectedTimeSlots.some(slot => {
          if (slot === 'morning') return depHour >= 6 && depHour < 12;
          if (slot === 'afternoon') return depHour >= 12 && depHour < 18;
          if (slot === 'evening') return depHour >= 18 && depHour < 23;
          if (slot === 'night') return depHour >= 23 || depHour < 6;
          return true;
        });
        if (!matchesSlot) return false;
      }

      return true;
    });
  }, [trips, selectedBusTypes, maxPrice, selectedOperators, filterPrimoOnly, selectedTimeSlots]);

  // Generate dynamic 7-day strip centered around selected travelDate
  const dateStrip = useMemo(() => {
    const dates = [];
    const baseDate = new Date(travelDate);
    if (isNaN(baseDate.getTime())) return dates;

    for (let offset = -1; offset <= 5; offset++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + offset);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
      const dayNum = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dates.push({
        iso,
        dayName,
        dayNum,
        isCurrent: iso === travelDate
      });
    }
    return dates;
  }, [travelDate]);

  const busTypeOptions = [
    'AC Sleeper (2+1)',
    'AC Seater (2+2)',
    'Volvo Multi-Axle AC',
    'Non-AC Sleeper (2+1)'
  ];

  const formatTime = (isoStr) => {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateDisplay = (isoStr) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (dep, arr) => {
    const diffMs = new Date(arr) - new Date(dep);
    if (isNaN(diffMs) || diffMs <= 0) return '6h 30m';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const clearAllFilters = () => {
    setSelectedBusTypes([]);
    setSelectedOperators([]);
    setSelectedTimeSlots([]);
    setMaxPrice(2500);
    setFilterPrimoOnly(false);
  };

  const hasActiveFilters =
    selectedBusTypes.length > 0 ||
    selectedOperators.length > 0 ||
    selectedTimeSlots.length > 0 ||
    maxPrice < 2500 ||
    filterPrimoOnly;

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* 1. Sub-Header Route Manifest */}
      <section className="bg-surface-container-lowest border-b border-surface-container-high py-4 px-4 sm:px-6 lg:px-8 shadow-xs sticky top-16 z-20 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="font-headline font-bold text-lg sm:text-xl text-on-surface">
                {origin}
              </span>
              <span className="material-symbols-outlined text-outline text-lg">arrow_forward</span>
              <span className="font-headline font-bold text-lg sm:text-xl text-on-surface">
                {destination}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-surface-container-high text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
              <span className="font-medium">{formatDateDisplay(travelDate)}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-outline-variant mx-1"></span>
              <span className="font-headline font-bold text-primary">
                {filteredTrips.length} {filteredTrips.length === 1 ? 'Bus' : 'Buses'} Available
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModifyOpen(!isModifyOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-headline font-bold text-xs transition border border-surface-container-high shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            <span>{isModifyOpen ? 'Close Search' : 'Modify Journey'}</span>
          </button>
        </div>

        {/* Expandable Search Modifier Bar */}
        {isModifyOpen && (
          <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-surface-container animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 relative">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Origin City
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-primary text-base">
                    trip_origin
                  </span>
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high flex items-center justify-center text-outline transition"
                  title="Swap Cities"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                </button>
              </div>

              <div className="sm:col-span-4 relative">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Destination City
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-base">
                    location_on
                  </span>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Travel Date
                </label>
                <input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-semibold text-on-surface focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-1 pt-4">
                <button
                  type="submit"
                  className="w-full py-2 bg-primary hover:bg-primary-container text-white rounded-xl font-headline font-bold text-xs flex items-center justify-center transition shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* 2. Quick Date Fare Carousel Strip */}
      <section className="bg-surface-container-low border-b border-surface-container py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {dateStrip.map((item) => (
            <button
              key={item.iso}
              type="button"
              onClick={() => handleDateSelect(item.iso)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all duration-150 flex flex-col items-center border ${
                item.isCurrent
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-102'
                  : 'bg-surface-container-lowest text-on-surface border-surface-container-high hover:border-primary/50 hover:bg-surface-bright'
              }`}
            >
              <span className={`text-[10px] font-headline font-bold tracking-wider ${item.isCurrent ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                {item.dayName}
              </span>
              <span className="font-headline font-bold text-xs">
                {item.dayNum}
              </span>
              <span className={`text-[10px] font-mono mt-0.5 ${item.isCurrent ? 'text-secondary-fixed' : 'text-secondary'}`}>
                {trips.length > 0 ? `from ₹${Math.min(...trips.map(t => t.baseFare))}` : '₹649'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid: Filters Sidebar + Results Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar Filters (lg:col-span-3) */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-high shadow-xs space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">filter_alt</span>
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-headline font-bold text-primary hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Quick Feature Toggles */}
              <div className="space-y-2">
                <span className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block">
                  Quick Features
                </span>
                <label className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer transition text-xs">
                  <span className="flex items-center gap-2 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-sm">verified</span>
                    Primo Certified
                  </span>
                  <input
                    type="checkbox"
                    checked={filterPrimoOnly}
                    onChange={(e) => setFilterPrimoOnly(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                </label>
              </div>

              {/* Departure Time Slots */}
              <div>
                <span className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block mb-2.5">
                  Departure Time
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'morning', label: '06:00 - 12:00', title: 'Morning', icon: 'wb_sunny' },
                    { id: 'afternoon', label: '12:00 - 18:00', title: 'Afternoon', icon: 'sunny' },
                    { id: 'evening', label: '18:00 - 23:00', title: 'Evening', icon: 'wb_twilight' },
                    { id: 'night', label: '23:00 - 06:00', title: 'Night', icon: 'bedtime' }
                  ].map((slot) => {
                    const isSelected = selectedTimeSlots.includes(slot.id);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slot.id));
                          } else {
                            setSelectedTimeSlots([...selectedTimeSlots, slot.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-primary-fixed border-primary text-on-primary-fixed'
                            : 'bg-surface-container-low border-surface-container-high hover:border-primary/40 text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-sm text-primary">{slot.icon}</span>
                          {isSelected && <span className="text-[10px] font-bold text-primary">✓</span>}
                        </div>
                        <span className="font-headline font-bold text-[11px] leading-tight">{slot.title}</span>
                        <span className="text-[9px] text-on-surface-variant">{slot.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-headline font-bold text-on-surface mb-2">
                  <span>Maximum Fare</span>
                  <span className="text-primary font-mono bg-surface-container-low px-2 py-0.5 rounded-md border border-surface-container-high">
                    ₹{maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="2500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-outline font-mono mt-1">
                  <span>₹300</span>
                  <span>₹2,500</span>
                </div>
              </div>

              {/* Bus Class / Type */}
              <div>
                <span className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block mb-2.5">
                  Bus Class & Layout
                </span>
                <div className="space-y-2">
                  {busTypeOptions.map((type) => (
                    <label key={type} className="flex items-center justify-between text-xs text-on-surface cursor-pointer select-none">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBusTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBusTypes([...selectedBusTypes, type]);
                            } else {
                              setSelectedBusTypes(selectedBusTypes.filter(t => t !== type));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                        <span>{type}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fleet Operators */}
              {availableOperators.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block">
                      Fleet Operator
                    </span>
                    <span className="text-[10px] text-outline">{availableOperators.length} fleets</span>
                  </div>

                  <div className="relative mb-2">
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-sm">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search operator..."
                      value={operatorSearch}
                      onChange={(e) => setOperatorSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {availableOperators
                      .filter(op => op.name.toLowerCase().includes(operatorSearch.toLowerCase()))
                      .map((op) => (
                        <label key={op.name} className="flex items-center justify-between text-xs text-on-surface cursor-pointer select-none">
                          <span className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={selectedOperators.includes(op.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOperators([...selectedOperators, op.name]);
                                } else {
                                  setSelectedOperators(selectedOperators.filter(o => o !== op.name));
                                }
                              }}
                              className="rounded text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="truncate">{op.name}</span>
                          </span>
                          <span className="text-[10px] font-bold text-secondary bg-secondary-container/40 px-1.5 py-0.5 rounded">
                            ★ {op.rating}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Section: Sorting Hub + Trip Cards Feed (lg:col-span-9) */}
          <section className="lg:col-span-9 space-y-5">
            {/* Sorting Hub Bar */}
            <div className="bg-surface-container-lowest p-3 rounded-2xl border border-surface-container-high shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-headline font-bold text-on-surface">
                  Showing {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip' : 'Trips'}
                </span>
                <span className="text-outline">•</span>
                <span className="text-on-surface-variant">Real-time seat inventory</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-headline font-bold text-outline mr-1">Sort:</span>
                {[
                  { id: 'fare-asc', label: 'Cheapest', by: 'fare', order: 'asc', icon: 'payments' },
                  { id: 'duration-asc', label: 'Fastest', by: 'duration', order: 'asc', icon: 'speed' },
                  { id: 'departure-asc', label: 'Earliest', by: 'departure', order: 'asc', icon: 'schedule' },
                  { id: 'departure-desc', label: 'Latest', by: 'departure', order: 'desc', icon: 'schedule' }
                ].map((sortItem) => {
                  const isActive = sortBy === sortItem.by && sortOrder === sortItem.order;
                  return (
                    <button
                      key={sortItem.id}
                      type="button"
                      onClick={() => {
                        setSortBy(sortItem.by);
                        setSortOrder(sortItem.order);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-headline font-bold text-xs transition flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">{sortItem.icon}</span>
                      <span>{sortItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="min-h-[40vh] flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-surface-container-high p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-surface-container-high border-t-primary mb-4"></div>
                <h4 className="font-headline font-bold text-base text-on-surface">Connecting to live bus schedules...</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Searching real-time inventory from verified operators between {origin} and {destination}.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredTrips.length === 0 && (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-surface-container-low text-primary rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-3xl">directions_bus</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">No Scheduled Buses Found</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                    No active trips match your criteria for {origin} → {destination} on {travelDate}. Try adjusting your filters, selecting an adjacent date from the strip above, or search popular routes like Bengaluru to Chennai.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl font-headline font-bold text-xs shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Trip Cards Feed */}
            {!loading && filteredTrips.map((trip) => {
              const isExpanded = expandedTripId === trip._id;
              const subtotal = selectedSeats.reduce((sum, s) => sum + s.fare, 0);
              const taxes = Math.round(subtotal * 0.05);
              const grandTotal = subtotal + taxes;

              const operatorInitials = (trip.operator?.name || 'EB')
                .split(' ')
                .map(w => w[0])
                .slice(0, 3)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={trip._id}
                  className="bg-surface-container-lowest rounded-2xl border border-surface-container-high hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Card Summary Body */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                      {/* 1. Operator & Fleet Info */}
                      <div className="flex items-start gap-3.5 min-w-[220px]">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-white flex items-center justify-center font-headline font-black text-sm tracking-wider shadow-sm flex-shrink-0">
                          {operatorInitials}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-headline font-bold text-base text-on-surface">
                              {trip.operator?.name || 'Express Line'}
                            </h3>
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-md font-headline font-bold text-[11px]">
                              ★ {trip.operator?.rating || 4.7}
                            </span>
                            {(trip.operator?.rating || 4.5) >= 4.5 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-headline font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                Primo
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            {trip.bus?.busType} • {trip.bus?.busNumber}
                          </p>

                          {/* Amenity Badges */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-outline">
                            <span className="flex items-center gap-1" title="High-speed Wi-Fi">
                              <span className="material-symbols-outlined text-xs">wifi</span> WiFi
                            </span>
                            <span className="flex items-center gap-1" title="Power Charging Socket">
                              <span className="material-symbols-outlined text-xs">power</span> USB
                            </span>
                            <span className="flex items-center gap-1" title="Clean Blankets">
                              <span className="material-symbols-outlined text-xs">bed</span> Blanket
                            </span>
                            <span className="flex items-center gap-1" title="Verified Safe Operator">
                              <span className="material-symbols-outlined text-xs">verified_user</span> Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Journey Timeline */}
                      <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-6 flex-1 w-full lg:w-auto py-3 lg:py-0 border-y lg:border-y-0 border-surface-container">
                        {/* Departure */}
                        <div className="text-left">
                          <span className="font-headline font-extrabold text-lg sm:text-xl text-on-surface block leading-tight">
                            {formatTime(trip.departureDateTime)}
                          </span>
                          <span className="text-xs font-bold text-on-surface-variant block mt-0.5">
                            {trip.route?.sourceCity}
                          </span>
                          <span className="text-[10px] text-outline block truncate max-w-[120px]">
                            {trip.route?.boardingPoints?.[0]?.pointName || 'Central Terminal'}
                          </span>
                        </div>

                        {/* Vector Line */}
                        <div className="flex flex-col items-center px-2 flex-1 max-w-[140px]">
                          <span className="text-[10px] font-headline font-bold text-outline-variant uppercase">
                            {calculateDuration(trip.departureDateTime, trip.arrivalDateTime)}
                          </span>
                          <div className="w-full h-0.5 bg-surface-container-high my-1.5 relative flex items-center justify-between">
                            <div className="w-2 h-2 rounded-full bg-primary -ml-1"></div>
                            <span className="px-1.5 py-0.2 bg-surface-container-low text-outline text-[9px] rounded font-medium">
                              Direct
                            </span>
                            <div className="w-2 h-2 rounded-full bg-secondary -mr-1"></div>
                          </div>
                          <span className="text-[9px] text-outline">Scheduled Express</span>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                          <span className="font-headline font-extrabold text-lg sm:text-xl text-on-surface block leading-tight">
                            {formatTime(trip.arrivalDateTime)}
                          </span>
                          <span className="text-xs font-bold text-on-surface-variant block mt-0.5">
                            {trip.route?.destinationCity}
                          </span>
                          <span className="text-[10px] text-outline block truncate max-w-[120px]">
                            {trip.route?.droppingPoints?.[0]?.pointName || 'Main Hub'}
                          </span>
                        </div>
                      </div>

                      {/* 3. Fare & Action Button */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3">
                        <div className="text-left lg:text-right">
                          <div className="flex items-center lg:justify-end gap-1.5">
                            <span className="text-[11px] text-outline line-through">
                              ₹{Math.round(trip.baseFare * 1.2)}
                            </span>
                            <span className="font-headline font-black text-2xl text-primary font-mono leading-none">
                              ₹{trip.baseFare}
                            </span>
                          </div>
                          <span className="text-[10px] text-outline block mt-0.5">
                            all taxes included
                          </span>
                          <span className={`inline-block mt-1 text-[10px] font-headline font-bold px-2 py-0.5 rounded-full ${
                            trip.availableSeats > 8
                              ? 'bg-secondary-container/40 text-on-secondary-container'
                              : trip.availableSeats > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-error-container text-on-error-container'
                          }`}>
                            {trip.availableSeats > 0 ? `${trip.availableSeats} Seats Left` : 'Sold Out'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSeatMap(trip._id)}
                            className={`px-4 py-2.5 rounded-xl font-headline font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
                              isExpanded
                                ? 'bg-on-surface text-surface'
                                : 'bg-primary hover:bg-primary-container text-white'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide Seats' : 'Select Seats'}</span>
                            <span className="material-symbols-outlined text-sm">
                              {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/trips/${trip._id}/seats`, { state: { trip } })}
                            title="Open Interactive Bus Deck Simulator"
                            className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary border border-surface-container-high transition flex items-center justify-center shadow-xs"
                          >
                            <span className="material-symbols-outlined text-base">splitscreen</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline Seat Selection & Reservation Drawer */}
                  {isExpanded && (
                    <div className="border-t border-surface-container bg-surface-container-low/50 p-6 animate-in slide-in-from-top-3 duration-200">
                      {loadingDetail ? (
                        <div className="py-12 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-surface-container-high border-t-primary mx-auto mb-2"></div>
                          <p className="text-xs text-on-surface-variant font-medium">Fetching real-time seat inventory from database...</p>
                        </div>
                      ) : tripDetail ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          {/* Seat Map Col */}
                          <div className="lg:col-span-7">
                            <SeatMap
                              seatLayout={tripDetail.seatLayout || []}
                              selectedSeats={selectedSeats}
                              onSeatToggle={handleSeatToggle}
                            />
                          </div>

                          {/* Reservation & Quick Summary Col */}
                          <div className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
                                  Booking Manifest
                                </h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                  Review selected seats and pickup locations
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => navigate(`/trips/${tripDetail._id}/seats`, { state: { trip: tripDetail, selectedSeats } })}
                                className="text-xs font-headline font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>Full Deck Simulator</span>
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                              </button>
                            </div>

                            {/* Boarding Point Dropdown */}
                            {tripDetail.route?.boardingPoints?.length > 0 && (
                              <div>
                                <label className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block mb-1">
                                  Boarding Point
                                </label>
                                <select
                                  value={selectedBoardingPoint?.pointName || ''}
                                  onChange={(e) => {
                                    const bp = tripDetail.route.boardingPoints.find(p => p.pointName === e.target.value);
                                    setSelectedBoardingPoint(bp);
                                  }}
                                  className="w-full p-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-semibold text-on-surface focus:outline-hidden"
                                >
                                  {tripDetail.route.boardingPoints.map((bp) => (
                                    <option key={bp.pointName} value={bp.pointName}>
                                      {bp.pointName} ({bp.landmark || 'Main Area'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Dropping Point Dropdown */}
                            {tripDetail.route?.droppingPoints?.length > 0 && (
                              <div>
                                <label className="text-[10px] font-headline font-bold text-outline uppercase tracking-wider block mb-1">
                                  Dropping Point
                                </label>
                                <select
                                  value={selectedDroppingPoint?.pointName || ''}
                                  onChange={(e) => {
                                    const dp = tripDetail.route.droppingPoints.find(p => p.pointName === e.target.value);
                                    setSelectedDroppingPoint(dp);
                                  }}
                                  className="w-full p-2.5 bg-surface-container-low border border-surface-container-high rounded-xl text-xs font-semibold text-on-surface focus:outline-hidden"
                                >
                                  {tripDetail.route.droppingPoints.map((dp) => (
                                    <option key={dp.pointName} value={dp.pointName}>
                                      {dp.pointName} ({dp.landmark || 'Main Area'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {/* Selected Seats List */}
                            <div>
                              <div className="flex items-center justify-between text-xs font-headline font-bold text-on-surface mb-2">
                                <span>Selected Seats ({selectedSeats.length})</span>
                                {selectedSeats.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSeats([])}
                                    className="text-[11px] text-error font-medium hover:underline"
                                  >
                                    Reset Seats
                                  </button>
                                )}
                              </div>

                              {selectedSeats.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-surface-container-high text-center text-xs text-outline bg-surface-container-low">
                                  Select seats on the bus map to view fare calculation.
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {selectedSeats.map((s) => (
                                    <span
                                      key={s.seatNumber}
                                      className="px-2.5 py-1 bg-surface-container-low border border-primary/30 text-primary font-headline font-bold text-xs rounded-lg flex items-center gap-1.5"
                                    >
                                      <span>Seat {s.seatNumber}</span>
                                      <span className="font-mono text-[11px] opacity-80">₹{s.fare}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Price Breakdown */}
                            {selectedSeats.length > 0 && (
                              <div className="space-y-2 pt-3 border-t border-surface-container text-xs">
                                <div className="flex justify-between text-on-surface-variant">
                                  <span>Base Fare ({selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'})</span>
                                  <span className="font-mono font-medium">₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between text-on-surface-variant">
                                  <span>GST & Road Safety Cess (5%)</span>
                                  <span className="font-mono font-medium">₹{taxes}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-surface-container font-headline font-bold text-sm text-on-surface">
                                  <span>Total Payable</span>
                                  <span className="text-xl font-mono text-primary font-black">
                                    ₹{grandTotal}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Proceed Button */}
                            <button
                              type="button"
                              disabled={selectedSeats.length === 0}
                              onClick={() => handleProceedToCheckout(tripDetail)}
                              className={`w-full py-3 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                                selectedSeats.length > 0
                                  ? 'bg-primary hover:bg-primary-container text-white cursor-pointer'
                                  : 'bg-surface-container text-outline cursor-not-allowed opacity-60'
                              }`}
                            >
                              <span>Continue to Passenger Details</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-error font-medium">Unable to load trip seat inventory.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>

        {/* 3. Bottom Assurance / Safety Commitment Strip */}
        <section className="mt-16 pt-12 border-t border-surface-container-high grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface">Primo Verified Fleets</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Every bus operator is screened for safety, certified drivers, on-time departures, and sanitized interiors.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">price_check</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface">Lowest Fare Guarantee</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Transparent ticketing with no hidden booking fees. If you find a lower price anywhere, get double the difference.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface">24/7 En-Route Assistance</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Dedicated support desk and live SOS tracking for seamless road travel across all national routes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
