import { useDialog } from '../utils/useDialog';
import React, { useState, useEffect } from 'react';
import { X, Check, Calculator } from 'lucide-react';
import { InvoiceRow } from '../types';
import { Translations, Language } from '../i18n/translations';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Partial<InvoiceRow>) => void;
  initialData?: InvoiceRow | null;
  nextSequenceNo: number;
  t: Translations;
  language: Language;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  nextSequenceNo,
  t,
  language,
}) => {
  const dialog = useDialog(isOpen, onClose);
  const [formData, setFormData] = useState<Partial<InvoiceRow>>(initialData || {
    no: nextSequenceNo,
    date: new Date().toISOString().split('T')[0],
    sellerName: '',
    taxNumber: '',
    invoiceNumber: '',
    details: '',
    amountBeforeTax: 0,
    tax: 0,
    lastAmount: 0,
    currency: 'SAR',
    taxRatePercent: 15,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        no: nextSequenceNo,
        date: new Date().toISOString().split('T')[0],
        sellerName: '',
        taxNumber: '',
        invoiceNumber: '',
        details: '',
        amountBeforeTax: 0,
        tax: 0,
        lastAmount: 0,
        currency: 'SAR',
        taxRatePercent: 15,
      });
    }
  }, [initialData, nextSequenceNo, isOpen]);

  if (!isOpen) return null;

  const handleRatePreset = (rate: number) => {
    const amount = Number(formData.amountBeforeTax) || 0;
    const computedTax = Number(((amount * rate) / 100).toFixed(2));
    const computedTotal = Number((amount + computedTax).toFixed(2));

    setFormData({
      ...formData,
      taxRatePercent: rate,
      tax: computedTax,
      lastAmount: computedTotal,
    });
  };

  const handleAmountBeforeChange = (val: number) => {
    if (initialData?.extractionSource === 'MANUAL' && !Number.isFinite(formData.tax)) {
      setFormData({ ...formData, amountBeforeTax: val });
      return;
    }
    const rate = formData.taxRatePercent !== undefined ? formData.taxRatePercent : 15;
    const computedTax = Number(((val * rate) / 100).toFixed(2));
    const computedTotal = Number((val + computedTax).toFixed(2));

    setFormData({
      ...formData,
      amountBeforeTax: val,
      tax: computedTax,
      lastAmount: computedTotal,
    });
  };

  const handleTaxChange = (val: number) => {
    const amountBefore = Number(formData.amountBeforeTax);
    const computedTotal = Number((amountBefore + val).toFixed(2));
    const rate = amountBefore > 0 ? Number(((val / amountBefore) * 100).toFixed(1)) : 0;

    setFormData({
      ...formData,
      tax: val,
      taxRatePercent: rate,
      lastAmount: computedTotal,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={dialog} role="dialog" aria-modal="true" aria-label={initialData ? t.modalEditTitle : t.modalAddTitle} className="bg-surface border border-line rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-auto shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700" />
            {initialData ? t.modalEditTitle : t.modalAddTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-canvas transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={initialData?.filePreviewUrl ? 'grid md:grid-cols-2' : 'max-w-xl mx-auto'}>
          {initialData?.filePreviewUrl && <section className="bg-canvas p-4 border-b md:border-b-0 md:border-e border-line">
            <p className="text-xs font-semibold text-muted mb-3">{language === 'ar' ? 'الأصل — راجع الحقول قبل التصدير' : 'Original — review fields before export'}</p>
            {initialData.fileMimeType === 'application/pdf' ? <iframe title={initialData.fileName || 'Invoice PDF'} src={`${initialData.filePreviewUrl}#page=${initialData.filePageNumber || 1}`} className="w-full h-[40vh] md:h-[65vh] rounded-lg bg-white" /> : <img src={`${initialData.filePreviewUrl}#page=${initialData.filePageNumber || 1}`} alt={initialData.fileName || 'Invoice'} className="w-full max-h-[40vh] md:max-h-[65vh] object-contain" />}
          </section>}
        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {initialData?.notes && <p className="text-xs text-muted bg-canvas rounded-lg p-3 leading-relaxed">{initialData.notes}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* مسلسل (no) */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.colNo} ({t.subNo})
              </label>
              <input
                type="number"
                value={formData.no ?? nextSequenceNo}
                onChange={(e) => setFormData({ ...formData, no: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* التاريخ (date) */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.colDate} ({t.subDate})
              </label>
              <input
                type="date"
                value={formData.date ?? ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* اسم المورد (The seller's name) */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.colSeller} ({t.subSeller})
              </label>
              <input
                type="text"
                placeholder={t.sellerPlaceholder}
                value={formData.sellerName ?? ''}
                onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* الرقم الضريبي (tax number) */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.colTaxNo} ({t.subTaxNo})
              </label>
              <input
                type="text"
                placeholder={t.taxNoPlaceholder}
                value={formData.taxNumber ?? ''}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* رقم الفاتوره (invoice number) */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.colInvNo} ({t.subInvNo})
              </label>
              <input
                type="text"
                placeholder={t.invNoPlaceholder}
                value={formData.invoiceNumber ?? ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* العملة */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {t.currencyLabel}
              </label>
              <input
                type="text"
                placeholder="SAR / EGP / AED / USD"
                value={formData.currency ?? 'SAR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* البيانات (details) */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              {t.colDetails} ({t.subDetails})
            </label>
            <textarea
              rows={2}
              placeholder={t.detailsPlaceholder}
              value={formData.details ?? ''}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Financial Amounts with Quick Tax Buttons */}
          <div className="p-4 bg-surface border border-line rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">{t.taxCalcAuto}</span>
              <div className="flex items-center gap-1.5">
                {[15, 14, 5, 0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleRatePreset(rate)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-mono font-bold transition ${
                      formData.taxRatePercent === rate
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-canvas text-muted hover:text-ink'
                    }`}
                  >
                    %{rate}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* المبلغ قبل الضريبه */}
              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  {t.colBeforeTax} ({t.subBeforeTax})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(formData.amountBeforeTax) ? formData.amountBeforeTax : ''}
                  onChange={(e) => handleAmountBeforeChange(e.target.value === '' ? NaN : Number(e.target.value))}
                  className={`w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-amber-700 focus:outline-none focus:border-emerald-500 font-bold ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                  required
                />
              </div>

              {/* الضريبه */}
              <div>
                <label className="block text-[11px] font-semibold text-violet-700 mb-1">
                  {t.colTax} ({t.subTax})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(formData.tax) ? formData.tax : ''}
                  onChange={(e) => handleTaxChange(e.target.value === '' ? NaN : Number(e.target.value))}
                  className={`w-full px-3 py-2 bg-surface border border-line rounded-xl text-xs font-mono text-violet-700 focus:outline-none focus:border-emerald-500 font-bold ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                  required
                />
              </div>

              {/* المبلغ بعد الضريبه */}
              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                  {t.colLastAmount} ({t.subLastAmount})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(formData.lastAmount) ? formData.lastAmount : ''}
                  onChange={(e) =>
                    setFormData({ ...formData, lastAmount: e.target.value === '' ? NaN : Number(e.target.value) })
                  }
                  className={`w-full px-3 py-2 bg-surface border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-700 focus:outline-none focus:border-emerald-500 font-black ${
                    language === 'ar' ? 'text-left' : 'text-right'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-ink bg-canvas hover:bg-canvas transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-md shadow-emerald-950/40"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? t.saveChanges : t.save}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
