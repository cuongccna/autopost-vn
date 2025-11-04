'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export type ValidationLevel = 'valid' | 'warning' | 'error';

export interface HashtagItemProps {
  hashtag: string;
  validation: {
    isValid: boolean;
    level: ValidationLevel;
    issues: string[];
    suggestions: string[];
    metadata?: {
      length?: number;
      isShadowban?: boolean;
      shadowbanSeverity?: 'high' | 'medium' | 'low';
    };
  };
  onRemove?: (hashtag: string) => void;
  showDetails?: boolean;
}

export default function HashtagItem({ 
  hashtag, 
  validation, 
  onRemove,
  showDetails = true 
}: HashtagItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusIcon = () => {
    switch (validation.level) {
      case 'valid':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (validation.level) {
      case 'valid':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const getSeverityBadge = () => {
    if (!validation.metadata?.isShadowban) return null;
    
    const severity = validation.metadata.shadowbanSeverity;
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors[severity || 'low']}`}>
        Shadowban
      </span>
    );
  };

  return (
    <div className="relative inline-block">
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${getStatusColor()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Status Icon */}
        {getStatusIcon()}
        
        {/* Hashtag Text */}
        <span className="text-sm font-medium">{hashtag}</span>
        
        {/* Shadowban Badge */}
        {getSeverityBadge()}
        
        {/* Length indicator */}
        {showDetails && validation.metadata?.length && (
          <span className="text-xs opacity-60">
            ({validation.metadata.length})
          </span>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={() => onRemove(hashtag)}
            className="ml-1 hover:bg-white/50 rounded p-0.5 transition-colors"
            title="Xóa hashtag"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tooltip with details */}
      {showTooltip && (validation.issues.length > 0 || validation.suggestions.length > 0) && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3">
          {/* Arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          
          {/* Issues */}
          {validation.issues.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Vấn đề:
              </div>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                {validation.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && (
            <div>
              <div className="font-semibold mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Gợi ý:
              </div>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                {validation.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
