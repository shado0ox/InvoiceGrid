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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InvoiceRow>>({});
  const [copiedAlert, setCopiedAlert] = useState(false);

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter((inv) => {
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

    const amountBefore = Number(editFormData.amountBeforeTax) || 0;
    const taxVal = Number(editFormData.tax) || 0;
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

  const handleCopyClipboard = () => {
    const success = copyInvoicesToClipboard(filteredInvoices);
    if (success) {
      setCopiedAlert(true);
      setTimeout(() => setCopiedAlert(false), 2500);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Bar with Search & Export Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${language === 'ar' ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition ${
              language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 ${
                language === 'ar' ? 'left-3' : 'right-3'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddManualInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRow}</span>
          </button>

          {invoices.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 transition active:scale-95"
                title={t.copyExcel}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedAlert ? t.copied : t.copyExcel}</span>
              </button>

              <button
                type="button"
                onClick={() => exportInvoicesToCSV(filteredInvoices)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white border border-slate-700 transition active:scale-95"
                title={t.exportCsv}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.exportCsv}</span>
              </button>

              <button
                type="button"
                onClick={() => exportInvoicesToExcel(filteredInvoices)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 shadow-md shadow-emerald-950/40 transition active:scale-95"
                title={t.downloadExcel}
              >
                <Download className="w-4 h-4" />
                <span>{t.exportXlsx}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {invoices.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400/60" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">{t.emptyTableTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
            {t.emptyTableDesc}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onAddManualInvoice}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{t.addInvoiceManual}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Excel Table Grid - Replicating the attached image design exactly */
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse text-xs sm:text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {/* Header: Row 1 Arabic, Row 2 English - Matching the attachment */}
            <thead>
              {/* Row 1: Arabic Titles with Excel-like header styling */}
              <tr className="bg-black text-white font-bold border-b border-slate-800 select-none">
                <th className="px-3 py-3 w-16 text-center border-l border-slate-800/80">
                  <div className="flex items-center justify-center gap-1">
                    <span>{t.colNo}</span>
                  </div>
                </th>
                <th className="px-3 py-3 w-28 border-l border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colDate}</span>
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[180px] border-l border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colSeller}</span>
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[140px] border-l border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colTaxNo}</span>
                  </div>
                </th>
                <th className="px-3 py-3 min-w-[130px] border-l border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colInvNo}</span>
                  </div>
                </th>
                <th className="px-4 py-3 min-w-[200px] border-l border-slate-800/80">
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colDetails}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[130px] border-l border-slate-800/80 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colBeforeTax}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[110px] border-l border-slate-800/80 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colTax}</span>
                  </div>
                </th>
                <th className={`px-3 py-3 min-w-[130px] border-l border-slate-800/80 ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span>{t.colLastAmount}</span>
                  </div>
                </th>
                <th className="px-3 py-3 w-24 text-center no-print">{t.actions}</th>
              </tr>

              {/* Row 2: English Subheaders exactly as in image attachment */}
              <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 select-none">
                <th className="px-3 py-1.5 text-center border-l border-slate-800/60 font-medium">{t.subNo}</th>
                <th className="px-3 py-1.5 border-l border-slate-800/60 font-medium">{t.subDate}</th>
                <th className="px-4 py-1.5 border-l border-slate-800/60 font-medium">{t.subSeller}</th>
                <th className="px-3 py-1.5 border-l border-slate-800/60 font-medium">{t.subTaxNo}</th>
                <th className="px-3 py-1.5 border-l border-slate-800/60 font-medium">{t.subInvNo}</th>
                <th className="px-4 py-1.5 border-l border-slate-800/60 font-medium">{t.subDetails}</th>
                <th className={`px-3 py-1.5 border-l border-slate-800/60 font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subBeforeTax}</th>
                <th className={`px-3 py-1.5 border-l border-slate-800/60 font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subTax}</th>
                <th className={`px-3 py-1.5 border-l border-slate-800/60 font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>{t.subLastAmount}</th>
                <th className="px-3 py-1.5 text-center no-print font-medium">{language === 'ar' ? 'actions' : 'إجراءات'}</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredInvoices.map((inv, idx) => {
                const isEditing = editingId === inv.id;

                if (isEditing) {
                  return (
                    <tr key={inv.id} className="bg-emerald-950/30 border-y border-emerald-500/40">
                      {/* No */}
                      <td className="px-3 py-2 text-center font-mono text-emerald-400 font-semibold border-l border-slate-800">
                        {inv.no ?? idx + 1}
                      </td>

                      {/* Date */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="text"
                          value={editFormData.date ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Seller Name */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="text"
                          value={editFormData.sellerName ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, sellerName: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Tax Number */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="text"
                          value={editFormData.taxNumber ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, taxNumber: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Invoice Number */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="text"
                          value={editFormData.invoiceNumber ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, invoiceNumber: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Details */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="text"
                          value={editFormData.details ?? ''}
                          onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Amount Before Tax */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.amountBeforeTax ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const currentTax = Number(editFormData.tax) || 0;
                            setEditFormData({
                              ...editFormData,
                              amountBeforeTax: val,
                              lastAmount: Number((val + currentTax).toFixed(2)),
                            });
                          }}
                          className={`w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-500 ${
                            language === 'ar' ? 'text-left' : 'text-right'
                          }`}
                        />
                      </td>

                      {/* Tax */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.tax ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const amountBefore = Number(editFormData.amountBeforeTax) || 0;
                            setEditFormData({
                              ...editFormData,
                              tax: val,
                              lastAmount: Number((amountBefore + val).toFixed(2)),
                            });
                          }}
                          className={`w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-violet-300 focus:outline-none focus:border-emerald-500 ${
                            language === 'ar' ? 'text-left' : 'text-right'
                          }`}
                        />
                      </td>

                      {/* Last Amount */}
                      <td className="px-2 py-2 border-l border-slate-800">
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData.lastAmount ?? 0}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, lastAmount: parseFloat(e.target.value) || 0 })
                          }
                          className={`w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 font-bold ${
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
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
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
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* A: مسلسل (no) */}
                    <td className="px-3 py-3 text-center font-mono text-slate-400 border-l border-slate-800/60">
                      {inv.no ?? idx + 1}
                    </td>

                    {/* B: التاريخ (date) */}
                    <td className="px-3 py-3 font-mono text-slate-300 border-l border-slate-800/60 whitespace-nowrap">
                      {inv.date || '—'}
                    </td>

                    {/* C: اسم المورد (The seller's name) */}
                    <td className="px-4 py-3 font-medium text-white border-l border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span>{inv.sellerName || '—'}</span>
                        {inv.fileName && (
                          <span
                            className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[100px]"
                            title={inv.fileName}
                          >
                            {inv.fileName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* D: الرقم الضريبي (tax number) */}
                    <td className="px-3 py-3 font-mono text-slate-300 border-l border-slate-800/60 whitespace-nowrap">
                      {inv.taxNumber ? (
                        <span className="tracking-wider">{inv.taxNumber}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* E: رقم الفاتوره (invoice number) */}
                    <td className="px-3 py-3 font-mono text-slate-200 border-l border-slate-800/60 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-200">
                        {inv.invoiceNumber || '—'}
                      </span>
                    </td>

                    {/* F: البيانات (details) */}
                    <td className="px-4 py-3 text-slate-300 border-l border-slate-800/60 max-w-xs truncate" title={inv.details}>
                      {inv.details || '—'}
                    </td>

                    {/* G: المبلغ قبل الضريبه (amount befor tax) */}
                    <td className={`px-3 py-3 font-mono text-amber-200/90 font-medium border-l border-slate-800/60 whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {(Number(inv.amountBeforeTax) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* H: الضريبه (tax) */}
                    <td className={`px-3 py-3 font-mono text-violet-300 font-medium border-l border-slate-800/60 whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {(Number(inv.tax) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* I: المبلغ بعد الضريبه (last amount) */}
                    <td className={`px-3 py-3 font-mono text-emerald-300 font-bold border-l border-slate-800/60 whitespace-nowrap ${
                      language === 'ar' ? 'text-left' : 'text-right'
                    }`}>
                      {(Number(inv.lastAmount) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 text-center no-print whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        {inv.filePreviewUrl && (
                          <button
                            type="button"
                            onClick={() => onPreviewInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                            title={t.viewDocument}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startInlineEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                          title={t.editRow}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
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
            <tfoot>
              <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
                <td colSpan={6} className={`px-4 py-3 border-l border-slate-800 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-extrabold text-sm sm:text-base">
                      {t.filteredTotal} ({filteredInvoices.length} {t.invoicesCountSuffix})
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      {t.filteredNote}
                    </span>
                  </div>
                </td>
                <td className={`px-3 py-3 font-mono text-amber-300 font-bold border-l border-slate-800 whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalBeforeTax.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className={`px-3 py-3 font-mono text-violet-300 font-bold border-l border-slate-800 whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalTax.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className={`px-3 py-3 font-mono text-emerald-400 font-black text-sm sm:text-base border-l border-slate-800 whitespace-nowrap ${
                  language === 'ar' ? 'text-left' : 'text-right'
                }`}>
                  {totalLastAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="no-print"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
