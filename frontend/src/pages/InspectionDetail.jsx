import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { inspectionService } from '../services/inspectionService';
import { CameraCaptureModal } from '../components/CameraCaptureModal';
import { BoundingBoxOverlay } from '../components/BoundingBoxOverlay';
import { ConditionBadge } from '../components/ConditionBadge';
import { EmptyState } from '../components/EmptyState';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  FileText, 
  ArrowLeft, 
  Plus, 
  Tag, 
  ShieldAlert,
  Info,
  Car,
  Loader2
} from 'lucide-react';

const VEHICLE_AREAS = [
  'Front',
  'Rear',
  'Left Side',
  'Right Side',
  'Front Left',
  'Front Right',
  'Rear Left',
  'Rear Right',
  'Interior',
  'Other'
];

const DEFECT_TYPES = [
  'Dent',
  'Scratch',
  'Crack',
  'Broken Lamp',
  'Glass Damage',
  'Tire Damage'
];

const VEHICLE_COMPONENTS = [
  'Front Door',
  'Rear Door',
  'Front Bumper',
  'Rear Bumper',
  'Bonnet',
  'Boot',
  'Front Fender',
  'Rear Quarter Panel',
  'Headlamp',
  'Taillamp',
  'Windshield',
  'Side Window',
  'Tire',
  'Roof',
  'General Body'
];

