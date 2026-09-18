import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import { ConditionBadge } from '../components/ConditionBadge';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { EmptyState } from '../components/EmptyState';
import { 
  Download, 
  ArrowLeft, 
  Car, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const ReportView = () => {
  const { id } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await inspectionService.getReportData(id);
        setReportData(res.report);
      } catch (err) {
        setError('Unable to load inspection report. Ensure inspection exists.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await inspectionService.downloadReportPDF(
        id, 
        reportData?.inspection?.registration_number || 'VEHICLE'
      );
    } catch (err) {
      alert('Failed to download PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Compiling inspection report...</span>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">
          {error || 'Report Unavailable'}
        </h2>
        <Link to="/dashboard" className="mt-4 btn-primary inline-flex">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { inspection, images, defects, severityCounts, conditionAssessment, formattedRange } = reportData;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to={`/inspection/${id}`}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold text-slate-700">
            Inspection Workspace / Final Report
          </span>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

      {/* PRINTABLE REPORT SHEET CONTAINER */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 sm:p-12 space-y-8">
        
        {/* REPORT HEADER - Strictly TRUEINSPECT (no subtitle) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b-2 border-red-600">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-red-600 text-white flex items-center justify-center">
                <Car className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                TRUEINSPECT
              </h1>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 block">
              VEHICLE INSPECTION REPORT
            </span>
          </div>

          <div className="text-right text-xs text-slate-500 space-y-0.5 font-mono">
            <div>Report ID: TI-{inspection.id.toString().padStart(5, '0')}</div>
            <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        {/* VEHICLE INFORMATION GRID */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Vehicle & Inspector Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Registration</span>
              <span className="text-sm font-mono font-bold text-slate-900 uppercase">
                {inspection.registration_number}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Make & Model</span>
              <span className="font-semibold text-slate-800">
                {inspection.vehicle_make} {inspection.vehicle_model}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Inspection Date</span>
              <span className="font-medium text-slate-800">
                {new Date(inspection.inspection_date).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Inspector</span>
              <span className="font-medium text-slate-800">
                {inspection.inspector_name || 'Inspector'}
              </span>
            </div>
          </div>
        </div>

        {/* INSPECTION SUMMARY METRICS */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Inspection Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Images Inspected</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{images.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Defects Detected</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{defects.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Minor</span>
              <span className="text-lg font-bold text-slate-700 mt-1 block">{severityCounts?.minor || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Moderate</span>
              <span className="text-lg font-bold text-amber-700 mt-1 block">{severityCounts?.moderate || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Major</span>
              <span className="text-lg font-bold text-red-700 mt-1 block">{severityCounts?.major || 0}</span>
            </div>
          </div>
        </div>

        {/* DETECTED DEFECTS TABLE */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Detected Exterior Defects & Cost Breakdown
          </h2>

          {defects.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-600 font-medium">
              No visible defects detected during inspection.
            </div>
          ) : (
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Component</th>
                    <th className="px-4 py-2.5">Defect Type</th>
                    <th className="px-4 py-2.5">Severity</th>
                    <th className="px-4 py-2.5">Confidence</th>
                    <th className="px-4 py-2.5">Estimated Refurbishment (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {defects.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td className="px-4 py-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{d.component}</td>
                      <td className="px-4 py-3">{d.defect_type}</td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          d.severity === 'Major' 
                            ? 'bg-red-100 text-red-800' 
                            : d.severity === 'Moderate' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {d.confidence !== null && d.confidence !== undefined 
                          ? `${Math.round(Number(d.confidence) * 100)}%` 
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {d.min_cost !== null && d.min_cost !== undefined
                          ? `₹${Number(d.min_cost).toLocaleString('en-IN')} – ₹${Number(d.max_cost).toLocaleString('en-IN')}`
                          : 'Cost rule unavailable'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ESTIMATED REFURBISHMENT SUMMARY & CONDITION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Cost Range */}
          <div className="p-5 rounded-lg bg-red-50/70 border border-red-200">
            <span className="text-xs font-bold uppercase tracking-wider text-red-800 block">
              Estimated Refurbishment Cost
            </span>
            <span className="text-2xl font-black text-slate-900 mt-2 block">
              {formattedRange}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Aggregated from individual panel repair rules in MySQL cost master
            </span>
          </div>

          {/* Condition Assessment */}
          <div className="p-5 rounded-lg bg-slate-50 border border-slate-200">
            <ConditionBadge
              grade={conditionAssessment?.grade}
              size="lg"
            />
            <p className="text-xs text-slate-600 mt-2">
              {conditionAssessment?.description}
            </p>
          </div>
        </div>

        {/* RECOMMENDED ACTION */}
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Recommended Action
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span>Repair identified defects</span>
            <span className="text-slate-400">→</span>
            <span>Reinspection</span>
            <span className="text-slate-400">→</span>
            <span>Final physical verification</span>
          </div>
        </div>

        {/* VISUAL EVIDENCE GALLERY */}
        {images.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Visual Inspection Evidence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div key={img.id} className="border border-slate-200 rounded overflow-hidden bg-slate-50 p-2">
                  <BoundingBoxOverlay
                    imageSrc={img.image_path}
                    defects={defects.filter((d) => d.image_id === img.id)}
                    altText={img.vehicle_area}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 px-1 font-medium">
                    <span>{img.vehicle_area}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{img.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISCLAIMER FOOTER */}
        <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          TRUEINSPECT is an independent computer vision inspection system. All refurbishment estimates are project reference values derived from the configurable MySQL cost master and do not constitute an official manufacturer quote or industry warranty.
        </div>

      </div>

    </div>
  );
};
