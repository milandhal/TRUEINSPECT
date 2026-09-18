import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { costService } from '../services/costService';
import { 
  Settings as SettingsIcon, 
  Plus, 
  Check, 
  X, 
  ToggleLeft, 
  ToggleRight, 
  Edit2, 
  ShieldAlert, 
  AlertCircle,
  IndianRupee
} from 'lucide-react';

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
  'Roof'
];

const DEFECT_TYPES = [
  'Dent',
  'Scratch',
  'Crack',
  'Broken Lamp',
  'Glass Damage',
  'Tire Damage'
];

export const Settings = () => {
  const { user, isManager } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [component, setComponent] = useState('Front Door');
  const [defectType, setDefectType] = useState('Dent');
  const [severity, setSeverity] = useState('Minor');
  const [action, setAction] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await costService.getAllRules();
      setRules(res.rules || []);
      setError('');
    } catch (err) {
      console.error('Error loading cost rules:', err);
      setError('Unable to load repair cost rules. Ensure MySQL database is connected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenAddModal = () => {
    setEditingRuleId(null);
    setComponent('Front Door');
    setDefectType('Dent');
    setSeverity('Minor');
    setAction('');
    setMinCost('');
    setMaxCost('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRuleId(rule.id);
    setComponent(rule.component);
    setDefectType(rule.defect_type);
    setSeverity(rule.severity);
    setAction(rule.action);
    setMinCost(rule.min_cost);
    setMaxCost(rule.max_cost);
    setIsModalOpen(true);
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingRuleId) {
        await costService.updateRule(editingRuleId, {
          component,
          defect_type: defectType,
          severity,
          action,
          min_cost: minCost,
          max_cost: maxCost,
          active: true
        });
        setSuccess('Repair cost rule updated successfully.');
      } else {
        await costService.createRule({
          component,
          defect_type: defectType,
          severity,
          action,
          min_cost: minCost,
          max_cost: maxCost
        });
        setSuccess('New repair cost rule created successfully.');
      }

      setIsModalOpen(false);
      await fetchRules();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save repair cost rule.';
      setError(msg);
    }
  };

  const handleToggleActive = async (ruleId) => {
    if (!isManager) return;
    try {
      await costService.toggleRuleActive(ruleId);
      await fetchRules();
    } catch (err) {
      setError('Failed to toggle rule active status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Repair Cost Master
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configurable benchmark repair actions and cost boundaries stored in MySQL
          </p>
        </div>

        {isManager ? (
          <button
            onClick={handleOpenAddModal}
            className="btn-primary inline-flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Cost Rule
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            Inspector Access (View Only)
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-700 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Configured Rules ({rules.length})</span>
          <span className="text-slate-400 font-normal">All amounts in Indian Rupees (₹)</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No repair cost rules found in database. You can add one or load database/repair_cost_master_template.sql in MySQL Workbench.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Component</th>
                  <th className="px-4 py-3">Defect Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Standard Action</th>
                  <th className="px-4 py-3">Min Cost (₹)</th>
                  <th className="px-4 py-3">Max Cost (₹)</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  {isManager && <th className="px-4 py-3 text-right">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{rule.component}</td>
                    <td className="px-4 py-3">{rule.defect_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rule.severity === 'Major' 
                          ? 'bg-red-100 text-red-800' 
                          : rule.severity === 'Moderate' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{rule.action}</td>
                    <td className="px-4 py-3 font-mono">₹{Number(rule.min_cost).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono">₹{Number(rule.max_cost).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(rule.id)}
                        disabled={!isManager}
                        className={`inline-flex items-center transition-opacity ${!isManager ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                      >
                        {rule.active ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="text-slate-500 hover:text-red-700 font-semibold p-1"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Cost Rule Modal (Manager only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border border-slate-200 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingRuleId ? 'Edit Repair Cost Rule' : 'Add New Repair Cost Rule'}
            </h3>

            <form onSubmit={handleSubmitRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Component *
                </label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="input-field text-xs"
                >
                  {VEHICLE_COMPONENTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Defect Type *
                  </label>
                  <select
                    value={defectType}
                    onChange={(e) => setDefectType(e.target.value)}
                    className="input-field text-xs"
                  >
                    {DEFECT_TYPES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="Minor">Minor</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Major">Major</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repair Action Description *
                </label>
                <input
                  type="text"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="e.g. Paintless Dent Removal (PDR) or Panel repaint"
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={minCost}
                    onChange={(e) => setMinCost(e.target.value)}
                    placeholder="1200.00"
                    className="input-field text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Cost (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                    placeholder="1800.00"
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingRuleId ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