export const InspectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState(null);
  const [images, setImages] = useState([]);
  const [defects, setDefects] = useState([]);
  const [estimateData, setEstimateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState(null);
  const [analyzingImageId, setAnalyzingImageId] = useState(null);

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Staged files for batch upload
  const [stagedFiles, setStagedFiles] = useState([]);
  const [selectedArea, setSelectedArea] = useState('Front');
  const [uploading, setUploading] = useState(false);

  // Manual Defect modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualComponent, setManualComponent] = useState('Front Door');
  const [manualDefectType, setManualDefectType] = useState('Dent');
  const [manualSeverity, setManualSeverity] = useState('Minor');
  const [manualImageId, setManualImageId] = useState('');

  // Selected image for detailed inspection view
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchInspectionDetails = async () => {
    try {
      setLoading(true);
      const res = await inspectionService.getInspectionById(id);
      setInspection(res.inspection);
      setImages(res.images || []);
      setDefects(res.defects || []);
      if (res.images && res.images.length > 0 && !selectedImage) {
        setSelectedImage(res.images[0]);
      }
      
      // Also fetch existing estimates if any
      try {
        const estRes = await inspectionService.getEstimate(id);
        if (estRes.estimates && estRes.estimates.length > 0) {
          setEstimateData(estRes);
        }
      } catch (e) {
        // Estimates not calculated yet
      }

      setError('');
    } catch (err) {
      console.error('Error fetching inspection details:', err);
      setError('Unable to load inspection details. Check database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectionDetails();
  }, [id]);

  // Handle camera snapshot captured
  const handleCameraPhoto = (file, previewUrl) => {
    setStagedFiles((prev) => [
      ...prev,
      { file, previewUrl, area: selectedArea, source: 'CAMERA' }
    ]);
  };

  // Handle file picker selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newStaged = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      area: selectedArea,
      source: 'UPLOAD'
    }));
    setStagedFiles((prev) => [...prev, ...newStaged]);
    e.target.value = null; // reset input
  };

  const removeStagedFile = (index) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload staged images to server
  const handleUploadStaged = async () => {
    if (stagedFiles.length === 0) return;
    try {
      setUploading(true);
      setAiMessage(null);
      
      const formData = new FormData();
      stagedFiles.forEach((item) => {
        formData.append('images', item.file);
      });
      formData.append('vehicle_area', selectedArea);
      formData.append('source', stagedFiles[0]?.source || 'UPLOAD');

      await inspectionService.uploadImages(id, formData);
      setStagedFiles([]);
      await fetchInspectionDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload images.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Delete uploaded image
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    try {
      await inspectionService.deleteImage(id, imageId);
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      await fetchInspectionDetails();
    } catch (err) {
      setError('Failed to delete image.');
    }
  };

  // Run AI Defect Detection
  const handleRunAI = async (imageId) => {
    try {
      setAnalyzingImageId(imageId);
      setAiMessage({ type: 'info', text: 'Running AI defect analysis on vehicle panel...' });
      const res = await inspectionService.runAIDetection(id, imageId);
      
      if (res.defects && res.defects.length > 0) {
        setAiMessage({
          type: 'success',
          text: `AI Analysis Complete: ${res.defects.length} defect(s) detected.`
        });
      } else {
        setAiMessage({
          type: 'info',
          text: 'AI Analysis Complete: No visible damage detected on this panel.'
        });
      }

      await fetchInspectionDetails();
    } catch (err) {
      // Technical honesty (Requirement 18)
      const msg = err.response?.data?.message || 'AI detection service unavailable. Please ensure the AI service is running.';
      setAiMessage({ type: 'warning', text: msg });
    } finally {
      setAnalyzingImageId(null);
    }
  };

  // Submit manual defect record
  const handleSaveManualDefect = async (e) => {
    e.preventDefault();
    try {
      await inspectionService.addManualDefect(id, {
        component: manualComponent,
        defect_type: manualDefectType,
        severity: manualSeverity,
        image_id: manualImageId ? parseInt(manualImageId, 10) : (selectedImage?.id || null)
      });
      setIsManualModalOpen(false);
      await fetchInspectionDetails();
    } catch (err) {
      setError('Failed to log defect.');
    }
  };

  // Delete defect
  const handleDeleteDefect = async (defectId) => {
    try {
      await inspectionService.deleteDefect(id, defectId);
      await fetchInspectionDetails();
    } catch (err) {
      setError('Failed to remove defect.');
    }
  };

  // Calculate Refurbishment Cost using MySQL Cost Master
  const handleCalculateEstimate = async () => {
    try {
      const res = await inspectionService.generateEstimate(id);
      setEstimateData(res.estimate);
      await fetchInspectionDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to calculate estimate from repair cost master.';
      setError(msg);
    }
  };

  // Finalize inspection status
  const handleFinalizeInspection = async () => {
    try {
      await inspectionService.updateInspectionStatus(id, 'COMPLETED');
      navigate(`/report/${id}`);
    } catch (err) {
      setError('Failed to finalize inspection.');
    }
  };

  if (loading && !inspection) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Loading inspection workspace...</span>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Inspection Not Found</h2>
        <Link to="/dashboard" className="mt-4 btn-primary inline-flex">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl font-extrabold text-slate-900 tracking-wider">
                {inspection.registration_number}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {inspection.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {inspection.vehicle_make} {inspection.vehicle_model} • Inspected by {inspection.inspector_name || 'Inspector'} on {new Date(inspection.inspection_date).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/report/${id}`}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            View Inspection Report
          </Link>
          {inspection.status !== 'COMPLETED' && (
            <button
              onClick={handleFinalizeInspection}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalize Inspection
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {aiMessage && (
        <div className={`p-3 rounded-md border flex items-start gap-2.5 text-xs font-medium ${
          aiMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : aiMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{aiMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: VEHICLE IMAGE INTAKE & CAMERA */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Vehicle Visual Evidence
            </h2>
            <p className="text-xs text-slate-500">
              Capture via camera or upload panel photos (JPG, PNG)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Area assignment selector */}
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="input-field py-1 text-xs w-36"
              >
                {VEHICLE_AREAS.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Real Camera Capture button */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs"
            >
              <Camera className="w-4 h-4 text-red-600" />
              Capture Image
            </button>

            {/* Upload image button */}
            <label className="btn-secondary flex items-center gap-1.5 text-xs cursor-pointer">
              <Upload className="w-4 h-4 text-slate-700" />
              Upload Image
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Staged Images Tray (Before Upload) */}
        {stagedFiles.length > 0 && (
          <div className="p-4 bg-amber-50/50 border-b border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-900">
                Staged for upload ({stagedFiles.length} photo{stagedFiles.length > 1 ? 's' : ''})
              </span>
              <button
                onClick={handleUploadStaged}
                disabled={uploading}
                className="btn-primary py-1 px-3 text-xs"
              >
                {uploading ? 'Uploading...' : 'Confirm Upload to Server'}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto py-2">
              {stagedFiles.map((item, idx) => (
                <div key={idx} className="relative shrink-0 w-28 rounded-md border border-slate-300 bg-white p-1">
                  <img
                    src={item.previewUrl}
                    alt="Preview"
                    className="w-full h-20 object-cover rounded"
                  />
                  <span className="text-[10px] block truncate text-slate-600 mt-1 text-center font-medium">
                    {item.area} ({item.source})
                  </span>
                  <button
                    onClick={() => removeStagedFile(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Images List */}
        <div className="p-6">
          {images.length === 0 ? (
            /* Requirement 37 Empty state */
            <EmptyState
              type="images"
              message="No images uploaded yet."
              actionText="Capture First Image"
              onAction={() => setIsCameraOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((img) => {
                const isSelected = selectedImage?.id === img.id;
                const imgDefects = defects.filter((d) => d.image_id === img.id);

                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`group relative rounded-lg border p-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-600 ring-2 ring-red-100 bg-red-50/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={img.image_path}
                      alt={img.vehicle_area}
                      className="w-full h-28 object-cover rounded"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700 truncate">
                        {img.vehicle_area}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                        {img.source}
                      </span>
                    </div>

                    {imgDefects.length > 0 && (
                      <span className="mt-1 block text-[10px] font-bold text-red-600">
                        {imgDefects.length} defect{imgDefects.length > 1 ? 's' : ''}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img.id);
                      }}
                      title="Delete Image"
                      className="absolute top-2 right-2 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: DEFECT ANALYSIS & BOUNDING BOX VISUALIZATION */}
      {selectedImage && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Image with Bounding Boxes */}
          <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Panel Inspection: {selectedImage.vehicle_area}
                </h3>
                <span className="text-xs text-slate-400">
                  Uploaded via {selectedImage.source} • {new Date(selectedImage.uploaded_at).toLocaleTimeString('en-IN')}
                </span>
              </div>

              {/* Run AI Detection Trigger */}
              <button
                onClick={() => handleRunAI(selectedImage.id)}
                disabled={analyzingImageId === selectedImage.id}
                className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {analyzingImageId === selectedImage.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Panel...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Run AI Detection
                  </>
                )}
              </button>
            </div>

            {/* Bounding Box Image Display */}
            <BoundingBoxOverlay
              imageSrc={selectedImage.image_path}
              defects={defects.filter((d) => d.image_id === selectedImage.id)}
              altText={`Vehicle ${selectedImage.vehicle_area}`}
            />
          </div>

          {/* Right: Panel Defect Controls & Manual Addition */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Panel Findings
                </h3>
                <button
                  onClick={() => {
                    setManualImageId(selectedImage.id);
                    setIsManualModalOpen(true);
                  }}
                  className="btn-secondary text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  Log Manual Defect
                </button>
              </div>

              {defects.filter((d) => d.image_id === selectedImage.id).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No defects logged on this panel yet. Click "Run AI Detection" or "Log Manual Defect".
                </div>
              ) : (
                <div className="space-y-2">
                  {defects
                    .filter((d) => d.image_id === selectedImage.id)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-md border border-slate-200 bg-slate-50/70 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-800">
                              {d.component}: {d.defect_type}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              d.severity === 'Major' 
                                ? 'bg-red-100 text-red-800' 
                                : d.severity === 'Moderate' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {d.severity}
                            </span>
                          </div>
                          {d.confidence !== null && (
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              AI Confidence: {Math.round(Number(d.confidence) * 100)}%
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteDefect(d.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Remove Defect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Note: Confidence is only displayed when supplied by the trained model.
            </div>
          </div>

        </div>
      )}

      {/* SECTION 3: COMPLETE DEFECT LOG & REPAIR COST MASTER LOOKUP */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Identified Defects & Refurbishment Cost
            </h2>
            <p className="text-xs text-slate-500">
              Rules matched strictly from MySQL repair_cost_master (No hard-coded costs)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setManualImageId('');
                setIsManualModalOpen(true);
              }}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Defect
            </button>
            <button
              onClick={handleCalculateEstimate}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4" />
              Calculate Refurbishment Cost
            </button>
          </div>
        </div>

        <div className="p-6">
          {defects.length === 0 ? (
            /* Requirement 37 Empty state */
            <EmptyState
              type="defects"
              message="No defects detected."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">#</th>
                    <th scope="col" className="px-4 py-2.5">Component</th>
                    <th scope="col" className="px-4 py-2.5">Defect Type</th>
                    <th scope="col" className="px-4 py-2.5">Severity</th>
                    <th scope="col" className="px-4 py-2.5">Confidence</th>
                    <th scope="col" className="px-4 py-2.5">Recommended Action</th>
                    <th scope="col" className="px-4 py-2.5">Refurbishment Cost (₹)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {defects.map((d, index) => {
                    const hasCost = d.min_cost !== null && d.min_cost !== undefined;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{d.component}</td>
                        <td className="px-4 py-3">{d.defect_type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
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
                        <td className="px-4 py-3 text-slate-600">
                          {d.recommended_action || d.repair_action || 'Pending cost calculation'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {hasCost ? (
                            `₹${Number(d.min_cost).toLocaleString('en-IN')} – ₹${Number(d.max_cost).toLocaleString('en-IN')}`
                          ) : (
                            <span className="text-slate-400 font-normal italic">
                              Cost estimation unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteDefect(d.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ESTIMATE & CONDITION BANNER */}
          {estimateData && (
            <div className="mt-6 p-5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Estimated Refurbishment Cost
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {estimateData.formattedRange}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Calculated from MySQL repair_cost_master reference benchmark rules
                </span>
              </div>

              <div>
                <ConditionBadge
                  grade={estimateData.conditionAssessment?.grade}
                  size="lg"
                />
                <p className="text-xs text-slate-600 mt-2">
                  {estimateData.conditionAssessment?.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal Component */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapturePhoto={handleCameraPhoto}
      />

      {/* Manual Defect Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Log Vehicle Defect
            </h3>
            <form onSubmit={handleSaveManualDefect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Component
                </label>
                <select
                  value={manualComponent}
                  onChange={(e) => setManualComponent(e.target.value)}
                  className="input-field text-xs"
                >
                  {VEHICLE_COMPONENTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect Type
                </label>
                <select
                  value={manualDefectType}
                  onChange={(e) => setManualDefectType(e.target.value)}
                  className="input-field text-xs"
                >
                  {DEFECT_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Severity
                </label>
                <select
                  value={manualSeverity}
                  onChange={(e) => setManualSeverity(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Major">Major</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Save Defect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
