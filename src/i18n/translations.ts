export type Language = 'ar' | 'en';

export interface Translations {
  dir: 'rtl' | 'ltr';
  appTitle: string;
  appSubtitle: string;
  aiBadge: string;
  loadSamples: string;
  clearTable: string;
  clearConfirm: string;
  downloadExcel: string;
  exportXlsx: string;
  exportCsv: string;
  copyExcel: string;
  copied: string;
  apiKeyGuideBtn: string;
  
  // Summary Cards
  totalInvoices: string;
  invoicesCountSuffix: string;
  amountBeforeTax: string;
  totalTax: string;
  grandTotal: string;
  finalTotalSuffix: string;
  currencyUnit: string;

  // Quota Indicator
  freeQuotaTitle: string;
  dailyUsage: string;
  minuteSpeed: string;
  quotaGood: string;
  quotaBusy: string;
  quotaRateLimited: string;
  autoCooldownActive: string;
  rpmStatus: string;
  rpdStatus: string;

  // Batch Processor for large uploads (e.g. 200+ invoices)
  batchProgressTitle: string;
  batchProcessingFile: (current: number, total: number) => string;
  batchChunkInfo: (currentChunk: number, totalChunks: number) => string;
  batchEstRemaining: (seconds: number) => string;
  batchSmartPacing: string;
  batchCooldownWaiting: (seconds: number) => string;
  batchPause: string;
  batchResume: string;
  batchCancel: string;
  batchPausedMessage: string;
  batchCompletedCelebration: (count: number) => string;

  // API Key Guide Smart Modal
  apiKeyGuideTitle: string;
  apiKeyGuideSubtitle: string;
  apiKeyStep1Title: string;
  apiKeyStep1Desc: string;
  apiKeyStep2Title: string;
  apiKeyStep2Desc: string;
  apiKeyStep3Title: string;
  apiKeyStep3Desc: string;
  apiKeyStep4Title: string;
  apiKeyStep4Desc: string;
  apiKeySecurityNote: string;
  apiKeyOpenPortal: string;
  apiKeyBenefitTitle: string;
  apiKeyBenefit1: string;
  apiKeyBenefit2: string;
  apiKeyBenefit3: string;
  close: string;

  // Upload Zone
  dropTitleDrag: string;
  dropTitleNormal: string;
  dropSubtitle: string;
  pdfBadge: string;
  ocrBadge: string;
  batchBadge: string;
  uploadLimitsBadge: string;
  queueTitle: string;
  processingAi: string;
  remove: string;

  // Table
  searchPlaceholder: string;
  addRow: string;
  emptyTableTitle: string;
  emptyTableDesc: string;
  addInvoiceManual: string;
  actions: string;
  filteredTotal: string;
  filteredNote: string;
  editRow: string;
  deleteRow: string;
  viewDocument: string;
  saveChanges: string;
  cancel: string;

  // Table Column Headers (Row 1 & Row 2)
  colNo: string;
  colDate: string;
  colSeller: string;
  colTaxNo: string;
  colInvNo: string;
  colDetails: string;
  colBeforeTax: string;
  colTax: string;
  colLastAmount: string;

  subNo: string;
  subDate: string;
  subSeller: string;
  subTaxNo: string;
  subInvNo: string;
  subDetails: string;
  subBeforeTax: string;
  subTax: string;
  subLastAmount: string;

  // Modal
  modalEditTitle: string;
  modalAddTitle: string;
  taxCalcAuto: string;
  sellerPlaceholder: string;
  taxNoPlaceholder: string;
  invNoPlaceholder: string;
  detailsPlaceholder: string;
  save: string;
  currencyLabel: string;

  // Document Preview Modal
  previewModalTitle: string;
  previewModalSubtitle: string;
  downloadOriginal: string;
  extractedOcrTitle: string;
  auditVerified: string;
  noDocPreview: string;

