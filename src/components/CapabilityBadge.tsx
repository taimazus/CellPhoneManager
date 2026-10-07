import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { CapabilityItem } from '../services/capabilityService';

interface CapabilityBadgeProps {
  capability?: CapabilityItem;
  featureName?: string;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({ capability, featureName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!capability) return null;

  const getStatusBadge = () => {
    switch (capability.status) {
      case 'READY':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'آماده استفاده',
          colorClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        };
      case 'NEEDS_TOOL_OR_PERMISSION':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
          label: 'نیازمند مجوز / ابزار',
          colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
        };
      case 'NEEDS_CONFIG':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
          label: 'نیازمند تنظیم',
          colorClass: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
        };
      case 'UNSUPPORTED':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'عدم پشتیبانی',
          colorClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        };
      case 'INDETERMINATE':
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-stone-400" />,
          label: 'وضعیت نامشخص',
          colorClass: 'bg-stone-500/10 text-stone-300 border-stone-500/20'
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="flex flex-col gap-1.5 my-2">
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${badge.colorClass}`}
      >
        <div className="flex items-center gap-2">
          {badge.icon}
          <span>{featureName ? `${featureName}: ` : ''}{badge.label}</span>
        </div>
        {capability.reason && (
          isExpanded ? <ChevronUp className="w-3 h-3 opacity-70" /> : <ChevronDown className="w-3 h-3 opacity-70" />
        )}
      </button>

      {isExpanded && capability.reason && (
        <div className="p-3 rounded-xl bg-[#14151b] border border-amber-500/20 text-xs space-y-2 animate-fadeIn text-right">
          <p className="text-stone-300 leading-relaxed">{capability.reason}</p>
          {capability.actionGuide && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] flex items-start gap-2">
              <span className="font-bold">راهنما:</span>
              <span>{capability.actionGuide}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
