import React, { useState, useEffect } from 'react';
import { tripApi } from '../../api/tripApi';
import { routeApi } from '../../api/routeApi';
import { busApi } from '../../api/busApi';
import { Calendar, Plus, Trash2, Edit2, AlertCircle, X, Clock, Bus, MapPin, IndianRupee } from 'lucide-react';

export default function TripManagementPage() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Schedule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    route: '',
    bus: '',
    departureDateTime: '',
    arrivalDateTime: '',
    baseFare: 750
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editFormData, setEditFormData] = useState({
    baseFare: 750,
    status: 'SCHEDULED',
    departureDateTime: '',
    arrivalDateTime: ''
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [tripsRes, routesRes, busesRes] = await Promise.all([
        tripApi.getTrips(),
        routeApi.getRoutes(),
        busApi.getBuses()
      ]);

      if (tripsRes.success) setTrips(tripsRes.data || []);
      if (routesRes.success) {
        setRoutes(routesRes.data || []);
        if (routesRes.data?.length > 0 && !formData.route) {
          setFormData(prev => ({ ...prev, route: routesRes.data[0]._id }));
        }
      }
      if (busesRes.success) {
        setBuses(busesRes.data || []);
        if (busesRes.data?.length > 0 && !formData.bus) {
          setFormData(prev => ({ ...prev, bus: busesRes.data[0]._id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch trip schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip schedule?')) return;
    try {
      await tripApi.deleteTrip(id);
      setTrips(trips.filter(t => t._id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Cannot delete trip with active bookings'));
    }
  };

  const handleOpenEdit = (trip) => {
    setEditingTrip(trip);
    // Format dates for datetime-local input
    const toInputFormat = (isoStr) => {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    setEditFormData({
      baseFare: trip.baseFare || 750,
      status: trip.status || 'SCHEDULED',
      departureDateTime: toInputFormat(trip.departureDateTime),
      arrivalDateTime: toInputFormat(trip.arrivalDateTime)
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        route: formData.route,
        bus: formData.bus,
        departureDateTime: new Date(formData.departureDateTime).toISOString(),
        arrivalDateTime: new Date(formData.arrivalDateTime).toISOString(),
        baseFare: Number(formData.baseFare)
      };

      const res = await tripApi.createTrip(payload);
      if (res.success && res.data) {
        setTrips([res.data, ...trips]);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert('Failed to schedule trip: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    setSaving(true);
    try {
      const payload = {
        baseFare: Number(editFormData.baseFare),
        status: editFormData.status,
        departureDateTime: new Date(editFormData.departureDateTime).toISOString(),
        arrivalDateTime: new Date(editFormData.arrivalDateTime).toISOString()
      };

      const res = await tripApi.updateTrip(editingTrip._id, payload);
      if (res.success && res.data) {
        setTrips(trips.map(t => (t._id === editingTrip._id ? res.data : t)));
        setIsEditModalOpen(false);
        setEditingTrip(null);
      }
    } catch (err) {
      alert('Failed to update trip: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] uppercase">Scheduled</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 font-bold rounded-full text-[10px] uppercase">Cancelled</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full text-[10px] uppercase">Completed</span>;
      case 'DELAYED':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] uppercase">Delayed</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full text-[10px] uppercase">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Trip Schedule Management
          </h1>
          <p className="text-xs text-slate-500">
            Publish scheduled trips, assign buses to routes, manage dynamic fares and departure status
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Schedule New Trip
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Operator & Bus</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4">Arrival Time</th>
                <th className="py-3 px-4 text-center">Base Fare</th>
                <th className="py-3 px-4 text-center">Available Seats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading trip schedules...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No trips scheduled. Click 'Schedule New Trip' to add one.
                  </td>
                </tr>
              ) : (
                trips.map(t => (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {t.route ? `${t.route.sourceCity} → ${t.route.destinationCity}` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold block">{t.operator?.name || 'N/A'}</span>
                      <span className="text-[11px] text-slate-400">{t.bus?.busNumber} ({t.bus?.busType})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {formatDateTime(t.departureDateTime)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {formatDateTime(t.arrivalDateTime)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">
                      ₹{t.baseFare}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-bold font-mono ${
                        t.availableSeats > 10 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {t.availableSeats}
                      </span>
                      <span className="text-slate-400 font-mono"> / {t.totalSeats}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                          title="Edit Trip Schedule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                          title="Delete Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" /> Schedule New Trip
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Route *
                </label>
                <select
                  required
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.sourceCity} → {r.destinationCity} ({r.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Bus Vehicle *
                </label>
                <select
                  required
                  value={formData.bus}
                  onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.busNumber} - {b.busType} ({b.operator?.name || 'Operator'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.departureDateTime}
                    onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Arrival Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.arrivalDateTime}
                    onChange={(e) => setFormData({ ...formData, arrivalDateTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Base Fare (₹) *
                </label>
                <input
                  type="number"
                  min="50"
                  required
                  value={formData.baseFare}
                  onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Scheduling...' : 'Schedule Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {isEditModalOpen && editingTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => { setIsEditModalOpen(false); setEditingTrip(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> Edit Trip Schedule
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              {editingTrip.route?.sourceCity} → {editingTrip.route?.destinationCity} ({editingTrip.bus?.busNumber})
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Base Fare (₹) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={editFormData.baseFare}
                    onChange={(e) => setEditFormData({ ...editFormData, baseFare: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trip Status *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editFormData.departureDateTime}
                    onChange={(e) => setEditFormData({ ...editFormData, departureDateTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Arrival Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editFormData.arrivalDateTime}
                    onChange={(e) => setEditFormData({ ...editFormData, arrivalDateTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingTrip(null); }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
