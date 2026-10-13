import React from 'react';
import { X, KeyRound, ExternalLink, ShieldCheck, CheckCircle2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { Translations, Language } from '../i18n/translations';

interface ApiKeyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  language: Language;
}

export const ApiKeyGuideModal: React.FC<ApiKeyGuideModalProps> = ({
  isOpen,
  onClose,
  t,
  language,
}) => {
  if (!isOpen) return null;

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.apiKeyGuideTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.apiKeyGuideSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Security & Architecture Badge */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-emerald-300 block text-xs">
                إدارة المفتاح عبر الخادم الآمن (Server-Side Architecture)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {t.apiKeySecurityNote}
              </p>
            </div>
          </div>

          {/* 4 Steps Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>خطوات إصدار مفتاحك الخاص مجاناً (4 خطوات بسيطة):</span>
            </h4>

            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-xs">{t.apiKeyStep1Title}</span>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <span>{t.apiKeyOpenPortal}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.apiKeyStep1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 hover:border-slate-700 transition">
              <span className="font-bold text-emerald-400 text-xs block">{t.apiKeyStep2Title}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.apiKeyStep2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 hover:border-slate-700 transition">
              <span className="font-bold text-emerald-400 text-xs block">{t.apiKeyStep3Title}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.apiKeyStep3Desc}</p>
              <div className="mt-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300/90 flex items-center justify-between">
                <span>AIzaSy********************************</span>
                <span className="text-[10px] text-slate-500 font-sans">مثال لصيغة المفتاح</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 hover:border-slate-700 transition">
              <span className="font-bold text-emerald-400 text-xs block">{t.apiKeyStep4Title}</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.apiKeyStep4Desc}</p>
            </div>
          </div>

          {/* Benefits Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white text-xs block">{t.apiKeyBenefitTitle}</span>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{t.apiKeyBenefit1}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{t.apiKeyBenefit2}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{t.apiKeyBenefit3}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-md transition active:scale-95"
          >
            <span>{t.apiKeyOpenPortal}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
