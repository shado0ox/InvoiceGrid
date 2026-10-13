import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { UploadZone } from './components/UploadZone';
import { InvoiceTable } from './components/InvoiceTable';
import { InvoiceModal } from './components/InvoiceModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { QuotaTracker } from './components/QuotaTracker';
import { BatchProgressOverlay } from './components/BatchProgressOverlay';
import { ApiKeyGuideModal } from './components/ApiKeyGuideModal';
import { InvoiceRow, FileQueueItem } from './types';
import { SAMPLE_INVOICES } from './data/sampleInvoices';
import { translations, Language } from './i18n/translations';
import { loadQuotaState, recordQuotaRequest, QuotaState } from './utils/quotaManager';
import { manualInvoice } from './utils/localInvoice';
import { rowFingerprint } from './utils/session';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('invoice_app_lang');
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });

  const t = translations[language];

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('invoice_app_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const exportedRows = useRef(new Map<string, string>());
  const [exportRevision, setExportRevision] = useState(0);
  const hasUnexportedRows = invoices.some(row => exportedRows.current.get(row.id) !== rowFingerprint(row));
  useEffect(() => {
    const onExport = (event: Event) => {
      for (const row of (event as CustomEvent<InvoiceRow[]>).detail) exportedRows.current.set(row.id, rowFingerprint(row));
      setExportRevision(value => value + 1);
    };
    window.addEventListener('invoicegrid:export', onExport);
    return () => window.removeEventListener('invoicegrid:export', onExport);
  }, []);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localProgress, setLocalProgress] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRow | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRow | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [isApiKeyGuideOpen, setIsApiKeyGuideOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasUnexportedRows || isProcessing) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnexportedRows, isProcessing, exportRevision]);
  const previewUrls = useRef(new Set<string>());
  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
    requestController.current?.abort();
  }, []);
  const batchBusy = useRef(false);
  const requestController = useRef<AbortController | null>(null);

  // Quota and batching state
  const [quota, setQuota] = useState<QuotaState>(loadQuotaState());

  // Batch progress overlay state for large jobs (e.g. 200+ invoices)
  const [batchActive, setBatchActive] = useState(false);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  const [batchTotalFiles, setBatchTotalFiles] = useState(0);
  const [batchExtractedCount, setBatchExtractedCount] = useState(0);
  const [batchCurrentChunk, setBatchCurrentChunk] = useState(1);
  const [batchTotalChunks, setBatchTotalChunks] = useState(1);
  const [batchEstSeconds, setBatchEstSeconds] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Control refs for batch loop
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  // Periodic quota refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setQuota(loadQuotaState());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleLoadSamples = () => {
    if (invoices.length && !window.confirm(language === 'ar' ? 'استبدال النتائج الحالية بالفواتير التجريبية؟' : 'Replace current results with sample invoices?')) return;
    setInvoices(SAMPLE_INVOICES);
    showToast('success', t.toastSamplesLoaded);
  };

  const handleClearAll = () => {
    if (window.confirm(t.clearConfirm)) {
      previewUrls.current.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current.clear();
      setInvoices([]);
      setFileQueue([]);
      showToast('info', t.toastCleared);
    }
  };

  // Helper sleep function
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Local QR -> searchable PDF text -> Gemini per unreadable page -> manual row.
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (!files.length || batchBusy.current) return;
    batchBusy.current = true;
    const credentials = { apiKey: apiKey.trim(), model: model.trim() };
    const queue: FileQueueItem[] = files.map(file => ({ id: crypto.randomUUID(), file, name: file.name, size: file.size, type: file.type, previewUrl: URL.createObjectURL(file), status: 'pending' }));
    queue.forEach(item => previewUrls.current.add(item.previewUrl));
    setFileQueue(previous => [...previous, ...queue]);
    setIsProcessing(true); setBatchActive(true); setBatchTotalFiles(queue.length);
    setBatchTotalChunks(Math.ceil(queue.length / 10)); setBatchCurrentIndex(0); setBatchExtractedCount(0);
    isCancelledRef.current = false; isPausedRef.current = false; setIsPaused(false);
    const controller = new AbortController(); requestController.current = controller;
    let count = 0, manualCount = 0, aiUnavailable = '', aiRequests = 0;
    const append = (rows: Partial<InvoiceRow>[], item: FileQueueItem, pageNumber?: number) => {
      const records: InvoiceRow[] = rows.map(row => ({
        id: crypto.randomUUID(), no: 0, date: row.date || '', sellerName: row.sellerName || '', taxNumber: row.taxNumber || '', invoiceNumber: row.invoiceNumber || '', details: row.details || '',
        amountBeforeTax: typeof row.amountBeforeTax === 'number' ? row.amountBeforeTax : NaN,
        tax: typeof row.tax === 'number' ? row.tax : NaN,
        lastAmount: typeof row.lastAmount === 'number' ? row.lastAmount : NaN,
        currency: row.currency || 'UNKNOWN', taxRatePercent: row.taxRatePercent ?? (Number.isFinite(row.amountBeforeTax) && row.amountBeforeTax! !== 0 && Number.isFinite(row.tax) ? row.tax! / row.amountBeforeTax! * 100 : 0),
        notes: row.notes, extractionSource: row.extractionSource, fileName: item.name, filePreviewUrl: item.previewUrl, fileMimeType: item.type, filePageNumber: pageNumber,
      }));
      setInvoices(previous => [...previous, ...records.map((row, index) => ({ ...row, no: previous.length + index + 1 }))]);
      count += records.length; manualCount += records.filter(row => row.extractionSource === 'MANUAL').length;
      setBatchExtractedCount(count);
    };
    const paused = async () => { while (isPausedRef.current && !controller.signal.aborted) await sleep(200); controller.signal.throwIfAborted(); };
    try {
      const { readLocalPages } = await import('./utils/readLocalPages');
      for (let index = 0; index < queue.length; index++) {
        await paused();
        const item = queue[index]; let pageNumber = 1, rowsAdded = 0, failure = '';
        setBatchCurrentIndex(index + 1); setBatchCurrentChunk(Math.floor(index / 10) + 1); setBatchEstSeconds(0);
        setFileQueue(previous => previous.map(row => row.id === item.id ? { ...row, status: 'processing' } : row));
        try {
          if (item.size > 6 * 1024 * 1024 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(item.type)) throw new Error(language === 'ar' ? 'نوع الملف غير مدعوم أو حجمه أكبر من 6 MB؛ أكمله يدويًا.' : 'Unsupported file or larger than 6 MB; enter manually.');
          for await (const page of readLocalPages(item.file, controller.signal, (number, total) => {
            pageNumber = number;
            setLocalProgress(language === 'ar' ? `${item.name} · صفحة ${number}/${total} · QR ثم قراءة النص` : `${item.name} · page ${number}/${total} · QR then text`);
          })) {
            await paused(); pageNumber = page.pageNumber;
            if (page.rows.length) { append(page.rows, item, pageNumber); rowsAdded += page.rows.length; continue; }
            let extracted: Partial<InvoiceRow>[] = [];
            let reason = aiUnavailable || (credentials.apiKey ? '' : (language === 'ar' ? 'لم يُضف مفتاح Gemini، والقراءة المحلية غير مكتملة.' : 'No Gemini key; local reading is incomplete.'));
            if (credentials.apiKey && !aiUnavailable) {
              const { extractInvoice } = await import('./utils/extractInvoices');
              for (let attempt = 1; attempt <= 3; attempt++) {
                await paused();
                setLocalProgress(language === 'ar' ? `${item.name} · صفحة ${pageNumber} · محاولة Gemini ${attempt}/3` : `${item.name} · page ${pageNumber} · Gemini attempt ${attempt}/3`);
                try {
                  // Pacing applies only to provider calls; QR/text reads have no artificial delay.
                  if (aiRequests > 0 && attempt === 1) { await sleep(4000); await paused(); }
                  aiRequests++;
                  const response = await extractInvoice({ fileBase64: page.imageBase64, mimeType: 'image/jpeg', fileName: item.name }, credentials, controller.signal);
                  const data = await response.json(); controller.signal.throwIfAborted();
                  if (response.ok && data.success && Array.isArray(data.invoices) && data.invoices.length) {
                    extracted = data.invoices.map((row: any) => [row.amountBeforeTax, row.tax, row.lastAmount].every(value => typeof value === 'number' && Number.isFinite(value)) ? ({ ...row, extractionSource: 'GEMINI' }) : manualInvoice({ ...page.partial, ...row, amountBeforeTax: row.amountBeforeTax ?? NaN, tax: row.tax ?? NaN, lastAmount: row.lastAmount ?? NaN }, language === 'ar' ? 'قراءة Gemini جزئية؛ أكمل القيم غير المقروءة.' : 'Partial Gemini result; complete unreadable values.')); setQuota(recordQuotaRequest()); break;
                  }
                  reason = data.error || (language === 'ar' ? 'لا توجد بيانات قابلة للقراءة.' : 'No readable invoice data.');
                  if (data.credentialError || response.status === 503) { aiUnavailable = reason; break; }
                  if (response.status === 429) {
                    if (attempt === 3) { aiUnavailable = reason; break; }
                    setIsCooldown(true);
                    for (let seconds = Math.min(300, Math.max(1, Number(data.retryAfterSeconds) || 60)); seconds > 0; seconds--) {
                      controller.signal.throwIfAborted(); setCooldownSeconds(seconds); await sleep(1000);
                    }
                    setIsCooldown(false); setCooldownSeconds(0); continue;
                  }
                  if (data.retryable === false) break;
                } catch (error: any) { controller.signal.throwIfAborted(); reason = error.message || 'Read error'; }
                if (attempt < 3) { await sleep(1500); await paused(); }
              }
            }
            if (extracted.length) { append(extracted, item, pageNumber); rowsAdded += extracted.length; if (extracted.some(row => row.extractionSource === 'MANUAL')) failure = language === 'ar' ? 'قراءة جزئية؛ أكمل البيانات يدويًا.' : 'Partial reading; complete fields manually.'; }
            else { append([manualInvoice(page.partial, reason)], item, pageNumber); rowsAdded++; failure = reason || (language === 'ar' ? 'أكمل البيانات يدويًا.' : 'Complete fields manually.'); }
          }
          if (!rowsAdded) throw new Error(language === 'ar' ? 'لم توجد صفحات قابلة للقراءة.' : 'No readable pages.');
        } catch (error: any) {
          if (controller.signal.aborted) throw error;
          failure = error.message || (language === 'ar' ? 'تعذرت قراءة الملف.' : 'Could not read file.');
          append([manualInvoice({}, failure)], item, item.type === 'application/pdf' ? pageNumber : undefined); rowsAdded++;
        }
        setFileQueue(previous => previous.map(row => row.id === item.id ? { ...row, status: failure ? 'error' : 'done', extractedCount: rowsAdded, errorMessage: failure ? `${failure} — ${language === 'ar' ? 'أُضيف صف للمراجعة اليدوية' : 'Manual review row added'}` : undefined } : row));
      }
    } catch (error: any) {
      if (!controller.signal.aborted) showToast('error', error.message || 'Read error');
      const ids = new Set(queue.map(item => item.id));
      setFileQueue(previous => previous.map(row => ids.has(row.id) && (row.status === 'pending' || row.status === 'processing') ? { ...row, status: 'error', errorMessage: language === 'ar' ? 'تم الإلغاء' : 'Cancelled' } : row));
    } finally {
      batchBusy.current = false; requestController.current = null;
      setIsProcessing(false); setBatchActive(false); setIsCooldown(false); setCooldownSeconds(0); setLocalProgress('');
      if (count) showToast(manualCount ? 'info' : 'success', language === 'ar' ? `أُضيف ${count} صفًا؛ ${manualCount} للمراجعة اليدوية. راجع الأصل قبل التصدير.` : `${count} rows added; ${manualCount} need manual review. Check originals before export.`);
    }
  }, [language, apiKey, model]);

  const handlePauseBatch = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleResumeBatch = () => {
    isPausedRef.current = false;
    setIsPaused(false);
  };

  const handleCancelBatch = () => {
    if (window.confirm('هل تريد إيقاف معالجة بقية الفواتير والاحتفاظ بالفواتير التي تم استخراجها؟')) {
      isCancelledRef.current = true;
      requestController.current?.abort();
      showToast('info', 'تم إيقاف المعالجة والاحتفاظ بالفواتير المستخرجة.');
    }
  };

  const handleUpdateInvoice = (updated: InvoiceRow) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    showToast('success', t.toastRowUpdated);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => {
      const remaining = prev.filter((inv) => inv.id !== id);
      return remaining.map((inv, idx) => ({ ...inv, no: idx + 1 }));
    });
    showToast('info', t.toastRowDeleted);
  };

  const handleSaveInvoiceModal = (data: Partial<InvoiceRow>) => {
    if (editingInvoice) {
      const updated: InvoiceRow = {
        ...editingInvoice,
        ...data,
      } as InvoiceRow;
      handleUpdateInvoice(updated);
    } else {
      const newInv: InvoiceRow = {
        id: `manual-${Date.now()}`,
        no: data.no || invoices.length + 1,
        date: data.date || new Date().toISOString().split('T')[0],
        sellerName: data.sellerName || '',
        taxNumber: data.taxNumber || '',
        invoiceNumber: data.invoiceNumber || '',
        details: data.details || '',
        amountBeforeTax: Number(data.amountBeforeTax) || 0,
        tax: Number(data.tax) || 0,
        lastAmount: Number(data.lastAmount) || 0,
        currency: data.currency || 'SAR',
        taxRatePercent: data.taxRatePercent || 15,
      };

      setInvoices((prev) => [...prev, newInv]);
      showToast('success', t.toastRowAdded);
    }
  };

  const handleOpenAddManual = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  return (
    <div
      dir={t.dir}
      className={`min-h-screen bg-canvas text-ink flex flex-col ${
        language === 'ar' ? "font-['Cairo',sans-serif]" : "font-['Inter',sans-serif]"
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-500/50'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-700 border-rose-500/50'
                : 'bg-surface text-ink border-line'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-700" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-700" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header with Language Switcher */}
      <Header
        invoices={invoices}
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        isProcessing={isProcessing}
        language={language}
        onToggleLanguage={toggleLanguage}
        onOpenApiKeyGuide={() => setIsApiKeyGuideOpen(true)}
        t={t}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-primary mb-2">{language === 'ar' ? 'مساحة تحويل الفواتير' : 'INVOICE CONVERSION DESK'}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{language === 'ar' ? 'من الفاتورة إلى Excel، بوضوح.' : 'From invoice to Excel, clearly.'}</h2>
            <p className="text-muted text-sm mt-2">{language === 'ar' ? 'ارفع المستندات، راجع البيانات، ثم صدّر بنفس ترتيب الأعمدة.' : 'Upload documents, review the data, then export in the original column order.'}</p>
          </div>
          <ol className="flex gap-4 text-xs text-muted" aria-label={language === 'ar' ? 'خطوات التحويل' : 'Conversion steps'}>
            {(language === 'ar' ? ['رفع', 'مراجعة', 'تصدير'] : ['Upload', 'Review', 'Export']).map((step, index) => <li key={step} className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-surface border border-line grid place-items-center font-mono text-primary">{index + 1}</span>{step}</li>)}
          </ol>
        </section>
        <p role="status" className="text-xs text-muted border-s-2 border-primary ps-3 py-1">{language === 'ar' ? 'جلسة مؤقتة: لا يوجد أرشيف للفواتير. نزّل ملف Excel قبل إغلاق الصفحة.' : 'Temporary session: no invoice archive. Download your Excel file before closing this page.'}{hasUnexportedRows && <strong className="text-primary ms-2">{language === 'ar' ? 'توجد نتائج لم تُصدّر.' : 'Some results have not been exported.'}</strong>}</p>

        <section className="flex flex-wrap justify-between items-center gap-3 p-4 bg-surface border border-line rounded-xl text-sm">
          <p className="text-muted">{language === 'ar' ? (apiKey ? 'QR والنص أولًا محليًا؛ Gemini يستخدم فقط للصفحات غير المقروءة.' : 'QR وقراءة نص PDF بدون مفتاح. Gemini اختياري عند الحاجة، والفشل يُضاف للمراجعة اليدوية.') : (apiKey ? 'QR and text are read locally first; Gemini is used only for unreadable pages.' : 'QR and PDF text need no key. Gemini is optional; failed pages become manual review rows.')}</p>
          <div className="flex gap-3"><button disabled={isProcessing} className="text-primary font-bold" onClick={() => setIsApiKeyGuideOpen(true)}>{language === 'ar' ? (apiKey ? 'إعدادات المفتاح' : 'إضافة مفتاحي') : (apiKey ? 'Key settings' : 'Add my key')}</button>{apiKey && <button disabled={isProcessing} className="text-rose-700" onClick={() => setApiKey('')}>{language === 'ar' ? 'مسح المفتاح' : 'Clear key'}</button>}</div>
        </section>
        {/* Upload & Drop Zone */}
        <UploadZone
          onFilesSelected={handleFilesSelected}
          compact={invoices.length > 0}
          fileQueue={fileQueue}
          isProcessing={isProcessing}
          onRemoveQueueItem={(id) => setFileQueue((prev) => prev.filter((q) => q.id !== id))}
          t={t}
        />

        <details className="text-xs text-muted">
          <summary>{language === 'ar' ? 'تقدير الاستخدام على هذا المتصفح' : 'Usage estimate on this browser'}</summary>
          <p className="my-2">{language === 'ar' ? 'عداد محلي، وليس الرصيد الفعلي أو حدود حساب مزوّد الذكاء الاصطناعي.' : 'A local counter, not your AI provider’s actual balance or account limits.'}</p>
          <QuotaTracker quota={quota} t={t} language={language} />
        </details>
        {localProgress && <p role="status" className="text-sm text-primary">{localProgress}</p>}
        {/* Financial Metrics Cards */}
        {invoices.length > 0 && <SummaryCards invoices={invoices} t={t} language={language} />}

        {/* Excel Table Matching Attached Screenshot */}
        <InvoiceTable
          invoices={invoices}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onAddManualInvoice={handleOpenAddManual}
          onPreviewInvoice={(inv) => { setEditingInvoice(inv); setIsModalOpen(true); }}
          t={t}
          language={language}
        />
      </main>

      {/* Large Batch Processor Progress Floating Card (for 10, 50, 200+ invoices) */}
      <BatchProgressOverlay
        isOpen={batchActive}
        currentIndex={batchCurrentIndex}
        totalFiles={batchTotalFiles}
        extractedInvoicesCount={batchExtractedCount}
        currentChunk={batchCurrentChunk}
        totalChunks={batchTotalChunks}
        estimatedRemainingSeconds={batchEstSeconds}
        isCooldown={isCooldown}
        cooldownSecondsRemaining={cooldownSeconds}
        isPaused={isPaused}
        onPause={handlePauseBatch}
        onResume={handleResumeBatch}
        onCancel={handleCancelBatch}
        t={t}
        language={language}
      />

      {/* Manual Entry / Edit Modal */}
      <InvoiceModal
        key={editingInvoice?.id || 'new-invoice'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSaveInvoiceModal}
        initialData={editingInvoice}
        nextSequenceNo={invoices.length + 1}
        t={t}
        language={language}
      />

      {/* Document View Modal */}
      <DocumentPreviewModal
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        t={t}
        language={language}
      />

      {/* AI Key & Agent Smart Guide Modal */}
      <ApiKeyGuideModal
        apiKey={apiKey}
        model={model}
        isProcessing={isProcessing}
        onSave={(key, chosenModel) => { setApiKey(key); setModel(chosenModel); setIsApiKeyGuideOpen(false); }}
        isOpen={isApiKeyGuideOpen}
        onClose={() => setIsApiKeyGuideOpen(false)}
        t={t}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-5 text-xs text-muted">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-muted">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.footerText}</span>
          </div>

          {/* Designer Signature */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface border border-line shadow-sm">
            <span className="font-bold text-emerald-700">تصميم أ/ شادي ناصف</span>
            <span className="text-muted">•</span>
            <span className="font-medium text-ink font-mono">Designed by Shady Nassef</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