  // Toasts
  toastSamplesLoaded: string;
  toastCleared: string;
  toastExtractedSuccess: (count: number, files: number) => string;
  toastExtractedFailed: string;
  toastRowUpdated: string;
  toastRowDeleted: string;
  toastRowAdded: string;

  // Footer
  footerText: string;
  footerColumns: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    dir: 'rtl',
    appTitle: 'إنفويس جريد | InvoiceGrid',
    appSubtitle: 'النظام المحاسبي الذكي لتحويل فواتير الـ PDF والصور إلى جداول إكسيل قابلة للمراجعة',
    aiBadge: 'ذكاء اصطناعي OCR',
    loadSamples: 'تحميل فواتير تجريبية',
    clearTable: 'مسح الجدول',
    clearConfirm: 'هل أنت متأكد من رغبتك في مسح جميع الفواتير من الجدول؟',
    downloadExcel: 'تحميل ملف إكسيل (.xlsx)',
    exportXlsx: 'تصدير إكسيل (.xlsx)',
    exportCsv: 'تصدير CSV',
    copyExcel: 'نسخ لإكسيل',
    copied: 'تم النسخ!',
    apiKeyGuideBtn: 'دليل مفتاح الوكيل والـ API',

    totalInvoices: 'عدد الفواتير',
    invoicesCountSuffix: 'فاتورة مستخرجة',
    amountBeforeTax: 'المبلغ قبل الضريبة',
    totalTax: 'إجمالي الضريبة (VAT)',
    grandTotal: 'المبلغ بعد الضريبة (الإجمالي)',
    finalTotalSuffix: 'المجموع النهائي',
    currencyUnit: 'ريال / ج.م',

    // Quota Indicator
    freeQuotaTitle: 'مؤشر الاستخدام المجاني (Gemini AI)',
    dailyUsage: 'الرصيد اليومي المجاني',
    minuteSpeed: 'سرعة الدقيقة الحالية',
    quotaGood: 'الرصيد المجاني متاح ومستقر',
    quotaBusy: 'معالجة مكثفة - تنظيم ذكي للطلبات',
    quotaRateLimited: 'انتظار تجديد حد الدقيقة المؤقت',
    autoCooldownActive: 'جاري التهدئة الذكية لتفادي أي حظر',
    rpmStatus: 'طلب/دقيقة',
    rpdStatus: 'فاتورة اليوم',

