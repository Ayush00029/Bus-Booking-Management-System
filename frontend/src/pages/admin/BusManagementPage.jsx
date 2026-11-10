import React, { useState, useEffect } from 'react';
import { busApi } from '../../api/busApi';
import { Bus, Plus, Trash2, Edit2, AlertCircle, X, ShieldCheck, Check, Building2, Star } from 'lucide-react';

export default function BusManagementPage() {
  const [activeTab, setActiveTab] = useState('buses'); // 'buses' or 'operators'

  const [buses, setBuses] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bus Modal State
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [busFormData, setBusFormData] = useState({
    operator: '',
    busNumber: '',
    busType: 'AC Sleeper (2+1)',
    layoutType: '2+1_sleeper',
    totalSeats: 30,
    status: 'active'
  });

  // Operator Modal State
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [opFormData, setOpFormData] = useState({
    name: '',
    code: '',
    contactPhone: '',
    contactEmail: '',
    rating: 4.5
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [busRes, opRes] = await Promise.all([
        busApi.getBuses(),
        busApi.getOperators()
      ]);
      if (busRes.success) setBuses(busRes.data || []);
      if (opRes.success) {
        setOperators(opRes.data || []);
        if (opRes.data?.length > 0 && !busFormData.operator) {
          setBusFormData(prev => ({ ...prev, operator: opRes.data[0]._id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  // Bus Actions
  const handleOpenBusCreate = () => {
    setEditingBusId(null);
    setBusFormData({
      operator: operators[0]?._id || '',
      busNumber: '',
      busType: 'AC Sleeper (2+1)',
      layoutType: '2+1_sleeper',
      totalSeats: 30,
      status: 'active'
    });
    setIsBusModalOpen(true);
  };

  const handleOpenBusEdit = (bus) => {
    setEditingBusId(bus._id);
    setBusFormData({
      operator: bus.operator?._id || bus.operator,
      busNumber: bus.busNumber,
      busType: bus.busType,
      layoutType: bus.layoutType,
      totalSeats: bus.totalSeats,
      status: bus.status || 'active'
    });
    setIsBusModalOpen(true);
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...busFormData,
        totalSeats: Number(busFormData.totalSeats)
      };

      if (editingBusId) {
        const res = await busApi.updateBus(editingBusId, payload);
        if (res.success && res.data) {
          setBuses(buses.map(b => (b._id === editingBusId ? res.data : b)));
          setIsBusModalOpen(false);
        }
      } else {
        const res = await busApi.createBus(payload);
        if (res.success && res.data) {
          setBuses([res.data, ...buses]);
          setIsBusModalOpen(false);
        }
      }
    } catch (err) {
      alert('Operation failed: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBus = async (id, busNum) => {
    if (!window.confirm(`Are you sure you want to remove bus ${busNum}?`)) return;
    try {
      await busApi.deleteBus(id);
      setBuses(buses.filter(b => b._id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Operator Actions
  const handleCreateOperator = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await busApi.createOperator({
        ...opFormData,
        code: opFormData.code.toUpperCase().trim(),
        rating: Number(opFormData.rating)
      });
      if (res.success && res.data) {
        setOperators([...operators, res.data]);
        setIsOpModalOpen(false);
        setOpFormData({
          name: '',
          code: '',
          contactPhone: '',
          contactEmail: '',
          rating: 4.5
        });
      }
    } catch (err) {
      alert('Failed to add operator: ' + (err.message || 'Validation error'));
    } finally {
      setSaving(false);
    }
  };

  const busTypeOptions = [
    'AC Sleeper (2+1)',
    'Non-AC Sleeper (2+1)',
    'AC Seater (2+2)',
    'Non-AC Seater (2+2)',
    'Volvo Multi-Axle AC'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bus className="w-6 h-6 text-indigo-600" />
            Bus Fleet & Operator Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure bus operators, physical vehicles, and automated 2+2 / 2+1 deck layouts
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('buses')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'buses'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buses ({buses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'operators'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Operators ({operators.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: BUSES */}
      {activeTab === 'buses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenBusCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bus Registration</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Layout</th>
                    <th className="py-3 px-4 text-center">Capacity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading buses...
                      </td>
                    </tr>
                  ) : buses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No buses configured. Click 'Add Vehicle' to create one.
                      </td>
                    </tr>
                  ) : (
                    buses.map(bus => (
                      <tr key={bus._id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {bus.busNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {bus.operator?.name || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {bus.busType}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[10px]">
                            {bus.layoutType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {bus.totalSeats} seats
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 font-bold rounded-full text-[10px] uppercase ${
                            bus.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {bus.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenBusEdit(bus)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                              title="Edit Bus"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBus(bus._id, bus.busNumber)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                              title="Delete Bus"
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
        </div>
      )}

      {/* TAB 2: OPERATORS */}
      {activeTab === 'operators' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsOpModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Operator
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Operator Name</th>
                    <th className="py-3 px-4">Short Code</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4 text-center">Rating</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operators.map(op => (
                    <tr key={op._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {op.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {op.code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {op.contactPhone || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {op.contactEmail || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[11px]">
                          ★ {op.rating || 4.5}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] uppercase">
                          {op.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bus Modal (Create / Edit) */}
      {isBusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsBusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bus className="w-5 h-5 text-indigo-600" />
              {editingBusId ? 'Edit Vehicle Details' : 'Add New Bus Vehicle'}
            </h3>

            <form onSubmit={handleSaveBus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bus Operator *
                </label>
                <select
                  required
                  value={busFormData.operator}
                  onChange={(e) => setBusFormData({ ...busFormData, operator: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {operators.map(op => (
                    <option key={op._id} value={op._id}>{op.name} ({op.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-AB-1234"
                  value={busFormData.busNumber}
                  onChange={(e) => setBusFormData({ ...busFormData, busNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bus Type *
                  </label>
                  <select
                    value={busFormData.busType}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isSleeper = val.includes('Sleeper');
                      setBusFormData({
                        ...busFormData,
                        busType: val,
                        layoutType: isSleeper ? '2+1_sleeper' : '2+2_seater',
                        totalSeats: isSleeper ? 30 : 40
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    {busTypeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Layout Type
                  </label>
                  <select
                    value={busFormData.layoutType}
                    onChange={(e) => setBusFormData({ ...busFormData, layoutType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="2+2_seater">2+2 Seater</option>
                    <option value="2+1_sleeper">2+1 Sleeper (Dual Deck)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Seats (10-60)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    required
                    value={busFormData.totalSeats}
                    onChange={(e) => setBusFormData({ ...busFormData, totalSeats: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={busFormData.status}
                    onChange={(e) => setBusFormData({ ...busFormData, status: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Saving...' : editingBusId ? 'Update Vehicle' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operator Modal (Create) */}
      {isOpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsOpModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Register Bus Operator
            </h3>

            <form onSubmit={handleCreateOperator} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operator Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Travels"
                  value={opFormData.name}
                  onChange={(e) => setOpFormData({ ...opFormData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operator Code (2-10 chars) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. SHARMA"
                  value={opFormData.code}
                  onChange={(e) => setOpFormData({ ...opFormData, code: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={opFormData.contactPhone}
                    onChange={(e) => setOpFormData({ ...opFormData, contactPhone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={opFormData.rating}
                    onChange={(e) => setOpFormData({ ...opFormData, rating: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  {saving ? 'Creating...' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
