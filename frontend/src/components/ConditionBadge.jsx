import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ConditionBadge = ({ grade, showLabel = true, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (grade) {
      case 'Good':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        };
      case 'Good / Minor Repairs':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />
        };
      case 'Fair':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />
        };
      case 'Needs Major Repair':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />
        };
      case 'Extensive Repair Required':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: <ShieldAlert className="w-4 h-4 text-red-600" />
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <AlertCircle className="w-4 h-4 text-slate-500" />
        };
    }
  };

  const { bg, icon } = getBadgeStyle();

  return (
    <div className="inline-flex flex-col">
      {showLabel && (
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
          TRUEINSPECT Visual Condition Assessment
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${bg} ${
          size === 'lg' ? 'px-3 py-1.5 text-base' : 'px-2.5 py-1 text-xs'
        }`}
      >
        {icon}
        {grade || 'Good'}
      </span>
    </div>
  );
};
