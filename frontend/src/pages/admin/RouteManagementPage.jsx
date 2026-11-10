import React, { useState, useEffect } from 'react';
import { routeApi } from '../../api/routeApi';
import { MapPin, Plus, Trash2, Edit2, AlertCircle, X, Check, ArrowRight } from 'lucide-react';

export default function RouteManagementPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sourceCity: '',
    destinationCity: '',
    distanceKm: 300,
    estimatedDurationMinutes: 360,
    boardingPointName: 'Central Bus Stand',
    droppingPointName: 'Main Terminal',
    intermediateStopsText: ''
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [editFormData, setEditFormData] = useState({
    distanceKm: 300,
    estimatedDurationMinutes: 360,
    isActive: true,
    boardingPointName: '',
    droppingPointName: '',
    intermediateStopsText: ''
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await routeApi.getRoutes();
      if (res.success) setRoutes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, routeLabel) => {
    if (!window.confirm(`Are you sure you want to delete route ${routeLabel}?`)) return;
    try {
      await routeApi.deleteRoute(id);
      setRoutes(routes.filter(r => r._id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleOpenEdit = (route) => {
    setEditingRoute(route);
    setEditFormData({
      distanceKm: route.distanceKm || 300,
      estimatedDurationMinutes: route.estimatedDurationMinutes || 360,
      isActive: route.isActive !== false,
      boardingPointName: route.boardingPoints?.[0]?.pointName || 'Central Bus Stand',
      droppingPointName: route.droppingPoints?.[0]?.pointName || 'Main Terminal',
      intermediateStopsText: route.intermediateStops?.map(s => s.city || s.stopName).join(', ') || ''
    });
    setIsEditModalOpen(true);
  };

  const parseStops = (text, totalDistance) => {
    if (!text || !text.trim()) return [];
    const stopNames = text.split(',').map(s => s.trim()).filter(Boolean);
    const stepKm = Math.round(totalDistance / (stopNames.length + 1));
    return stopNames.map((name, idx) => ({
      stopName: `${name} Bypass`,
      city: name,
      distanceFromOriginKm: stepKm * (idx + 1),
      haltDurationMinutes: 10,
      stopSequence: idx + 1
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dist = Number(formData.distanceKm);
      const intermediateStops = parseStops(formData.intermediateStopsText, dist);

      const payload = {
        sourceCity: formData.sourceCity.trim(),
        destinationCity: formData.destinationCity.trim(),
        distanceKm: dist,
        estimatedDurationMinutes: Number(formData.estimatedDurationMinutes),
        intermediateStops,
        boardingPoints: [
          { pointName: formData.boardingPointName.trim(), landmark: 'Platform 1', timeOffsetMinutes: 0 }
        ],
        droppingPoints: [
          { pointName: formData.droppingPointName.trim(), landmark: 'Main Gate', timeOffsetMinutes: 0 }
        ]
      };

      const res = await routeApi.createRoute(payload);
      if (res.success && res.data) {
        setRoutes([res.data, ...routes]);
        setIsAddModalOpen(false);
        setFormData({
          sourceCity: '',
          destinationCity: '',
          distanceKm: 300,
          estimatedDurationMinutes: 360,
          boardingPointName: 'Central Bus Stand',
          droppingPointName: 'Main Terminal',
          intermediateStopsText: ''
        });
      }
    } catch (err) {
      alert('Failed to create route: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRoute) return;
    setSaving(true);
    try {
      const dist = Number(editFormData.distanceKm);
      const intermediateStops = parseStops(editFormData.intermediateStopsText, dist);

      const payload = {
        distanceKm: dist,
        estimatedDurationMinutes: Number(editFormData.estimatedDurationMinutes),
        isActive: editFormData.isActive,
        intermediateStops,
        boardingPoints: [
          { pointName: editFormData.boardingPointName.trim() || 'Central Bus Stand', landmark: 'Platform 1', timeOffsetMinutes: 0 }
        ],
        droppingPoints: [
          { pointName: editFormData.droppingPointName.trim() || 'Main Terminal', landmark: 'Main Gate', timeOffsetMinutes: 0 }
        ]
      };

      const res = await routeApi.updateRoute(editingRoute._id, payload);
      if (res.success && res.data) {
        setRoutes(routes.map(r => (r._id === editingRoute._id ? res.data : r)));
        setIsEditModalOpen(false);
        setEditingRoute(null);
      }
    } catch (err) {
      alert('Failed to update route: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            Route Network Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure origins, destinations, intermediate stops, and scheduled boarding/dropping terminals
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Origin City</th>
                <th className="py-3 px-4">Destination City</th>
                <th className="py-3 px-4 text-center">Distance</th>
                <th className="py-3 px-4 text-center">Est. Duration</th>
                <th className="py-3 px-4">Intermediate Stops</th>
                <th className="py-3 px-4">Terminals</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading routes...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No routes configured. Click 'Add Route' to configure one.
                  </td>
                </tr>
              ) : (
                routes.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.sourceCity}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {r.destinationCity}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {r.distanceKm} km
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {Math.floor(r.estimatedDurationMinutes / 60)}h {r.estimatedDurationMinutes % 60}m
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                      {r.intermediateStops && r.intermediateStops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.intermediateStops.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                              {s.city || s.stopName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct Non-Stop</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="text-[11px] font-medium text-slate-700">
                        Board: {r.boardingPoints?.map(b => b.pointName).join(', ') || 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Drop: {r.droppingPoints?.map(d => d.pointName).join(', ') || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${
                        r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                          title="Edit Route"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r._id, `${r.sourceCity} → ${r.destinationCity}`)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                          title="Delete Route"
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

      {/* Add Route Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Create New Route
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Origin City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={formData.sourceCity}
                    onChange={(e) => setFormData({ ...formData, sourceCity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Goa"
                    value={formData.destinationCity}
                    onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Distance (KM) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    required
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intermediate Stops (comma-separated cities)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Satara, Kolhapur, Belagavi"
                  value={formData.intermediateStopsText}
                  onChange={(e) => setFormData({ ...formData, intermediateStopsText: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Leave blank for non-stop direct route</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Boarding Point
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.boardingPointName}
                    onChange={(e) => setFormData({ ...formData, boardingPointName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropping Point
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.droppingPointName}
                    onChange={(e) => setFormData({ ...formData, droppingPointName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Creating...' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {isEditModalOpen && editingRoute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => { setIsEditModalOpen(false); setEditingRoute(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" /> Edit Route
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              {editingRoute.sourceCity} → {editingRoute.destinationCity}
            </p>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Distance (KM) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editFormData.distanceKm}
                    onChange={(e) => setEditFormData({ ...editFormData, distanceKm: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    required
                    value={editFormData.estimatedDurationMinutes}
                    onChange={(e) => setEditFormData({ ...editFormData, estimatedDurationMinutes: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intermediate Stops (comma-separated cities)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Satara, Kolhapur, Belagavi"
                  value={editFormData.intermediateStopsText}
                  onChange={(e) => setEditFormData({ ...editFormData, intermediateStopsText: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Boarding Point
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.boardingPointName}
                    onChange={(e) => setEditFormData({ ...editFormData, boardingPointName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropping Point
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.droppingPointName}
                    onChange={(e) => setEditFormData({ ...editFormData, droppingPointName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Route Status
                </label>
                <select
                  value={editFormData.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value === 'true' })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingRoute(null); }}
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
