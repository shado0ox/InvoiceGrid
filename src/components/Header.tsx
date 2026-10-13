import { Globe, Settings, FileText, Trash2, KeyRound } from 'lucide-react';
import { InvoiceGridLogo } from './InvoiceGridLogo';
import type { InvoiceRow } from '../types';
import type { Translations, Language } from '../i18n/translations';
interface HeaderProps {
  invoices: InvoiceRow[]; onLoadSamples: () => void; onClearAll: () => void;
  isProcessing: boolean; language: Language; onToggleLanguage: () => void;
  onOpenApiKeyGuide: () => void; t: Translations;
}
export function Header({ invoices, onLoadSamples, onClearAll, isProcessing, language, onToggleLanguage, onOpenApiKeyGuide, t }: HeaderProps) {
  return <header className="bg-surface border-b border-line sticky top-0 z-30 no-print">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><InvoiceGridLogo size="md" /><div>
        <h1 className="font-['Inter',sans-serif] text-lg font-bold" dir="ltr">Invoice<span className="text-primary">Grid</span></h1>
        <p className="text-muted text-[11px]">{language === 'ar' ? 'فواتير مرتبة. ملف جاهز.' : 'Organized invoices. Ready to export.'}</p>
      </div></div>
      <div className="flex items-center gap-3 text-xs">
        <button onClick={onToggleLanguage} className="flex gap-1.5 items-center py-2"><Globe size={15}/>{language === 'ar' ? 'English' : 'العربية'}</button>
        <details className="relative"><summary className="list-none flex gap-1.5 items-center rounded-lg border border-line px-3 py-2"><Settings size={15}/>{language === 'ar' ? 'خيارات' : 'Options'}</summary>
          <div onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.closest('details')?.removeAttribute('open'); }} className="absolute end-0 top-full mt-2 w-56 bg-surface border border-line rounded-xl shadow-lg p-2 space-y-1">
            <button disabled={isProcessing} onClick={onLoadSamples} className="w-full text-start flex gap-2 items-center p-3 hover:bg-canvas rounded-lg"><FileText size={15}/>{t.loadSamples}</button>
            <button onClick={onOpenApiKeyGuide} className="w-full text-start flex gap-2 items-center p-3 hover:bg-canvas rounded-lg"><KeyRound size={15}/>{t.apiKeyGuideBtn}</button>
            {!!invoices.length && <button disabled={isProcessing} onClick={onClearAll} className="w-full text-start flex gap-2 items-center p-3 hover:bg-canvas rounded-lg text-rose-700"><Trash2 size={15}/>{t.clearTable}</button>}
          </div>
        </details>
      </div>
    </div>
  </header>;
}
