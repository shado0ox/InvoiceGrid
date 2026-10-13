import type { QuotaState } from '../utils/quotaManager';
import type { Translations, Language } from '../i18n/translations';
export function QuotaTracker({ quota, language }: { quota: QuotaState; t: Translations; language: Language }) {
  return <div className="flex flex-wrap gap-4 bg-surface border border-line rounded-lg p-3 text-xs">
    <span>{language === 'ar' ? 'قراءات ناجحة اليوم:' : 'Successful extractions today:'} <strong className="font-mono">{quota.dailyUsed}</strong></span>
    <span>{language === 'ar' ? 'خلال آخر دقيقة:' : 'In the last minute:'} <strong className="font-mono">{quota.minuteUsed}</strong></span>
    {!!quota.cooldownSeconds && <span>{language === 'ar' ? 'انتظار:' : 'Waiting:'} <strong className="font-mono">{quota.cooldownSeconds}s</strong></span>}
  </div>;
}
