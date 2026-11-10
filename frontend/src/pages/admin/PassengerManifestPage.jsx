import React, { useState, useEffect } from 'react';
import { tripApi } from '../../api/tripApi';
import { adminApi } from '../../api/adminApi';
import { ClipboardList, Printer, Bus, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';

export default function PassengerManifestPage() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [manifestData, setManifestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await tripApi.getTrips();
      if (res.success && res.data?.length > 0) {
        setTrips(res.data);
        setSelectedTripId(res.data[0]._id);
        fetchManifest(res.data[0]._id);
      }
    } catch (err) {
      setError('Failed to load trips for manifest generator');
    }
  };

  const fetchManifest = async (tripId) => {
    if (!tripId) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getManifest(tripId);
      if (res.success && res.data) {
        setManifestData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate passenger manifest');
    } finally {
      setLoading(false);
    }
  };

  const handleTripChange = (e) => {
    const id = e.target.value;
    setSelectedTripId(id);
    fetchManifest(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-600" />
            Passenger Manifest Generator
          </h1>
          <p className="text-xs text-slate-500">
            Generate printable bus driver manifests and passenger roll calls per scheduled departure
          </p>
        </div>

        {/* Trip Selector & Print CTA */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTripId}
            onChange={handleTripChange}
            className="text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 shadow-xs"
          >
            {trips.map(t => (
              <option key={t._id} value={t._id}>
                {t.route ? `${t.route.sourceCity} → ${t.route.destinationCity}` : 'Trip'} | {t.bus?.busNumber} ({new Date(t.departureDateTime).toLocaleDateString()})
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            disabled={!manifestData || loading}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Manifest
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-3"></div>
          <p className="text-xs text-slate-500">Compiling manifest records...</p>
        </div>
      )}

      {/* Manifest Report Card */}
      {!loading && manifestData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Trip Header info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold">Route</span>
              <span className="text-slate-900 font-bold text-sm">{manifestData.tripDetails?.route}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Operator & Vehicle</span>
              <span className="text-slate-900 font-bold">{manifestData.tripDetails?.operator} ({manifestData.tripDetails?.busNumber})</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Scheduled Departure</span>
              <span className="text-slate-900 font-bold">
                {new Date(manifestData.tripDetails?.departureDateTime).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Seat Occupancy</span>
              <span className="text-teal-700 font-bold text-sm">
                {manifestData.tripDetails?.totalBooked} / {manifestData.tripDetails?.totalCapacity} Booked ({manifestData.tripDetails?.availableSeats} Free)
              </span>
            </div>
          </div>

          {/* Passenger Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Seat</th>
                  <th className="py-3 px-4">Passenger Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Booking PNR</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Boarding Point</th>
                  <th className="py-3 px-4">Dropping Point</th>
                  <th className="py-3 px-4 text-right">Fare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manifestData.passengers?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No passenger seats booked for this departure yet.
                    </td>
                  </tr>
                ) : (
                  manifestData.passengers.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 text-sm">
                        {p.seatNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.passengerName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {p.pnr}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.contactPhone}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {p.boardingPoint}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {p.droppingPoint}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{p.fare}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-100">
            <span>Generated from live database at: {new Date().toLocaleString()}</span>
            <span>AlgionsBus Transit Operations Management</span>
          </div>
        </div>
      )}
    </div>
  );
}

