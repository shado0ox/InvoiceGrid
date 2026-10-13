import { FileSpreadsheet, Sparkles, Trash2, FileText, Download, Globe, KeyRound } from 'lucide-react';
import { InvoiceGridLogo } from './InvoiceGridLogo';
import { InvoiceRow } from '../types';
import { exportInvoicesToExcel } from '../utils/excelExport';
import { Translations, Language } from '../i18n/translations';

interface HeaderProps {
  invoices: InvoiceRow[];
  onLoadSamples: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
  language: Language;
  onToggleLanguage: () => void;
  onOpenApiKeyGuide: () => void;
  t: Translations;
}

export const Header: React.FC<HeaderProps> = ({
  invoices,
  onLoadSamples,
  onClearAll,
  isProcessing,
  language,
  onToggleLanguage,
  onOpenApiKeyGuide,
  t,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <InvoiceGridLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 font-['Inter',sans-serif]">
                  <span>Invoice<span className="text-emerald-400">Grid</span></span>
                  <span className="text-sm font-bold text-slate-300 font-['Cairo',sans-serif]">إنفويس جريد</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {t.aiBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Quick Actions & Language Switcher */}
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {/* API Key Guide Button */}
            <button
              type="button"
              onClick={onOpenApiKeyGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm active:scale-95"
              title={t.apiKeyGuideBtn}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.apiKeyGuideBtn}</span>
            </button>

            {/* Language Switcher Button */}
            <button
              type="button"
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-750 hover:text-white border border-slate-700 transition shadow-sm active:scale-95 group"
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-slate-700 text-slate-300">
                {language === 'ar' ? 'EN' : 'AR'}
              </span>
            </button>

            {/* Load Samples */}
            <button
              type="button"
              onClick={onLoadSamples}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-750 hover:text-white border border-slate-700 transition shadow-sm active:scale-95 disabled:opacity-50"
              title={t.loadSamples}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.loadSamples}</span>
            </button>

            {invoices.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onClearAll}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-95 disabled:opacity-50"
                  title={t.clearTable}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearTable}</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportInvoicesToExcel(invoices)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadExcel}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
