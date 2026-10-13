import React from 'react';
import { X, FileText, Download, CheckCircle } from 'lucide-react';
import { InvoiceRow } from '../types';
import { Translations, Language } from '../i18n/translations';

interface DocumentPreviewModalProps {
  invoice: InvoiceRow | null;
  onClose: () => void;
  t: Translations;
  language: Language;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  invoice,
  onClose,
  t,
  language,
}) => {
  if (!invoice) return null;

  const isPdf = invoice.fileMimeType?.includes('pdf') || invoice.fileName?.endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface border border-line rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">
                {t.previewModalTitle} {invoice.sellerName || invoice.fileName || '—'}
              </h3>
              <p className="text-[11px] text-muted font-mono">
                {t.previewModalSubtitle} {invoice.invoiceNumber || '—'} | {t.colDate}: {invoice.date || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice.filePreviewUrl && (
              <a
                href={invoice.filePreviewUrl}
                download={invoice.fileName || 'invoice_document'}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition text-xs flex items-center gap-1"
                title={t.downloadOriginal}
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-canvas transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Side by Side (Document Viewer & Extracted OCR Fields) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-surface">
          {/* Document Viewer (7 cols) */}
          <div className={`md:col-span-7 border-b md:border-b-0 p-4 flex items-center justify-center overflow-auto bg-surface ${
            language === 'ar' ? 'md:border-l border-line' : 'md:border-r border-line'
          }`}>
            {invoice.filePreviewUrl ? (
              isPdf ? (
                <iframe
                  src={invoice.filePreviewUrl}
                  title="PDF Preview"
                  className="w-full h-full rounded-xl border border-line bg-white"
                />
              ) : (
                <img
                  src={invoice.filePreviewUrl}
                  alt="Invoice Scanned Document"
                  className="max-w-full max-h-full object-contain rounded-xl border border-line shadow-lg"
                />
              )
            ) : (
              <div className="text-center text-muted p-8">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{t.noDocPreview}</p>
              </div>
            )}
          </div>

          {/* Extracted Data Verification Panel (5 cols) */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-4 bg-surface">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold text-ink">{t.extractedOcrTitle}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                {language === 'ar' ? 'راجع البيانات مع الأصل' : 'Check against the original'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface p-3 rounded-xl border border-line">
                <span className="text-muted block text-[11px] mb-0.5">{t.colSeller} ({t.subSeller}):</span>
                <span className="text-ink font-semibold text-sm">{invoice.sellerName || '—'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface p-3 rounded-xl border border-line">
                  <span className="text-muted block text-[11px] mb-0.5">{t.colDate} ({t.subDate}):</span>
                  <span className="font-mono text-ink font-semibold">{invoice.date || '—'}</span>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-line">
                  <span className="text-muted block text-[11px] mb-0.5">{t.colInvNo} ({t.subInvNo}):</span>
                  <span className="font-mono text-emerald-700 font-bold">{invoice.invoiceNumber || '—'}</span>
                </div>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-line">
                <span className="text-muted block text-[11px] mb-0.5">{t.colTaxNo} ({t.subTaxNo}):</span>
                <span className="font-mono text-ink tracking-wider font-semibold">
                  {invoice.taxNumber || '—'}
                </span>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-line">
                <span className="text-muted block text-[11px] mb-0.5">{t.colDetails} ({t.subDetails}):</span>
                <p className="text-ink leading-relaxed">{invoice.details || '—'}</p>
              </div>

              {/* Financial Box */}
              <div className="bg-surface p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t.colBeforeTax}:</span>
                  <span className="font-mono text-amber-700 font-bold">
                    {(Number(invoice.amountBeforeTax) || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">{t.colTax}:</span>
                  <span className="font-mono text-violet-700 font-bold">
                    {(Number(invoice.tax) || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-emerald-700 font-bold">{t.colLastAmount}:</span>
                  <span className="font-mono text-emerald-700 font-extrabold text-base">
                    {(Number(invoice.lastAmount) || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
