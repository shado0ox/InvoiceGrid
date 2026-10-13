import React from 'react';
import { Loader2, Pause, Play, StopCircle, Clock, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Translations, Language } from '../i18n/translations';

interface BatchProgressOverlayProps {
  isOpen: boolean;
  currentIndex: number;
  totalFiles: number;
  extractedInvoicesCount: number;
  currentChunk: number;
  totalChunks: number;
  estimatedRemainingSeconds: number;
  isCooldown: boolean;
  cooldownSecondsRemaining: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  t: Translations;
  language: Language;
}

export const BatchProgressOverlay: React.FC<BatchProgressOverlayProps> = ({
  isOpen,
  currentIndex,
  totalFiles,
  extractedInvoicesCount,
  currentChunk,
  totalChunks,
  estimatedRemainingSeconds,
  isCooldown,
  cooldownSecondsRemaining,
  isPaused,
  onPause,
  onResume,
  onCancel,
  t,
  language,
}) => {
  if (!isOpen) return null;

  const percentage = totalFiles > 0 ? Math.min(100, Math.round((currentIndex / totalFiles) * 100)) : 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-40 bg-slate-900/95 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            {isCooldown ? (
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            ) : isPaused ? (
              <Pause className="w-4 h-4 text-amber-400" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              {t.batchProgressTitle}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              {t.batchChunkInfo(currentChunk, totalChunks)}
            </p>
          </div>
        </div>

        {/* Big Percentage Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-sm">
          {percentage}%
        </div>
      </div>

      {/* Main Status Text */}
      <div className="py-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">
            {t.batchProcessingFile(currentIndex, totalFiles)}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-bold">
            +{extractedInvoicesCount} {t.invoicesCountSuffix}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Dynamic Cooldown or ETA Notice */}
        {isCooldown ? (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{t.batchCooldownWaiting(cooldownSecondsRemaining)}</span>
          </div>
        ) : isPaused ? (
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-2 text-xs text-slate-300">
            <Pause className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{t.batchPausedMessage}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3 h-3 text-sky-400" />
              {t.batchSmartPacing}
            </span>
            <span className="font-mono text-slate-300 font-medium">
              {t.batchEstRemaining(estimatedRemainingSeconds)}
            </span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              type="button"
              onClick={onResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t.batchResume}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              disabled={isCooldown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 transition"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>{t.batchPause}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
            title="إيقاف المتبقي مع الاحتفاظ بالفواتير التي تم استخراجها"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>{t.batchCancel}</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {totalFiles - currentIndex} متبقي
        </span>
      </div>
    </div>
  );
};
