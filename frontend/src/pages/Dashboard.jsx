import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import { EmptyState } from '../components/EmptyState';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  PlusCircle, 
  ChevronRight, 
  FileText,
  Clock,
  Car
} from 'lucide-react';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await inspectionService.getDashboard();
      setData(res);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Unable to load dashboard data. Ensure backend and MySQL are configured.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Loading inspection metrics...</span>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalInspections: 0,
    completedInspections: 0,
    vehiclesRequiringRepair: 0,
    formattedTotalRefurbishment: '₹0'
  };

  const recent = data?.recentInspections || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inspection Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time vehicle intake, defect findings, and refurbishment metrics
          </p>
        </div>

        <Link
          to="/inspection/new"
          className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Inspection
        </Link>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        {/* Total Inspections */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inspections
            </span>
            <div className="p-2 bg-slate-100 rounded-md text-slate-700">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {stats.totalInspections}
            </span>
          </div>
        </div>

        {/* Completed Inspections */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completed Inspections
            </span>
            <div className="p-2 bg-emerald-50 rounded-md text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {stats.completedInspections}
            </span>
          </div>
        </div>

        {/* Vehicles Requiring Repair */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Vehicles Requiring Repair
            </span>
            <div className="p-2 bg-amber-50 rounded-md text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {stats.vehiclesRequiringRepair}
            </span>
          </div>
        </div>

        {/* Total Estimated Refurbishment */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Refurbishment
            </span>
            <div className="p-2 bg-red-50 rounded-md text-red-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900">
              {stats.formattedTotalRefurbishment}
            </span>
          </div>
        </div>

      </div>

      {/* Recent Inspections Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Recent Vehicle Inspections
          </h2>
          {recent.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              Showing {recent.length} recent record(s)
            </span>
          )}
        </div>

        {recent.length === 0 ? (
          /* Exact empty state required by Requirement 8 & 37 */
          <EmptyState 
            type="inspections" 
            message="No inspections available yet." 
            actionText="Create First Inspection"
            onAction={() => window.location.href = '/inspection/new'}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-3">Registration</th>
                    <th scope="col" className="px-5 py-3">Vehicle Details</th>
                    <th scope="col" className="px-5 py-3">Inspection Date</th>
                    <th scope="col" className="px-5 py-3">Inspector</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3">Defects</th>
                    <th scope="col" className="px-5 py-3">Estimated Cost</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {recent.map((insp) => {
                    const statusColors = {
                      CREATED: 'bg-slate-100 text-slate-700',
                      IN_PROGRESS: 'bg-blue-50 text-blue-700',
                      COMPLETED: 'bg-emerald-50 text-emerald-700'
                    };

                    const costDisplay = (insp.min_cost > 0 || insp.max_cost > 0)
                      ? `₹${Number(insp.min_cost).toLocaleString('en-IN')} – ₹${Number(insp.max_cost).toLocaleString('en-IN')}`
                      : '—';

                    return (
                      <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                          {insp.registration_number}
                        </td>
                        <td className="px-5 py-3.5 font-medium">
                          {insp.vehicle_make} {insp.vehicle_model}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {insp.inspector_name || 'Inspector'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusColors[insp.status] || 'bg-slate-100'}`}>
                            {insp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold">
                          {insp.defects_count > 0 ? (
                            <span className="text-red-700 font-bold">{insp.defects_count} Defect(s)</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {costDisplay}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <Link
                            to={`/inspection/${insp.id}`}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-red-700 font-semibold text-xs transition-colors"
                          >
                            Inspect
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {insp.status === 'COMPLETED' && (
                            <Link
                              to={`/report/${insp.id}`}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold text-xs ml-2"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Report
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
