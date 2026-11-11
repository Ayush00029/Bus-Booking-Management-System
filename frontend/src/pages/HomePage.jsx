import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeApi } from '../api/routeApi';

export default function HomePage() {
  const navigate = useNavigate();

  // Search State
  const [tripMode, setTripMode] = useState('oneway'); // 'oneway' | 'round' | 'charter'
  const [origin, setOrigin] = useState('Bengaluru');
  const [destination, setDestination] = useState('Goa');
  
  // Date calculations
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [travelDate, setTravelDate] = useState(getTomorrowISO());
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [availableCities, setAvailableCities] = useState([]);
  const [activeRegion, setActiveRegion] = useState('All Regions');
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await routeApi.getCities();
        if (res.success && res.data) {
          setAvailableCities(res.data.allCities || []);
        }
      } catch (e) {
        setAvailableCities([
          'Bengaluru', 'Goa', 'Mumbai', 'Pune', 'Delhi', 'Manali', 'Hyderabad', 'Chennai',
          'Jaipur', 'Kochi', 'Chandigarh', 'Coimbatore', 'Mysuru', 'Mangaluru', 'Kolhapur', 'Nellore'
        ]);
      }
    };
    loadCities();
  }, []);

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleSwapLocations = () => {
    setIsSwapping(true);
    setOrigin(destination);
    setDestination(origin);
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both origin and destination cities');
      return;
    }
    const cleanOrigin = origin.split('(')[0].trim();
    const cleanDest = destination.split('(')[0].trim();
    navigate(`/search?origin=${encodeURIComponent(cleanOrigin)}&destination=${encodeURIComponent(cleanDest)}&travelDate=${travelDate}`);
  };

  const handleQuickBookRoute = (fromCity, toCity) => {
    setOrigin(fromCity);
    setDestination(toCity);
    navigate(`/search?origin=${encodeURIComponent(fromCity)}&destination=${encodeURIComponent(toCity)}&travelDate=${travelDate}`);
  };

  // Trending routes catalog
  const trendingRoutes = [
    {
      id: 1,
      from: 'Bengaluru',
      to: 'Goa',
      operator: 'SRS Royal Sleeper Multi-Axle',
      rating: '4.8',
      price: '₹799',
      duration: '9h 30m',
      dailyBuses: 48,
      demandTag: 'High Demand',
      demandColor: 'text-primary',
      tagIcon: 'local_fire_department',
      region: 'South India',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEoFNuYOkzFvEMsqNhWwa_lTilYMRxHqtHjSutwOdIXt7twg1fKGr0KTsKOV9yTuPiazvq0DuCe6f_wkmBXVlxTJmuIz6nBqPI3nWg0bkUPFYss5P_TWMGibxnGsa0xQ7Oyii9gKAFm1bkUSP76jWpdZF4uRqbQsOL5iYvMe_t1O50ojPwkMzOFkbxMOLhOmIf_ROexCPC2L76qv1zAqV7hO2OpdPBReJbDJoLeguG',
      amenities: [
        { icon: 'ac_unit', title: 'Air Conditioned' },
        { icon: 'bed', title: 'Single Sleeper Berths' },
        { icon: 'wifi', title: 'Free Fast Wi-Fi' },
        { icon: 'power', title: 'Power Sockets' },
        { icon: 'verified_user', title: 'Verified Safety' }
      ]
    },
    {
      id: 2,
      from: 'Mumbai',
      to: 'Pune',
      operator: 'Shivneri Superfast Express',
      rating: '4.9',
      price: '₹399',
      duration: '3h 15m',
      dailyBuses: 84,
      demandTag: 'Express Line',
      demandColor: 'text-secondary',
      tagIcon: 'bolt',
      region: 'West Coastal',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYOObZ5En0q9f-7QGdc2mwApc2o8EuMtjzFx693e4CpG1BTE51ZQBt0fwftjfg6MmT7pSsP1a3xlY6HYATnDUzNs3qSkz3jf4HFhfFNy5_Ei0NjR6sGXpReayaGXccA4YfgnhpYgBazSk6b9hAcjRMeTcKSj_QMjOuEJq3YVZZSIIKzts2dyx2dxFQdRsZv_6_-fGVogUhttZ5bSmkXvXpKOMjTKxQEZEcmMqvOYlv',
      amenities: [
        { icon: 'ac_unit', title: 'Air Conditioned' },
        { icon: 'airline_seat_recline_normal', title: 'Recliner Seats' },
        { icon: 'water_drop', title: 'Water Bottle Included' },
        { icon: 'power', title: 'Power Sockets' },
        { icon: 'sanitizer', title: 'Sanitized Cabin' }
      ]
    },
    {
      id: 3,
      from: 'Delhi',
      to: 'Manali',
      operator: 'Himachal Volvo Multi-Axle',
      rating: '4.7',
      price: '₹1,099',
      duration: '11h 00m',
      dailyBuses: 32,
      demandTag: 'Mountain Run',
      demandColor: 'text-primary',
      tagIcon: 'landscape',
      region: 'North Corridors',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKOesJdLdvAWzRPDkJGWUwpkiEXvaRReRrqc16AzQ1BPR6_PYckdq9VXxphOtatmtAt-IkDCxyMmo_Fpy3GUE5KKfEmKnoHxlTaUX_HVyroQvADOQh2HIV2jLOXSQX_Ac6nZJY-eQFmNXqywi3EbsmanQL6rlpejljce5nut51O-svd1ZYxf_zFoUr2uETPTKwg6835BgJg_eYQIpC1aGi84nXTkdZseZlSgvwW-Xo',
      amenities: [
        { icon: 'ac_unit', title: 'Climate Control' },
        { icon: 'airline_seat_individual_suite', title: 'Blanket & Pillow' },
        { icon: 'health_and_safety', title: 'Emergency SOS' },
        { icon: 'power', title: 'Power Sockets' },
        { icon: 'verified_user', title: 'Verified Safety' }
      ]
    },
    {
      id: 4,
      from: 'Hyderabad',
      to: 'Chennai',
      operator: 'Orange Premium Travels',
      rating: '4.8',
      price: '₹850',
      duration: '8h 45m',
      dailyBuses: 56,
      demandTag: 'Top Rated',
      demandColor: 'text-primary',
      tagIcon: 'stars',
      region: 'South India',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVzbmmG32MBxzuwNQ45g4dmEIG-Udb8FTe39EDrNF3pibir-pnAHasRNYjrcyVXXk2_xc8NbJz05_oUzhU16nbEgI8DZ0DO36lvLrTd8uJgTTTWpCrIvLqcgpZnT1uaK74nvTFNNniqtsKgWoBUC0UKpg4fjkuzaEVBm2f8vaUGcPIFaa1BT13H3rwGaYyfitu_nwAhXBME06kPlIgELvlLu5qWHFeLMB9oe-B0GgK',
      amenities: [
        { icon: 'ac_unit', title: 'Air Conditioned' },
        { icon: 'bed', title: 'Sleeper Berths' },
        { icon: 'wifi', title: 'Free Wi-Fi' },
        { icon: 'restaurant', title: 'Snacks Included' },
        { icon: 'sanitizer', title: 'Sanitized Cabin' }
      ]
    },
    {
      id: 5,
      from: 'Bengaluru',
      to: 'Chennai',
      operator: 'KSRTC Swift Airavat Club Class',
      rating: '4.9',
      price: '₹650',
      duration: '6h 00m',
      dailyBuses: 64,
      demandTag: 'Frequent Metro',
      demandColor: 'text-primary',
      tagIcon: 'schedule',
      region: 'South India',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYOObZ5En0q9f-7QGdc2mwApc2o8EuMtjzFx693e4CpG1BTE51ZQBt0fwftjfg6MmT7pSsP1a3xlY6HYATnDUzNs3qSkz3jf4HFhfFNy5_Ei0NjR6sGXpReayaGXccA4YfgnhpYgBazSk6b9hAcjRMeTcKSj_QMjOuEJq3YVZZSIIKzts2dyx2dxFQdRsZv_6_-fGVogUhttZ5bSmkXvXpKOMjTKxQEZEcmMqvOYlv',
      amenities: [
        { icon: 'ac_unit', title: 'Climate Controlled' },
        { icon: 'airline_seat_recline_normal', title: 'Semi-Sleeper' },
        { icon: 'wifi', title: 'Onboard WiFi' },
        { icon: 'power', title: 'USB Sockets' },
        { icon: 'verified_user', title: 'Verified Safety' }
      ]
    },
    {
      id: 6,
      from: 'Bengaluru',
      to: 'Hyderabad',
      operator: 'VRL Multi-Axle AC Sleeper',
      rating: '4.8',
      price: '₹950',
      duration: '9h 00m',
      dailyBuses: 52,
      demandTag: 'Overnight Sleeper',
      demandColor: 'text-secondary',
      tagIcon: 'bedtime',
      region: 'South India',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEoFNuYOkzFvEMsqNhWwa_lTilYMRxHqtHjSutwOdIXt7twg1fKGr0KTsKOV9yTuPiazvq0DuCe6f_wkmBXVlxTJmuIz6nBqPI3nWg0bkUPFYss5P_TWMGibxnGsa0xQ7Oyii9gKAFm1bkUSP76jWpdZF4uRqbQsOL5iYvMe_t1O50ojPwkMzOFkbxMOLhOmIf_ROexCPC2L76qv1zAqV7hO2OpdPBReJbDJoLeguG',
      amenities: [
        { icon: 'ac_unit', title: 'AC Sleeper' },
        { icon: 'bed', title: 'Lower/Upper Berths' },
        { icon: 'tv', title: 'Personal Screen' },
        { icon: 'power', title: 'Charging Port' },
        { icon: 'sanitizer', title: 'Sanitized Cabin' }
      ]
    },
    {
      id: 7,
      from: 'Delhi',
      to: 'Jaipur',
      operator: 'Zingbus Luxury AC Seater',
      rating: '4.8',
      price: '₹450',
      duration: '5h 00m',
      dailyBuses: 72,
      demandTag: 'Express Highway',
      demandColor: 'text-primary',
      tagIcon: 'bolt',
      region: 'North Corridors',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKOesJdLdvAWzRPDkJGWUwpkiEXvaRReRrqc16AzQ1BPR6_PYckdq9VXxphOtatmtAt-IkDCxyMmo_Fpy3GUE5KKfEmKnoHxlTaUX_HVyroQvADOQh2HIV2jLOXSQX_Ac6nZJY-eQFmNXqywi3EbsmanQL6rlpejljce5nut51O-svd1ZYxf_zFoUr2uETPTKwg6835BgJg_eYQIpC1aGi84nXTkdZseZlSgvwW-Xo',
      amenities: [
        { icon: 'ac_unit', title: 'Air Conditioned' },
        { icon: 'airline_seat_recline_normal', title: 'Pushback Seater' },
        { icon: 'water_drop', title: 'Complimentary Water' },
        { icon: 'power', title: 'Power Sockets' },
        { icon: 'verified_user', title: 'Verified Safety' }
      ]
    },
    {
      id: 8,
      from: 'Mumbai',
      to: 'Goa',
      operator: 'IntrCity SmartBus Premium Sleeper',
      rating: '4.9',
      price: '₹1,150',
      duration: '11h 30m',
      dailyBuses: 36,
      demandTag: 'Coastal Luxury',
      demandColor: 'text-secondary',
      tagIcon: 'beach_access',
      region: 'West Coastal',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVzbmmG32MBxzuwNQ45g4dmEIG-Udb8FTe39EDrNF3pibir-pnAHasRNYjrcyVXXk2_xc8NbJz05_oUzhU16nbEgI8DZ0DO36lvLrTd8uJgTTTWpCrIvLqcgpZnT1uaK74nvTFNNniqtsKgWoBUC0UKpg4fjkuzaEVBm2f8vaUGcPIFaa1BT13H3rwGaYyfitu_nwAhXBME06kPlIgELvlLu5qWHFeLMB9oe-B0GgK',
      amenities: [
        { icon: 'ac_unit', title: 'Air Conditioned' },
        { icon: 'bed', title: 'Single & Double Berths' },
        { icon: 'wifi', title: 'Free Wi-Fi' },
        { icon: 'airline_seat_individual_suite', title: 'Fresh Linens' },
        { icon: 'sanitizer', title: 'Sanitized Cabin' }
      ]
    }
  ];

  const filteredRoutes = activeRegion === 'All Regions'
    ? trendingRoutes
    : trendingRoutes.filter(r => r.region === activeRegion);

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      {/* Hero Section with Ambient Glow Mesh */}
      <section className="relative w-full overflow-hidden bg-surface pb-16 lg:pb-24">
        {/* Ambient Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[480px] bg-gradient-to-tr from-secondary/15 via-primary-container/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full"></div>
        <div className="absolute -top-24 right-[-100px] w-[500px] h-[500px] bg-secondary-fixed/20 blur-[100px] -z-10 pointer-events-none rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 lg:pt-14">
          {/* Headline & Trust Indicators */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container text-primary font-medium text-xs sm:text-sm shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
              <span>India’s Most Trusted Intercity Transit Network</span>
              <span className="text-outline-variant">·</span>
              <span className="text-on-surface-variant font-medium">Over 3,500+ Luxury Operators</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-tight">
              Book Intercity Bus Tickets with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Zero Hassle
              </span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto">
              Compare 100,000+ daily routes across verified operators. Free cancellation and guaranteed berths.
            </p>
          </div>

          {/* Centerpiece Search Floating Console */}
          <div className="mt-10 lg:mt-12 bg-surface-container-lowest rounded-3xl shadow-xl border border-slate-200/60 p-4 sm:p-6 lg:p-8 relative">
            {/* Travel Mode Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-100">
              <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
                <button
                  type="button"
                  onClick={() => setTripMode('oneway')}
                  className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                    tripMode === 'oneway'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  <span>One Way</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode('round')}
                  className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                    tripMode === 'round'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                  <span>Round Trip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode('charter')}
                  className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
                    tripMode === 'charter'
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                      : 'text-on-surface-variant hover:text-on-surface font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">airport_shuttle</span>
                  <span>Bus Charter / Groups</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary-fixed/50 text-on-secondary-fixed text-xs font-semibold rounded-full">
                  <span className="material-symbols-outlined text-[15px]">verified</span> Lowest Price Guaranteed
                </span>
              </div>
            </div>

            {/* Integrated Search Fields Grid */}
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-center pt-5">
              {/* Origin Station Input */}
              <div className="md:col-span-3 bg-surface-container-low rounded-2xl p-3.5 hover:bg-surface-container transition-colors relative group border border-transparent hover:border-slate-300">
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-primary text-[16px]">my_location</span>
                  <span>From</span>
                </label>
                <input
                  type="text"
                  required
                  list="origin-list"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter departure city"
                  className="w-full bg-transparent text-base sm:text-lg text-on-surface font-bold focus:outline-none placeholder:text-outline"
                />
                <datalist id="origin-list">
                  {availableCities.map(c => <option key={c} value={c} />)}
                </datalist>
                <p className="text-xs text-on-surface-variant truncate mt-0.5">
                  Majestic, Electronic City, Silk Board
                </p>
              </div>

              {/* Swap Rotating Button */}
              <div className="md:col-span-1 flex justify-center -my-2 md:my-0 z-10">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap Origin and Destination"
                  className={`w-11 h-11 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary border border-slate-200 transition-all duration-300 transform active:scale-95 ${
                    isSwapping ? 'rotate-180' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                </button>
              </div>

              {/* Destination Station Input */}
              <div className="md:col-span-3 bg-surface-container-low rounded-2xl p-3.5 hover:bg-surface-container transition-colors group border border-transparent hover:border-slate-300">
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-secondary text-[16px]">location_on</span>
                  <span>To</span>
                </label>
                <input
                  type="text"
                  required
                  list="dest-list"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination city"
                  className="w-full bg-transparent text-base sm:text-lg text-on-surface font-bold focus:outline-none placeholder:text-outline"
                />
                <datalist id="dest-list">
                  {availableCities.map(c => <option key={c} value={c} />)}
                </datalist>
                <p className="text-xs text-on-surface-variant truncate mt-0.5">
                  Mapusa, Panjim KTC, Margao Terminal
                </p>
              </div>

              {/* Date Selector */}
              <div className="md:col-span-3 bg-surface-container-low rounded-2xl p-3.5 hover:bg-surface-container transition-colors border border-transparent hover:border-slate-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-on-surface-variant uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-primary text-[16px]">calendar_month</span>
                    <span>Departure Date</span>
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTravelDate(getTodayISO())}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition ${
                        travelDate === getTodayISO()
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelDate(getTomorrowISO())}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold transition ${
                        travelDate === getTomorrowISO()
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="bg-transparent font-bold text-base sm:text-lg text-on-surface focus:outline-none cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-variant font-medium">
                    {formatDisplayDate(travelDate)}
                  </span>
                </div>
                <p className="text-xs text-secondary font-medium mt-0.5">140+ buses available</p>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full min-h-[64px] bg-secondary text-on-secondary rounded-2xl font-bold text-sm sm:text-base flex flex-col items-center justify-center gap-0.5 hover:bg-on-secondary-container transition-all shadow-lg shadow-secondary/25 active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[22px]">search</span>
                    <span className="tracking-wide">SEARCH</span>
                  </div>
                  <span className="text-xs opacity-90 font-normal">Best Fares Live</span>
                </button>
              </div>
            </form>

            {/* Return Date Container (Shown when Round Trip is selected) */}
            {tripMode === 'round' && (
              <div className="mt-4 p-4 bg-surface-container-high rounded-2xl flex items-center justify-between border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[24px]">event_repeat</span>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase font-semibold">Return Journey Date</p>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="bg-transparent text-base font-bold text-on-surface focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTripMode('oneway')}
                  className="text-on-surface-variant hover:text-error text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span> Remove Return
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Feature Benefits Bar */}
      <section className="w-full bg-surface-container-low py-12 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow group border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">airline_seat_recline_extra</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">Luxury Sleeper Fleet</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Ergonomic memory-foam berths, individual AC vents, high-speed onboard WiFi, and USB-C fast charging points.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow group border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">Zero Double-Booking</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Sub-second real-time seat lock API with live sync across 3,500 bus depots ensuring your reserved berth is 100% secured.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow group border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">bolt</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">Instant UPI Refunds</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Plans changed? Enjoy 1-click cancellations with instant reversal directly to your original bank account or UPI in 2 minutes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow group border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-surface-variant text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[28px]">shield_with_heart</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">Star-Verified Drivers</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Strict safety audits, real-time speed monitoring, breathalyzer check-ins, and verified driver ratings by verified passengers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Trending Intercity Routes */}
      <section className="w-full bg-surface py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Section Header & Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                <span>HIGH FREQUENCY TRANSIT CORRIDORS</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Trending Intercity Routes
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Book ahead with verified bus partners and save up to ₹300 per trip.
              </p>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2">
              {['All Regions', 'South India', 'North Corridors', 'West Coastal'].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setActiveRegion(region)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-xs ${
                    activeRegion === region
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Route Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100"
              >
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={route.image}
                    alt={`${route.from} to ${route.to}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${route.demandColor}`}>
                    <span className="material-symbols-outlined text-[14px]">{route.tagIcon}</span>
                    <span>{route.demandTag}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-secondary text-on-secondary px-2.5 py-1 rounded-md text-xs font-bold shadow-md">
                    From {route.price}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary font-semibold truncate max-w-[170px]">
                        {route.operator}
                      </span>
                      <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface text-xs font-bold">
                        <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>{' '}
                        {route.rating}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-on-surface">
                      {route.from} → {route.to}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      <span>{route.duration} • {route.dailyBuses} Daily Buses</span>
                    </p>

                    {/* Amenities icons */}
                    <div className="flex items-center gap-3 pt-3 text-on-surface-variant">
                      {route.amenities.map((amenity, idx) => (
                        <span key={idx} className="material-symbols-outlined text-[18px]" title={amenity.title}>
                          {amenity.icon}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => handleQuickBookRoute(route.from, route.to)}
                      className="w-full py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-secondary hover:text-on-secondary text-secondary text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <span>View {route.dailyBuses} Buses</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
