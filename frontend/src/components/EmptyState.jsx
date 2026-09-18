import React from 'react';
import { AlertCircle, FolderOpen, ImageOff, FileText, Wrench } from 'lucide-react';

export const EmptyState = ({ 
  type = 'default', 
  message, 
  actionText, 
  onAction 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'inspections':
        return <FolderOpen className="w-10 h-10 text-slate-400" />;
      case 'images':
        return <ImageOff className="w-10 h-10 text-slate-400" />;
      case 'defects':
        return <Wrench className="w-10 h-10 text-slate-400" />;
      case 'reports':
        return <FileText className="w-10 h-10 text-slate-400" />;
      default:
        return <AlertCircle className="w-10 h-10 text-slate-400" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'inspections':
        return 'No inspections available yet.';
      case 'images':
        return 'No images uploaded yet.';
      case 'defects':
        return 'No defects detected.';
      case 'estimation':
        return 'No cost estimation available.';
      case 'reports':
        return 'No completed reports available.';
      default:
        return 'No data available.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-dashed border-slate-300 text-center my-4">
      <div className="p-3 bg-slate-50 rounded-full mb-3">
        {getIcon()}
      </div>
      <p className="text-slate-600 font-medium text-sm">
        {message || getDefaultMessage()}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3 btn-primary"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
