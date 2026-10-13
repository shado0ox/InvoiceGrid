import { useEffect, useState } from 'react';
import { useDialog } from '../utils/useDialog';
import { X, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { Translations, Language } from '../i18n/translations';
interface Props { isOpen: boolean; onClose: () => void; t: Translations; language: Language; apiKey: string; model: string; isProcessing: boolean; onSave: (key: string, model: string) => void; }
export function ApiKeyGuideModal({ isOpen, onClose, language, apiKey, model, isProcessing, onSave }: Props) {
  const dialog = useDialog(isOpen, onClose);
  const [keyDraft, setKeyDraft] = useState('');
  const [modelDraft, setModelDraft] = useState(model);
  const [visible, setVisible] = useState(false);
  const [consent, setConsent] = useState(false);
  useEffect(() => { if (isOpen) { setKeyDraft(apiKey); setModelDraft(model); setConsent(!!apiKey); setVisible(false); } else setKeyDraft(''); }, [isOpen, apiKey, model]);
  if (!isOpen) return null;
  const ar = language === 'ar';
  return <div className="fixed inset-0 z-50 bg-black/40 p-4 grid place-items-center">
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="api-guide-title" className="w-full max-w-lg max-h-[90vh] overflow-auto bg-surface border border-line rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between gap-4 mb-5"><h2 id="api-guide-title" className="font-bold">{ar ? 'مفتاح Gemini الخاص بك' : 'Your Gemini key'}</h2><button onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}><X size={20}/></button></div>
      <p className="text-sm text-muted leading-relaxed">{ar ? 'أنشئ مفتاحك من Google AI Studio ثم أدخله هنا. المفتاح في ذاكرة الصفحة فقط ويُمسح عند تحديثها أو إغلاقها. طلبات القراءة تذهب مباشرة من متصفحك إلى Google؛ لا تُرسل المفاتيح والفواتير إلى سيرفر الموقع.' : 'Create a key in Google AI Studio and enter it here. It stays in page memory and clears on reload or closing. Extraction requests go directly from your browser to Google; keys and invoices are not sent to this website’s server.'}</p>
      <a className="inline-flex items-center gap-2 text-primary text-sm font-bold my-4" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio <ExternalLink size={15}/></a>
      <form onSubmit={event => { event.preventDefault(); onSave(keyDraft.trim(), modelDraft.trim()); }} className="space-y-4">
        <div><label htmlFor="personal-api-key" className="block text-xs font-bold mb-2">Gemini API key</label><div className="flex gap-2"><input id="personal-api-key" type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} dir="ltr" value={keyDraft} onChange={event => setKeyDraft(event.target.value)} required maxLength={256} disabled={isProcessing} className="min-w-0 flex-1 border border-line rounded-lg px-3 py-2 font-mono text-sm"/><button type="button" onClick={() => setVisible(!visible)} aria-label={ar ? (visible ? 'إخفاء المفتاح' : 'إظهار المفتاح') : (visible ? 'Hide key' : 'Show key')}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
        <div><label htmlFor="gemini-model" className="block text-xs font-bold mb-2">{ar ? 'اسم النموذج المتاح في حسابك' : 'Model available in your account'}</label><input id="gemini-model" value={modelDraft} onChange={event => setModelDraft(event.target.value)} required pattern="[a-zA-Z0-9._]+(?:-[a-zA-Z0-9._]+)*" maxLength={100} disabled={isProcessing} dir="ltr" className="w-full border border-line rounded-lg px-3 py-2 font-mono text-sm"/></div>
        <p className="text-xs text-muted leading-relaxed">{ar ? 'الحصص والتكلفة تخص حسابك ونموذجك، وتُطبق سياسة Google على المستندات. استخدم مفتاحًا مخصصًا لهذه الأداة، ولا تشاركه أو تستخدمه على جهاز مشترك.' : 'Quotas and charges belong to your account and model. Google’s policies apply to submitted documents. Use a dedicated key and do not share it or use it on a shared device.'}</p>
        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={isProcessing}/><span>{ar ? 'أوافق على إرسال المستندات إلى Google باستخدام مفتاحي، وعلى تحمّل استهلاك حسابي.' : 'I agree to send documents to Google with my key and accept usage on my account.'}</span></label>
        <button disabled={isProcessing || !keyDraft.trim() || !modelDraft.trim() || !consent} className="w-full bg-primary text-white py-3 rounded-lg text-sm font-bold">{ar ? 'استخدام المفتاح لهذه الجلسة' : 'Use key for this session'}</button>
      </form>
    </div>
  </div>;
}
