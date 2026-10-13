import { useDialog } from '../utils/useDialog';
import { X, ExternalLink } from 'lucide-react';
import type { Translations, Language } from '../i18n/translations';
export function ApiKeyGuideModal({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; t: Translations; language: Language }) {
  const dialog = useDialog(isOpen, onClose);
  if (!isOpen) return null;
  const ar = language === 'ar';
  return <div className="fixed inset-0 z-50 bg-black/40 p-4 grid place-items-center">
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="api-guide-title" className="w-full max-w-lg bg-surface border border-line rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between gap-4 mb-5"><h2 id="api-guide-title" className="font-bold">{ar ? 'إعداد خدمة قراءة الفواتير' : 'Configure invoice extraction'}</h2><button onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}><X size={20}/></button></div>
      <ol className="list-decimal ps-5 space-y-3 text-sm leading-relaxed text-muted">
        <li>{ar ? 'أنشئ مفتاح Gemini من Google AI Studio.' : 'Create a Gemini key in Google AI Studio.'}</li>
        <li>{ar ? 'أضف GEMINI_API_KEY كـ Secret في إعدادات Cloudflare Worker، وليس في المتصفح.' : 'Add GEMINI_API_KEY as a Secret in Cloudflare Worker settings, never in the browser.'}</li>
        <li>{ar ? 'اضبط GEMINI_MODEL على نموذج متاح في حسابك يدعم المستندات.' : 'Set GEMINI_MODEL to an available document-capable model in your account.'}</li>
        <li>{ar ? 'جهّز Cloudflare Access لبريدك، وأضف ACCESS_TEAM_DOMAIN وACCESS_AUD في إعدادات Worker.' : 'Configure Cloudflare Access for your email and add ACCESS_TEAM_DOMAIN and ACCESS_AUD to Worker settings.'}</li>
      </ol>
      <p className="text-xs text-muted mt-5">{ar ? 'الحصص والتكلفة حسب حساب المزوّد والنموذج. البرنامج لا يعرض رصيد المزوّد الفعلي.' : 'Quotas and costs depend on your provider account and model. The app does not show your actual provider balance.'}</p>
      <a className="inline-flex items-center gap-2 text-primary text-sm font-bold mt-5" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLink size={15}/></a>
    </div>
  </div>;
}
