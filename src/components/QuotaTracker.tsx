import React, { useState } from 'react';
import { Activity, Zap, Info, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { QuotaState } from '../utils/quotaManager';
import { Translations, Language } from '../i18n/translations';

interface QuotaTrackerProps {
  quota: QuotaState;
  t: Translations;
  language: Language;
}

export const QuotaTracker: React.FC<QuotaTrackerProps> = ({ quota, t, language }) => {
  const [showInfo, setShowInfo] = useState(false);

  const dailyPercent = Math.min(100, (quota.dailyUsed / quota.dailyLimit) * 100);
  const minutePercent = Math.min(100, (quota.minuteUsed / quota.minuteLimit) * 100);

  const isRateLimited = quota.cooldownSeconds > 0;
  const isBusy = quota.minuteUsed >= 10;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 mb-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left / Title & Status */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              isRateLimited
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : isBusy
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Activity className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                {t.freeQuotaTitle}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                  isRateLimited
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : isBusy
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isRateLimited ? (
                  <>
                    <Clock className="w-2.5 h-2.5 animate-spin" />
                    {t.quotaRateLimited} ({quota.cooldownSeconds}s)
                  </>
                ) : isBusy ? (
                  <>
                    <Zap className="w-2.5 h-2.5" />
                    {t.quotaBusy}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {t.quotaGood}
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t.batchSmartPacing}
            </p>
          </div>
        </div>

        {/* Meters (Daily & Minute) */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Daily Usage */}
          <div className="min-w-[130px]">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">{t.dailyUsage}</span>
              <span className="text-emerald-400 font-bold">
                {quota.dailyUsed} / {quota.dailyLimit}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dailyPercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(2, dailyPercent)}%` }}
              />
            </div>
          </div>

          {/* Minute Rate */}
          <div className="min-w-[110px]">
            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">{t.minuteSpeed}</span>
              <span className="text-sky-400 font-bold">
                {quota.minuteUsed} / {quota.minuteLimit} {t.rpmStatus}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  minutePercent > 80 ? 'bg-amber-400' : 'bg-sky-400'
                }`}
                style={{ width: `${Math.max(2, minutePercent)}%` }}
              />
            </div>
          </div>

          {/* Info Modal Button */}
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="معلومات حول حد الاستيعاب وسياسة التقسيم الذكي"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Info Dropdown */}
      {showInfo && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 animate-in fade-in duration-200">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>كيف يتعامل البرنامج مع الملفات الكبيرة (مثلاً أكثر من 200 فاتورة)؟</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              • عند رفع دفعات كبيرة (50 أو 100 أو 200+ فاتورة)، يقوم النظام تلقائياً بـ <strong className="text-slate-200">تقسيم العمل إلى دفعات ذكية متتالية</strong> بمعدل آمن لا يتجاوز 15 طلب/دقيقة.
              <br />
              • في حال اقتراب حد الدقيقة، يتم تفعيل مؤقت انتظار تلقائي ذكي يستأنف المعالجة ذاتياً دون أن تفقد أي ملف.
              <br />
              • يمكنك الاستمرار في تصفح وتصدير الفواتير التي تم استخراجها فوراً في الجدول أثناء استمرار عمل بقية الدفعة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
