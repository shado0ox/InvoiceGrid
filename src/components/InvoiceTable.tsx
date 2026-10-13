import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Copy,
  FileText,
} from 'lucide-react';
import { needsReview } from '../utils/review';
import { InvoiceRow } from '../types';
import { exportInvoicesToExcel, exportInvoicesToCSV, copyInvoicesToClipboard } from '../utils/excelExport';
import { Translations, Language } from '../i18n/translations';

interface InvoiceTableProps {
  invoices: InvoiceRow[];
  onUpdateInvoice: (invoice: InvoiceRow) => void;
  onDeleteInvoice: (id: string) => void;
  onAddManualInvoice: () => void;
  onPreviewInvoice: (invoice: InvoiceRow) => void;
  t: Translations;
  language: Language;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddManualInvoice,
  onPreviewInvoice,
  t,
  language,
}) => {
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const currencies = [...new Set(invoices.map(row => (row.currency || 'UNKNOWN').toUpperCase()))];
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InvoiceRow>>({});
  const [copiedAlert, setCopiedAlert] = useState(false);

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter((inv) => {
    if (currencyFilter !== 'ALL' && (inv.currency || 'UNKNOWN').toUpperCase() !== currencyFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      inv.sellerName?.toLowerCase().includes(q) ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.taxNumber?.toLowerCase().includes(q) ||
      inv.details?.toLowerCase().includes(q) ||
      inv.date?.toLowerCase().includes(q)
    );
  });

  const multipleCurrencies = new Set(filteredInvoices.map(row => (row.currency || 'UNKNOWN').toUpperCase())).size > 1;
  // Calculate totals for filtered items
  const totalBeforeTax = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.amountBeforeTax) || 0), 0);
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0);
  const totalLastAmount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.lastAmount) || 0), 0);

  const startInlineEdit = (inv: InvoiceRow) => {
    setEditingId(inv.id);
    setEditFormData({ ...inv });
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveInlineEdit = () => {
    if (!editingId) return;
    const existing = invoices.find((i) => i.id === editingId);
    if (!existing) return;

    const amountBefore = Number(editFormData.amountBeforeTax);
    const taxVal = Number(editFormData.tax);
    const lastAmt =
      editFormData.lastAmount !== undefined
        ? Number(editFormData.lastAmount)
        : Number((amountBefore + taxVal).toFixed(2));

    const updated: InvoiceRow = {
      ...existing,
      ...editFormData,
      amountBeforeTax: amountBefore,
      tax: taxVal,
      lastAmount: lastAmt,
    };

    onUpdateInvoice(updated);
    setEditingId(null);
    setEditFormData({});
  };

  const handleCopyClipboard = async () => {
    const success = await copyInvoicesToClipboard(filteredInvoices);
    if (success) {
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2500);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">
      {/* Top Bar with Search & Export Actions */}
      <div className="p-4 sm:p-5 border-b border-line bg-surface flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 text-muted absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full py-2 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition ${
              language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute top-1/2 -translate-y-1/2 text-muted hover:text-ink ${
                language === 'ar' ? 'left-3' : 'right-3'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {currencies.length > 1 && <select aria-label={language === 'ar' ? 'فلتر العملة' : 'Currency filter'} className="bg-surface border border-line rounded-lg px-3 py-2 text-xs" value={currencyFilter} onChange={event => setCurrencyFilter(event.target.value)}><option value="ALL">{language === 'ar' ? 'كل العملات — Excel بورقة لكل عملة' : 'All currencies — one Excel sheet per currency'}</option>{currencies.map(currency => <option key={currency}>{currency}</option>)}</select>}
        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddManualInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRow}</span>
          </button>

          {invoices.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopyClipboard}
                disabled={!filteredInvoices.length || multipleCurrencies}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink bg-canvas hover:bg-canvas hover:text-ink border border-line transition active:scale-95"
                title={multipleCurrencies ? (language === 'ar' ? 'اختر عملة واحدة للنسخ؛ استخدم Excel لكل العملات.' : 'Select one currency to copy; use Excel for all currencies.') : t.copyExcel}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedAlert ? t.copied : t.copyExcel}</span>
              </button>

              <button
                type="button"
                onClick={() => exportInvoicesToCSV(filteredInvoices)}
                disabled={!filteredInvoices.length || multipleCurrencies}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-ink bg-canvas hover:bg-canvas hover:text-ink border border-line transition active:scale-95"
                title={multipleCurrencies ? (language === 'ar' ? 'اختر عملة واحدة لتصدير CSV.' : 'Select one currency for CSV export.') : t.exportCsv}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.exportCsv}</span>
              </button>

              <button
                type="button"
                onClick={() => exportInvoicesToExcel(filteredInvoices)}
                disabled={!filteredInvoices.length}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:opacity-90 border border-emerald-400/40 shadow-md shadow-emerald-950/40 transition active:scale-95"
                title={t.downloadExcel}
              >
                <Download className="w-4 h-4" />
                <span>{t.exportXlsx}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {invoices.length > 0 && <p className="px-5 py-3 text-xs text-muted border-b border-line">{language === 'ar' ? `${filteredInvoices.length} نتيجة ظاهرة · ${filteredInvoices.filter(needsReview).length} تحتاج استكمال حقول أو مراجعة الإجمالي. راجع جميع النتائج مع الأصل قبل التصدير.` : `${filteredInvoices.length} visible results · ${filteredInvoices.filter(needsReview).length} have missing fields or inconsistent totals. Check every result against its original before export.`}</p>}
      {/* Empty State */}
      {invoices.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-canvas border border-line flex items-center justify-center mx-auto mb-4 text-muted">
            <FileSpreadsheet className="w-8 h-8 text-emerald-700/60" />
          </div>
          <h3 className="text-base font-bold text-ink mb-1">{t.emptyTableTitle}</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto mb-5">
            {t.emptyTableDesc}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onAddManualInvoice}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-ink bg-canvas hover:bg-canvas border border-line transition"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>{t.addInvoiceManual}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Excel Table Grid - Replicating the attached image design exactly */
        <div className="overflow-auto max-h-[65vh]">
          <table className={`w-full border-collapse text-xs sm:text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {/* Header: Row 1 Arabic, Row 2 English - Matching the attachment */}
            <thead className="sticky top-0 z-10 bg-surface">
              {/* Row 1: Arabic Titles with Excel-like header styling */}
              <tr className="bg-canvas text-ink font-bold border-b border-line select-none">
                <th className="px-3 py-3 w-16 text-center border-l border-line">
                  <div className="flex items-center justify-center gap-1">
                    <span>{t.colNo}</span>
                  </div>
                </th>
                <th className="px-3 py-3 w-28 border-l border-line">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colDate}</span>
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[180px] border-l border-line">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colSeller}</span>
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[140px] border-l border-line">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colTaxNo}</span>
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[130px] border-l border-line">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colInvNo}</span>
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[200px] border-l border-line">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colDetails}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[130px] border-l border-line ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colBeforeTax}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[110px] border-l border-line ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colTax}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[130px] border-l border-line ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colLastAmount}</span>
                  </div>
                </th>
                <th className="px-3 py-3 w-24 text-center no-print">{t.actions}</th>
              </tr>

              {/* Row 2: English Subheaders exactly as in image attachment */}
              <tr className="bg-surface text-muted font-mono text-[11px] border-b border-line select-none">
                <th className="px-3 py-1.5 text-center border-l border-line font-medium">{t.subNo}</th>
                <th className="px-3 py-1.5 border-l border-line font-medium">{t.subDate}</th>
                <th className="px-4 py-1.5 border-l border-line font-medium">{t.subSeller}</th>
                <th className="px-3 py-1.5 border-l border-line font-medium">{t.subTaxNo}</th>
                <th className="px-3 py-1.5 border-l border-line font-medium">{t.subInvNo}</th>
                <th className="px-4 py-1.5 border-l border-line font-medium">{t.subDetails}</th>
                <th className={`px-3 py-1.5 border-l border-line font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subBeforeTax}</th>
                <th className={`px-3 py-1.5 border-l border-line font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subTax}</th>
                <th className={`px-3 py-1.5 border-l border-line font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subLastAmount}</th>
                <th className="px-3 py-1.5 text-center no-print font-medium">{language === 'ar' ? 'actions' : 'إجراءات'}</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInvoices.map((inv, idx) => {
                const isEditing = editingId === inv.id;

                if (isEditing) {
                  return (
                    <tr key={inv.id} className="bg-emerald-50 border-y border-emerald-500/40">
                      {/* No */}
                      <td className="px-3 py-2 text-center font-mono text-emerald-700 font-semibold border-l border-line">
                        {inv.no ?? idx + 1}
                      </td>

                      {/* Date */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="text"
                          value={editFormData.date ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Seller Name */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="text"
                          value={editFormData.sellerName ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, sellerName: e.target.value })}
                          className="w-full px-2 py-1 bg-surface border border-line rounded text-xs text-ink focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Tax Number */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="text"
                          value={editFormData.taxNumber ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, taxNumber: e.target.value })}
                          className="w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Invoice Number */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="text"
                          value={editFormData.invoiceNumber ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, invoiceNumber: e.target.value })}
                          className="w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-ink focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Details */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="text"
                          value={editFormData.details ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                          className="w-full px-2 py-1 bg-surface border border-line rounded text-xs text-ink focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Amount Before Tax */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(editFormData.amountBeforeTax) ? editFormData.amountBeforeTax : ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const currentTax = Number(editFormData.tax) || 0;
                            setEditFormData({
                              ...editFormData,
                              amountBeforeTax: val,
                              lastAmount: Number((val + currentTax).toFixed(2)),
                            });
                          }}
                          className={`w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-amber-700 focus:outline-none focus:border-emerald-500 ${
                            language === 'ar' ? 'text-left' : 'text-right'
                          }`}
                        />
                      </td>

                      {/* Tax */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(editFormData.tax) ? editFormData.tax : ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const amountBefore = Number(editFormData.amountBeforeTax);
                            setEditFormData({
                              ...editFormData,
                              tax: val,
                              lastAmount: Number((amountBefore + val).toFixed(2)),
                            });
                          }}
                          className={`w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-violet-700 focus:outline-none focus:border-emerald-500 ${
                            language === 'ar' ? 'text-left' : 'text-right'
                          }`}
                        />
                      </td>

                      {/* Last Amount */}
                      <td className="px-2 py-2 border-l border-line">
                        <input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(editFormData.lastAmount) ? editFormData.lastAmount : ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, lastAmount: parseFloat(e.target.value) || 0 })
                          }
                          className={`w-full px-2 py-1 bg-surface border border-line rounded text-xs font-mono text-emerald-700 focus:outline-none focus:border-emerald-500 font-bold ${
                            language === 'ar' ? 'text-left' : 'text-right'
                          }`}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={saveInlineEdit}
                            className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            title={t.saveChanges}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelInlineEdit}
                            className="p-1 rounded bg-canvas text-muted hover:text-ink transition"
                            title={t.cancel}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={inv.id}
                    onDoubleClick={() => startInlineEdit(inv)}
                    className="hover:bg-canvas transition group"
                  >
                    {/* A: مسلسل (no) */}
                    <td className="px-3 py-3 text-center font-mono text-muted border-l border-line">
                      {inv.no ?? idx + 1}
                    </td>

                    {/* B: التاريخ (date) */}
                    <td className="px-3 py-3 font-mono text-ink border-l border-line whitespace-nowrap">
                      {inv.date || '—'}
                    </td>

                    {/* C: اسم المورد (The seller's name) */}
                    <td className="px-4 py-3 font-medium text-ink border-l border-line">
                      <div className="flex items-center gap-2">
                        <span>{inv.sellerName || (inv.extractionSource === 'MANUAL' ? (language === 'ar' ? 'لم تُقرأ — أكمل يدويًا' : 'Unreadable — complete manually') : '—')}</span>
                        {inv.extractionSource && <button type="button" onClick={() => onPreviewInvoice(inv)} className={`text-[10px] px-2 py-1 rounded whitespace-nowrap ${inv.extractionSource === 'MANUAL' && needsReview(inv) ? 'bg-amber-50 text-amber-800' : 'bg-canvas text-muted'}`}>{inv.extractionSource === 'MANUAL' ? (language === 'ar' ? (needsReview(inv) ? 'إكمال يدوي' : 'إدخال يدوي') : (needsReview(inv) ? 'Complete manually' : 'Manual entry')) : inv.extractionSource === 'PDF_TEXT' ? (language === 'ar' ? 'نص PDF' : 'PDF text') : inv.extractionSource === 'GEMINI' ? 'Gemini' : 'QR'}{inv.filePageNumber ? ` · ${inv.filePageNumber}` : ''}</button>}
                        {inv.fileName && (
                          <span
                            className="text-[10px] text-muted bg-canvas px-1.5 py-0.5 rounded truncate max-w-[100px]"
                            title={inv.fileName}
                          >
                            {inv.fileName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* D: الرقم الضريبي (tax number) */}
                    <td className="px-3 py-3 font-mono text-ink border-l border-line whitespace-nowrap">
                      {inv.taxNumber ? (
                        <span className="tracking-wider">{inv.taxNumber}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* E: رقم الفاتوره (invoice number) */}
                    <td className="px-3 py-3 font-mono text-ink border-l border-line whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-canvas border border-line font-semibold text-ink">
                        {inv.invoiceNumber || '—'}
                      </span>
                    </td>

                    {/* F: البيانات (details) */}
                    <td className="px-4 py-3 text-ink border-l border-line max-w-xs truncate" title={inv.details}>
                      {inv.details || '—'}
                    </td>

                    {/* G: المبلغ قبل الضريبه (amount befor tax) */}
                    <td className={`px-3 py-3 font-mono text-amber-700/90 font-medium border-l border-line whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {Number.isFinite(inv.amountBeforeTax) ? inv.amountBeforeTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </td>

                    {/* H: الضريبه (tax) */}
                    <td className={`px-3 py-3 font-mono text-violet-700 font-medium border-l border-line whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {Number.isFinite(inv.tax) ? inv.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                    </td>

                    {/* I: المبلغ بعد الضريبه (last amount) */}
                    <td className={`px-3 py-3 font-mono text-emerald-700 font-bold border-l border-line whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {Number.isFinite(inv.lastAmount) ? inv.lastAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                      <span className="block text-[10px] text-muted font-normal">{inv.currency || 'UNKNOWN'}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        {inv.filePreviewUrl && (
                          <button
                            type="button"
                            onClick={() => onPreviewInvoice(inv)}
                            className="p-1.5 rounded-lg text-muted hover:text-emerald-700 hover:bg-canvas transition"
                            title={t.viewDocument}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => inv.extractionSource === 'MANUAL' && inv.filePreviewUrl ? onPreviewInvoice(inv) : startInlineEdit(inv)}
                          className="p-1.5 rounded-lg text-muted hover:text-amber-700 hover:bg-canvas transition"
                          title={t.editRow}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-muted hover:text-rose-700 hover:bg-canvas transition"
                          title={t.deleteRow}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Bottom Totals Footer Row */}
            {new Set(filteredInvoices.map(row => (row.currency || 'UNKNOWN').toUpperCase())).size <= 1 && filteredInvoices.some(row => Number.isFinite(row.lastAmount)) && <tfoot>
              <tr className="bg-surface font-bold border-t-2 border-line text-ink">
                <td colSpan={6} className={`px-4 py-3 border-l border-line ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700 font-extrabold text-sm sm:text-base">
                      {t.filteredTotal} ({filteredInvoices.length} {t.invoicesCountSuffix})
                    </span>
                    <span className="text-xs text-muted font-normal">
                      {t.filteredNote}
                    </span>
                  </div>
                </td>
                <td className={`px-3 py-3 font-mono text-amber-700 font-bold border-l border-line whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalBeforeTax.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className={`px-3 py-3 font-mono text-violet-700 font-bold border-l border-line whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalTax.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className={`px-3 py-3 font-mono text-emerald-700 font-black text-sm sm:text-base border-l border-line whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalLastAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>}
          </table>
        </div>
      )}
    </div>
  );
};
