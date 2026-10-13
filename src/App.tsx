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
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRow | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRow | null>(null);
  const [isApiKeyGuideOpen, setIsApiKeyGuideOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
    setInvoices(SAMPLE_INVOICES);
    showToast('success', t.toastSamplesLoaded);
  };

  const handleClearAll = () => {
    if (window.confirm(t.clearConfirm)) {
      setInvoices([]);
      setFileQueue([]);
      showToast('info', t.toastCleared);
    }
  };

  // Convert file to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper sleep function
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Batch runner with smart rate limiting, throttling, and auto-cooldown
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) return;

      const newQueueItems: FileQueueItem[] = files.map((file) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      }));

      setFileQueue((prev) => [...prev, ...newQueueItems]);
      setIsProcessing(true);
      isPausedRef.current = false;
      isCancelledRef.current = false;
      setIsPaused(false);

      const totalCount = newQueueItems.length;
      // Group into chunks of 10 for safe minute pacing
      const CHUNK_SIZE = 10;
      const totalChunks = Math.ceil(totalCount / CHUNK_SIZE);

      setBatchActive(true);
      setBatchTotalFiles(totalCount);
      setBatchCurrentIndex(0);
      setBatchExtractedCount(0);
      setBatchTotalChunks(totalChunks);
      setBatchCurrentChunk(1);
      setBatchEstSeconds(totalCount * 4); // ~4s per invoice on average

      let totalExtractedSoFar = 0;
      let processedIndex = 0;

      for (let i = 0; i < newQueueItems.length; i++) {
        if (isCancelledRef.current) {
          break;
        }

        // Wait if user clicked pause
        while (isPausedRef.current && !isCancelledRef.current) {
          await sleep(500);
        }

        const item = newQueueItems[i];
        processedIndex = i + 1;
        setBatchCurrentIndex(processedIndex);
        setBatchCurrentChunk(Math.floor(i / CHUNK_SIZE) + 1);
        setBatchEstSeconds(Math.max(0, (totalCount - processedIndex) * 4));

        // Mark item as processing in queue
        setFileQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
        );

        let success = false;
        let attempt = 0;
        const maxAttempts = 3;

        while (!success && attempt < maxAttempts && !isCancelledRef.current) {
          attempt++;
          try {
            const base64Data = await readFileAsBase64(item.file);
            const mimeType =
              item.type || (item.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

            const response = await fetch('/api/extract-invoice', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileBase64: base64Data,
                mimeType: mimeType,
                fileName: item.name,
              }),
            });

            const data = await response.json();

            // Handle 429 Rate Limit Exhaustion gracefully
            if (response.status === 429 || data.isQuotaExceeded) {
              console.warn('Minute rate limit reached. Triggering automatic smart cooldown...');
              setIsCooldown(true);
              // Wait 35 seconds for minute window reset
              for (let cd = 35; cd > 0; cd--) {
                setCooldownSeconds(cd);
                setQuota((prev) => ({ ...prev, cooldownSeconds: cd }));
                await sleep(1000);
                if (isCancelledRef.current) break;
              }
              setIsCooldown(false);
              setCooldownSeconds(0);
              setQuota((prev) => ({ ...prev, cooldownSeconds: 0 }));
              continue; // Retry this file
            }

            if (!response.ok || !data.success) {
              throw new Error(data.error || 'فشلت معالجة الفاتورة.');
            }

            const extractedList = data.invoices || [];
            if (extractedList.length === 0) {
              throw new Error('لم يتم العثور على بيانات في المستند.');
            }

            // Successfully processed - record quota usage
            const updatedQuota = recordQuotaRequest();
            setQuota(updatedQuota);

            // Format extracted rows and immediately append to table in real-time!
            setInvoices((prev) => {
              const currentTotalCount = prev.length;
              const newRows: InvoiceRow[] = extractedList.map((extracted: any, index: number) => ({
                id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 7)}-${index}`,
                no: currentTotalCount + index + 1,
                date: extracted.date || new Date().toISOString().split('T')[0],
                sellerName: extracted.sellerName || 'مورد',
                taxNumber: extracted.taxNumber || '',
                invoiceNumber: extracted.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
                details: extracted.details || 'مشتريات وبنود متنوعة',
                amountBeforeTax: Number(extracted.amountBeforeTax) || 0,
                tax: Number(extracted.tax) || 0,
                lastAmount: Number(extracted.lastAmount) || 0,
                currency: extracted.currency || 'SAR',
                taxRatePercent: extracted.taxRatePercent || 15,
                fileName: item.name,
                filePreviewUrl: item.previewUrl,
                fileMimeType: item.type,
                notes: extracted.notes,
              }));
              totalExtractedSoFar += newRows.length;
              setBatchExtractedCount(totalExtractedSoFar);
              return [...prev, ...newRows];
            });

            // Mark queue item as done
            setFileQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? { ...q, status: 'done', extractedCount: extractedList.length }
                  : q
              )
            );

            success = true;
          } catch (err: any) {
            console.error(`Attempt ${attempt} error for ${item.name}:`, err);
            if (attempt >= maxAttempts) {
              setFileQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? { ...q, status: 'error', errorMessage: err.message || 'خطأ' }
                    : q
                )
              );
            } else {
              // Short delay before retry
              await sleep(2000);
            }
          }
        }

        // Smart pacing breather: insert a 3.5s delay between consecutive invoices
        // to stay naturally within the 15 requests/minute free limit!
        if (i < newQueueItems.length - 1 && !isCancelledRef.current) {
          // If we completed a chunk of 10, give an extra 6-second buffer
          const isChunkBoundary = (i + 1) % CHUNK_SIZE === 0;
          await sleep(isChunkBoundary ? 6000 : 3500);
        }
      }

      setIsProcessing(false);
      setBatchActive(false);

      if (totalExtractedSoFar > 0) {
        showToast('success', t.batchCompletedCelebration(totalExtractedSoFar));
      }
    },
    [t]
  );

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
      setIsProcessing(false);
      setBatchActive(false);
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
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        language === 'ar' ? "font-['Cairo',sans-serif]" : "font-['Inter',sans-serif]"
      }`}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-slate-900/90 text-slate-200 border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
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
        {/* Free Quota Monitor Bar */}
        <QuotaTracker quota={quota} t={t} language={language} />

        {/* Upload & Drop Zone */}
        <UploadZone
          onFilesSelected={handleFilesSelected}
          fileQueue={fileQueue}
          isProcessing={isProcessing}
          onRemoveQueueItem={(id) => setFileQueue((prev) => prev.filter((q) => q.id !== id))}
          t={t}
        />

        {/* Financial Metrics Cards */}
        {invoices.length > 0 && <SummaryCards invoices={invoices} t={t} language={language} />}

        {/* Excel Table Matching Attached Screenshot */}
        <InvoiceTable
          invoices={invoices}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onAddManualInvoice={handleOpenAddManual}
          onPreviewInvoice={(inv) => setPreviewInvoice(inv)}
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
        isOpen={isApiKeyGuideOpen}
        onClose={() => setIsApiKeyGuideOpen(false)}
        t={t}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.footerText}</span>
          </div>

          {/* Designer Signature */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
            <span className="font-bold text-emerald-400">تصميم أ/ شادي ناصف</span>
            <span className="text-slate-600">•</span>
            <span className="font-medium text-slate-300 font-mono">Designed by Shady Nassef</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
