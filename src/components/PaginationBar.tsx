import React from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  className?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'مورد',
  className = ''
}) => {
  if (totalItems <= pageSize && currentPage === 1) {
    return null;
  }

  const fromItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const toItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers window (e.g., [1, 2, 3, 4, 5])
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift(-1); // ellipsis
    }
    if (currentPage + delta < totalPages - 1) {
      range.push(-2); // ellipsis
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300 select-none animate-fadeIn ${className}`}
      dir="rtl"
    >
      {/* Stats summary */}
      <div className="flex items-center gap-2 font-sans">
        <span className="text-slate-400">
          نمایش <span className="text-amber-300 font-bold font-mono">{fromItem.toLocaleString('fa-IR')}</span> تا{' '}
          <span className="text-amber-300 font-bold font-mono">{toItem.toLocaleString('fa-IR')}</span> از مجموع{' '}
          <span className="text-cyan-400 font-bold font-mono">{totalItems.toLocaleString('fa-IR')}</span> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1 mr-3 border-r border-slate-700/80 pr-3">
            <span className="text-[11px] text-slate-400">در هر صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value={30}>۳۰</option>
              <option value={60}>۶۰</option>
              <option value={100}>۱۰۰</option>
              <option value={200}>۲۰۰</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="صفحه اول"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="صفحه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p < 0) {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-500 font-mono">
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20 font-mono'
                    : 'bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono'
                }`}
              >
                {p.toLocaleString('fa-IR')}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="صفحه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="صفحه آخر"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
