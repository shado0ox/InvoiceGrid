import type { InvoiceRow } from '../types';
import type { Translations, Language } from '../i18n/translations';
import { currencyGroups } from '../utils/session';
export function SummaryCards({ invoices, t, language }: { invoices: InvoiceRow[]; t: Translations; language: Language }) {
  const number = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <section className="bg-surface border border-line rounded-xl overflow-hidden" aria-label={t.totalInvoices}>
    <div className="px-5 py-3 border-b border-line text-sm flex justify-between"><strong>{t.totalInvoices}: <span className="font-mono">{invoices.length}</span></strong><span className="text-muted text-xs">{language === 'ar' ? 'الإجماليات منفصلة لكل عملة' : 'Totals separated by currency'}</span></div>
    {[...currencyGroups(invoices)].map(([currency, rows]) => <div key={currency} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border-b last:border-b-0 border-line">
      <div><p className="text-muted text-xs mb-2">{language === 'ar' ? 'العملة' : 'Currency'}</p><strong className="font-mono">{currency}</strong></div>
      {([[t.amountBeforeTax, 'amountBeforeTax'], [t.totalTax, 'tax'], [t.grandTotal, 'lastAmount']] as const).map(([label, key]) => <div key={key}><p className="text-muted text-xs mb-2">{label}</p><strong dir="ltr" className={`font-mono text-lg ${key === 'lastAmount' ? 'text-primary' : 'text-ink'}`}>{number(rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0))}</strong></div>)}
    </div>)}
  </section>;
}
