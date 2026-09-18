import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { inspectionService } from '../services/inspectionService';
import { Car, Calendar, User, Hash, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NewInspection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!registrationNumber || !vehicleMake || !vehicleModel || !inspectionDate) {
      setError('Please fill in all vehicle and inspection fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await inspectionService.createInspection({
        registration_number: registrationNumber,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        inspection_date: inspectionDate
      });

      if (res.inspectionId) {
        navigate(`/inspection/${res.inspectionId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create inspection. Please check database connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Create New Vehicle Inspection
              </h1>
              <p className="text-xs text-slate-500">
                Enter vehicle registration and model specifications to initiate visual damage evaluation
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Registration Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Registration Number *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DL 8C AB 1234 or MH 02 CD 5678"
                  className="input-field pl-9 font-mono uppercase tracking-wider text-xs"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard Indian RTO registration plate format
              </span>
            </div>

            {/* Vehicle Make */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Make *
              </label>
              <input
                type="text"
                required
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="e.g. Maruti Suzuki, Hyundai, Honda"
                className="input-field text-xs"
              />
            </div>

            {/* Vehicle Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Model *
              </label>
              <input
                type="text"
                required
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Swift Dzire, Baleno, WagonR"
                className="input-field text-xs"
              />
            </div>

            {/* Inspection Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Date *
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            {/* Inspector (Current user) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Inspector
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || 'Current Inspector'}
                  className="input-field pl-9 text-xs bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating Inspection...' : 'Create Inspection & Add Images'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
