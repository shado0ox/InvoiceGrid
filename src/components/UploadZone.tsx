import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle, Loader2, Sparkles, Image as ImageIcon, FileText, X } from 'lucide-react';
import { FileQueueItem } from '../types';
import { Translations } from '../i18n/translations';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  fileQueue: FileQueueItem[];
  onRemoveQueueItem?: (id: string) => void;
  isProcessing: boolean;
  t: Translations;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  fileQueue,
  onRemoveQueueItem,
  isProcessing,
  t,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support pasting images directly from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        onFilesSelected(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      e.target.value = '';
    }
  };

  const completedCount = fileQueue.filter((item) => item.status === 'done').length;

  return (
    <div className="mb-6 space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-950/20 shadow-lg shadow-emerald-950/40 scale-[1.005]'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 shadow-md ${
              isDragOver
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-emerald-400 border border-slate-700/80'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              {isDragOver ? t.dropTitleDrag : t.dropTitleNormal}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {t.dropSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <FileText className="w-3.5 h-3.5 text-red-400" /> {t.pdfBadge}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> {t.ocrBadge}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {t.batchBadge}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[11px]">
              <FileType className="w-3.5 h-3.5 text-emerald-400" /> {t.uploadLimitsBadge}
            </span>
          </div>
        </div>
      </div>

      {/* File Processing Queue List if any files uploaded */}
      {fileQueue.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <FileType className="w-4 h-4 text-emerald-400" />
              {t.queueTitle} ({completedCount} / {fileQueue.length})
            </span>
            {isProcessing && (
              <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.processingAi}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${fileQueue.length > 0 ? (completedCount / fileQueue.length) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Files Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {fileQueue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                  item.status === 'processing'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : item.status === 'done'
                    ? 'bg-slate-800/50 border-slate-700/60 text-slate-300'
                    : item.status === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800/30 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                  {item.status === 'processing' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  )}
                  {item.status === 'pending' && (
                    <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  )}

                  <span className="truncate font-mono" title={item.name}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 mx-2">
                  <span className="text-[10px] text-slate-500">
                    {(item.size / 1024).toFixed(0)} KB
                  </span>
                  {onRemoveQueueItem && item.status !== 'processing' && (
                    <button
                      type="button"
                      onClick={() => onRemoveQueueItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title={t.remove}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
