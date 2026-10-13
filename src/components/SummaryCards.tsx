import React from 'react';
import { FileText, DollarSign, Percent, TrendingUp, Layers } from 'lucide-react';
import { InvoiceRow } from '../types';
import { Translations, Language } from '../i18n/translations';

interface SummaryCardsProps {
  invoices: InvoiceRow[];
  t: Translations;
  language: Language;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ invoices, t, language }) => {
  const count = invoices.length;
  const totalBeforeTax = invoices.reduce((sum, inv) => sum + (Number(inv.amountBeforeTax) || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0);
  const totalLastAmount = invoices.reduce((sum, inv) => sum + (Number(inv.lastAmount) || 0), 0);
  
  // Calculate effective tax percentage
  const effectiveTaxRate = totalBeforeTax > 0 ? (totalTax / totalBeforeTax) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Invoices Count */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">{t.totalInvoices}</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono tracking-tight">{count}</span>
          <span className="text-xs text-slate-500">{t.invoicesCountSuffix}</span>
        </div>
      </div>

      {/* Total Before Tax */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">{t.amountBeforeTax}</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-amber-200 font-mono tracking-tight">
            {formatCurrency(totalBeforeTax)}
          </span>
          <span className="text-xs text-slate-500 font-sans">{t.currencyUnit}</span>
        </div>
      </div>

      {/* Total Tax */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">{t.totalTax}</span>
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-violet-300 font-mono tracking-tight">
            {formatCurrency(totalTax)}
          </span>
          {count > 0 && totalBeforeTax > 0 && (
            <span className="text-xs text-violet-400/80 font-mono">
              ({effectiveTaxRate.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Grand Total (After Tax) */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900/90 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/50 transition shadow-lg shadow-emerald-950/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-400">{t.grandTotal}</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-300 font-mono tracking-tight">
            {formatCurrency(totalLastAmount)}
          </span>
          <span className="text-xs text-emerald-400/80 font-sans">{t.finalTotalSuffix}</span>
        </div>
      </div>
    </div>
  );
};