    // Batch Processor
    batchProgressTitle: 'معالجة الدفعة الكبيرة بالذكاء الاصطناعي',
    batchProcessingFile: (current, total) => `جاري العمل على الفاتورة (${current} من ${total})`,
    batchChunkInfo: (currentChunk, totalChunks) => `الدفعة الذكية ${currentChunk} من ${totalChunks}`,
    batchEstRemaining: (seconds) => {
      if (seconds <= 0) return 'جاري إنهاء المعالجة...';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins === 0) return `الوقت المتبقي التقديري: حوالي ${secs} ثانية`;
      return `الوقت المتبقي التقديري: حوالي ${mins} دقيقة و ${secs} ثانية`;
    },
    batchSmartPacing: 'تقسيم العمل ذكياً بمعدل آمن لتفادي نفاذ حد الاستيعاب المجاني',
    batchCooldownWaiting: (seconds) => `تم بلوغ حد الدقيقة مؤقتاً، جاري الانتظار التلقائي (${seconds} ثانية) ثم استئناف العمل ذاتياً...`,
    batchPause: 'إيقاف مؤقت',
    batchResume: 'استئناف المعالجة',
    batchCancel: 'إيقاف واحتفاظ بالمستخرج',
    batchPausedMessage: 'تم إيقاف المعالجة مؤقتاً بواسطة المستخدم. اضغط استئناف للمتابعة.',
    batchCompletedCelebration: (count) => `تم استخراج ${count} فاتورة. راجع النتائج وحالة الملفات قبل التصدير.`,

    // API Key Smart Guide Modal
    apiKeyGuideTitle: 'شاشة إرشادات إصدار وربط مفتاح الوكيل الصناعي (Gemini API)',
    apiKeyGuideSubtitle: 'طريقة إصدار مفتاحك الخاص مجاناً وربطه بأمان بالبرنامج لرفع حدود الاستخدام',
    apiKeyStep1Title: '1. الدخول إلى بوابة Google AI Studio',
    apiKeyStep1Desc: 'توجه إلى بوابة المطورين الرسمية من جوجل باستخدام حساب Google الخاص بك.',
    apiKeyStep2Title: '2. إنشاء مفتاح جديد (Create API Key)',
    apiKeyStep2Desc: 'اضغط على زر «Create API key» ثم اختر مشروع Google Cloud مجاني ليتم توليد المفتاح الخاص بك فوراً.',
    apiKeyStep3Title: '3. نسخ المفتاح السري',
    apiKeyStep3Desc: 'انسخ كود المفتاح (يبدأ عادةً بـ AIzaSy...). احتفظ به في مكان آمن ولا تشاركه مع الآخرين.',
    apiKeyStep4Title: '4. الربط الآمن في إعدادات المنصة (Settings > Secrets)',
    apiKeyStep4Desc: 'في واجهة AI Studio، توجه إلى قائمة «الإعدادات > الأسرار (Settings > Secrets)»، وقم بتعيين المتغير GEMINI_API_KEY. يتم التعامل معه عبر الخادم بأمان فائق بدون أي انكشاف للمتصفح.',
    apiKeySecurityNote: 'معايير الأمان المتقدمة: يتم حماية المفتاح على مستوى الخادم (Server-Side Proxy)، مما يضمن عدم تعرضه للسرقة أو الانكشاف في كود المتصفح.',
    apiKeyOpenPortal: 'فتح بوابة Google AI Studio الرسمية',
    apiKeyBenefitTitle: 'مزايا استخدام مفتاحك الخاص:',
    apiKeyBenefit1: 'رصيد مجاني شخصي يتجدد يومياً (1,500 طلب/يوم) خاص بك وحدك.',
    apiKeyBenefit2: 'إمكانية ترقية الحساب للدفع حسب الاستخدام لمعالجة عشرات الآلاف من الفواتير بلا قيود.',
    apiKeyBenefit3: 'تحكم كامل في إحصائيات الاستهلاك وسجلات الطلبات.',
    close: 'إغلاق',

    dropTitleDrag: 'أفلت ملفات الفواتير هنا لبدء الاستخراج...',
    dropTitleNormal: 'اسحب وأفلت فواتير الـ PDF أو الصور هنا، أو اضغط للاختيار',
    dropSubtitle: 'يدعم ملفات PDF وصور الفواتير PNG, JPG, WEBP — يمكنك أيضاً لصق صورة الفاتورة مباشرة عبر Ctrl + V',
    pdfBadge: 'مستندات PDF متعددة الصفحات',
    ocrBadge: 'فواتير مصورة & مسح ضوئي OCR',
    batchBadge: 'استخراج دفعات ضخمة (حتى 200+ فاتورة مع تقسيم ذكي)',
    uploadLimitsBadge: 'الحد الموصى به: 100-200 فاتورة / دفعة • أقصى حجم للملف: 6 MB',
    queueTitle: 'قائمة معالجة الملفات',
    processingAi: 'جاري قراءة QR والنص، ثم Gemini عند الحاجة...',
    remove: 'إزالة',

    searchPlaceholder: 'بحث في اسم المورد، رقم الفاتورة، الرقم الضريبي، البيان...',
    addRow: 'إضافة سطر يدوياً',
    emptyTableTitle: 'جدول الفواتير فارغ حالياً',
    emptyTableDesc: 'قم بسحب وإفلات فواتير PDF أو صور الفواتير أعلاه، أو اضغط على «تحميل فواتير تجريبية» لمشاهدة النموذج وتجربة التصدير فوراً.',
    addInvoiceManual: 'إدخال فاتورة يدوياً',
    actions: 'إجراءات',
    filteredTotal: 'الإجمالي النهائي / Total',
    filteredNote: 'مجموع المبالغ المفلترة',
    editRow: 'تعديل هذا السطر',
    deleteRow: 'حذف هذا السطر',
    viewDocument: 'عرض أصل المستند / الفاتورة',
    saveChanges: 'حفظ التعديلات',
    cancel: 'إلغاء',

    colNo: 'مسلسل',
    colDate: 'التاريخ',
    colSeller: 'اسم المورد',
    colTaxNo: 'الرقم الضريبي',
    colInvNo: 'رقم الفاتوره',
    colDetails: 'البيانات',
    colBeforeTax: 'المبلغ قبل الضريبه',
    colTax: 'الضريبه',
    colLastAmount: 'المبلغ بعد الضريبه',

    subNo: 'no',
    subDate: 'date',
    subSeller: "The seller's name",
    subTaxNo: 'tax number',
    subInvNo: 'invoice number',
    subDetails: 'details',
    subBeforeTax: 'amount befor tax',
    subTax: 'tax',
    subLastAmount: 'last amount',

    modalEditTitle: 'تعديل بيانات الفاتورة',
    modalAddTitle: 'إضافة سطر فاتورة جديد',
    taxCalcAuto: 'احتساب الضريبة التلقائي:',
    sellerPlaceholder: 'مثال: شركة التوريدات التقنية',
    taxNoPlaceholder: 'مثال: 300123456700003',
    invNoPlaceholder: 'مثال: INV-2024-001',
    detailsPlaceholder: 'وصف السلع أو الخدمات المباعة...',
    save: 'حفظ الفاتورة',
    currencyLabel: 'العملة (Currency)',

    previewModalTitle: 'معاينة مستند الفاتورة:',
    previewModalSubtitle: 'رقم الفاتورة:',
    downloadOriginal: 'تحميل الملف الأصلي',
    extractedOcrTitle: 'البيانات المستخرجة بالـ OCR',
    auditVerified: 'راجع البيانات مع الأصل',
    noDocPreview: 'المستند تم إدخاله يدوياً أو تمت معالجته بدون حفظ نسخة المعاينة.',

    toastSamplesLoaded: 'تم تحميل فواتير نموذجية بنجاح! يمكنك الآن تجربة تصدير ملف الإكسيل أو التعديل.',
    toastCleared: 'تم تفريغ الجدول بنجاح.',
    toastExtractedSuccess: (count, files) => `تم استخراج ${count} سجل بنجاح من ${files} ملف وإضافتها للجدول!`,
    toastExtractedFailed: 'تعذر استخراج بيانات من الملفات المحددة. يرجى التحقق من وضوح الفواتير.',
    toastRowUpdated: 'تم تحديث سطر الفاتورة بنجاح.',
    toastRowDeleted: 'تم حذف السطر وتحديث التسلسل.',
    toastRowAdded: 'تمت إضافة الفاتورة يدوياً إلى الجدول.',

    footerText: 'نظام استخراج فواتير المشتريات الضريبية وتحويلها إلى جداول إكسيل (.xlsx) للمراجعة والتصدير',
    footerColumns: 'مطابق لتنسيق الأعمدة المحاسبي: مسلسل | التاريخ | اسم المورد | الرقم الضريبي | رقم الفاتوره | البيانات | المبلغ قبل الضريبه | الضريبه | المبلغ بعد الضريبه',
  },
  en: {
    dir: 'ltr',
    appTitle: 'InvoiceGrid | إنفويس جريد',
    appSubtitle: 'AI-Powered Invoice & PDF to Structured Accounting Excel Spreadsheets',
    aiBadge: 'AI OCR Vision',
    loadSamples: 'Load Demo Invoices',
    clearTable: 'Clear Table',
    clearConfirm: 'Are you sure you want to clear all invoices from the table?',
    downloadExcel: 'Download Excel (.xlsx)',
    exportXlsx: 'Export Excel (.xlsx)',
    exportCsv: 'Export CSV',
    copyExcel: 'Copy for Excel',
    copied: 'Copied!',
    apiKeyGuideBtn: 'AI Key & Agent Guide',

    totalInvoices: 'Total Invoices',
    invoicesCountSuffix: 'extracted invoices',
    amountBeforeTax: 'Amount Before Tax',
    totalTax: 'Total Tax (VAT)',
    grandTotal: 'Amount After Tax (Total)',
    finalTotalSuffix: 'Grand Total',
    currencyUnit: 'SAR / EGP / USD',

    // Quota Indicator
    freeQuotaTitle: 'Free Usage Quota Monitor (Gemini AI)',
    dailyUsage: 'Free Daily Balance',
    minuteSpeed: 'Current Minute Rate',
    quotaGood: 'Free Tier Available & Healthy',
    quotaBusy: 'High Batch Load - Smart Pacing Active',
    quotaRateLimited: 'Waiting for Minute Window Reset',
    autoCooldownActive: 'Smart pacing active to prevent rate limits',
    rpmStatus: 'req/min',
    rpdStatus: 'today',

    // Batch Processor
    batchProgressTitle: 'Large Batch Processing with AI',
    batchProcessingFile: (current, total) => `Processing invoice (${current} of ${total})`,
    batchChunkInfo: (currentChunk, totalChunks) => `Smart Batch ${currentChunk} of ${totalChunks}`,
    batchEstRemaining: (seconds) => {
      if (seconds <= 0) return 'Wrapping up processing...';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (mins === 0) return `Estimated time remaining: ~${secs} seconds`;
      return `Estimated time remaining: ~${mins}m ${secs}s`;
    },
    batchSmartPacing: 'Work is divided intelligently to stay within free rate limits without interruption',
    batchCooldownWaiting: (seconds) => `Minute rate limit reached temporarily. Pausing automatically (${seconds}s) then resuming autonomously...`,
    batchPause: 'Pause',
    batchResume: 'Resume',
    batchCancel: 'Stop & Keep Extracted',
    batchPausedMessage: 'Batch processing paused by user. Click Resume to continue.',
    batchCompletedCelebration: (count) => `${count} invoices extracted. Review the results and file statuses before exporting.`,

    // API Key Smart Guide Modal
    apiKeyGuideTitle: 'AI Agent & Gemini API Key Guide',
    apiKeyGuideSubtitle: 'How to issue your personal API key for free and configure it to boost your limits',
    apiKeyStep1Title: '1. Access Google AI Studio',
    apiKeyStep1Desc: 'Open the official Google AI Studio developer portal using your Google account.',
    apiKeyStep2Title: '2. Create a New API Key',
    apiKeyStep2Desc: 'Click "Create API key" and select a free Google Cloud project to generate your personal key instantly.',
    apiKeyStep3Title: '3. Copy Your Secret Key',
    apiKeyStep3Desc: 'Copy the secret key code (usually starts with AIzaSy...). Keep it confidential.',
    apiKeyStep4Title: '4. Connect in Settings > Secrets',
    apiKeyStep4Desc: 'In the AI Studio interface, go to "Settings > Secrets" and set the GEMINI_API_KEY variable. It is handled securely server-side with zero browser exposure.',
    apiKeySecurityNote: 'High Security Standards: The API key is managed via a server-side proxy to prevent any client-side bundle leakage or token theft.',
    apiKeyOpenPortal: 'Open Official Google AI Studio Portal',
    apiKeyBenefitTitle: 'Benefits of using your own key:',
    apiKeyBenefit1: 'Dedicated free quota (1,500 requests/day) exclusively for your account.',
    apiKeyBenefit2: 'Option to switch to Pay-as-you-go to process tens of thousands of invoices without limits.',
    apiKeyBenefit3: 'Full visibility over usage analytics and request monitoring.',
    close: 'Close',

    dropTitleDrag: 'Drop invoice files here to start extracting...',
    dropTitleNormal: 'Drag and drop PDF invoices or images here, or click to browse',
    dropSubtitle: 'Supports PDF files & images (PNG, JPG, WEBP) — You can also paste an invoice screenshot directly with Ctrl + V',
    pdfBadge: 'Multi-page PDF Documents',
    ocrBadge: 'Scanned Invoices & OCR Vision',
    batchBadge: 'Large Batches (up to 200+ invoices with smart pacing)',
    uploadLimitsBadge: 'Recommended: 100-200 invoices / batch • Max file: 6 MB',
    queueTitle: 'File Processing Queue',
    processingAi: 'Reading QR and text, then Gemini if needed...',
    remove: 'Remove',

    searchPlaceholder: 'Search by seller name, invoice number, tax number, details...',
    addRow: 'Add Manual Row',
    emptyTableTitle: 'Invoice table is currently empty',
    emptyTableDesc: 'Drag & drop PDF invoices or invoice images above, or click "Load Demo Invoices" to preview and test the spreadsheet export right away.',
    addInvoiceManual: 'Add Invoice Manually',
    actions: 'Actions',
    filteredTotal: 'Grand Total / الإجمالي',
    filteredNote: 'Sum of filtered records',
    editRow: 'Edit this row',
    deleteRow: 'Delete this row',
    viewDocument: 'View original invoice document',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',

    colNo: 'مسلسل',
    colDate: 'التاريخ',
    colSeller: 'اسم المورد',
    colTaxNo: 'الرقم الضريبي',
    colInvNo: 'رقم الفاتوره',
    colDetails: 'البيانات',
    colBeforeTax: 'المبلغ قبل الضريبه',
    colTax: 'الضريبه',
    colLastAmount: 'المبلغ بعد الضريبه',

    subNo: 'no',
    subDate: 'date',
    subSeller: "The seller's name",
    subTaxNo: 'tax number',
    subInvNo: 'invoice number',
    subDetails: 'details',
    subBeforeTax: 'amount befor tax',
    subTax: 'tax',
    subLastAmount: 'last amount',

    modalEditTitle: 'Edit Invoice Record',
    modalAddTitle: 'Add New Invoice Record',
    taxCalcAuto: 'Automatic Tax Calculation:',
    sellerPlaceholder: 'e.g. Acme Tech Solutions Ltd',
    taxNoPlaceholder: 'e.g. 300123456700003',
    invNoPlaceholder: 'e.g. INV-2024-001',
    detailsPlaceholder: 'Description of items or services...',
    save: 'Save Invoice',
    currencyLabel: 'Currency',

    previewModalTitle: 'Invoice Document Preview:',
    previewModalSubtitle: 'Invoice No:',
    downloadOriginal: 'Download Original File',
    extractedOcrTitle: 'Extracted OCR Data',
    auditVerified: 'Audited & Verified',
    noDocPreview: 'This document was added manually or processed without a stored preview.',

    toastSamplesLoaded: 'Sample invoices loaded successfully! You can now test the Excel export or edit rows.',
    toastCleared: 'Table cleared successfully.',
    toastExtractedSuccess: (count, files) => `Successfully extracted ${count} record(s) from ${files} file(s)!`,
    toastExtractedFailed: 'Failed to extract data from the selected files. Please check invoice clarity.',
    toastRowUpdated: 'Invoice row updated successfully.',
    toastRowDeleted: 'Row deleted and sequence re-indexed.',
    toastRowAdded: 'Invoice added manually to table.',

    footerText: 'Invoice extraction into reviewable Excel (.xlsx) spreadsheets',
    footerColumns: 'Matching accountant columns: no | date | The seller\'s name | tax number | invoice number | details | amount befor tax | tax | last amount',
  },
};
