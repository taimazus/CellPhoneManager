import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb, Sparkles, ExternalLink } from 'lucide-react';

interface TabGuideCardProps {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  onOpenFullGuide?: () => void;
  defaultExpanded?: boolean;
}

export const TabGuideCard: React.FC<TabGuideCardProps> = ({
  title,
  description,
  steps = [],
  tips = [],
  onOpenFullGuide,
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#13141f] via-[#171926] to-amber-950/20 border border-amber-500/25 p-4 transition-all shadow-md shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-amber-500/15 text-yellow-400 border border-amber-500/30 shrink-0 shadow-sm shadow-amber-500/10">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{title}</span>
            </h4>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFullGuide && (
            <button
              type="button"
              onClick={onOpenFullGuide}
              className="text-[11px] text-yellow-300 hover:text-yellow-200 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all active:scale-95"
            >
              <span>راهنمای جامع</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 border border-stone-700/60 hover:border-amber-500/30 text-stone-300 hover:text-yellow-300 transition-all text-xs font-bold flex items-center gap-1"
          >
            <span>{expanded ? 'بستن راهنما' : 'مشاهده آموزش'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3 border-t border-amber-500/15 space-y-3 animate-fadeIn text-xs text-stone-300 leading-relaxed">
          {steps.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-yellow-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>مراحل استفاده و نحوه کار:</span>
              </span>
              <ol className="list-decimal list-inside space-y-1 text-stone-200 pr-1">
                {steps.map((step, idx) => (
                  <li key={idx} className="leading-5">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tips.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-amber-400 block">💡 نکات کلیدی و توصیه‌های ایمنی:</span>
              <ul className="list-disc list-inside space-y-1 text-stone-400 pr-1">
                {tips.map((tip, idx) => (
                  <li key={idx} className="leading-5">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
