import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // OCR and Invoice Extraction Endpoint
  app.post('/api/extract-invoice', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName } = req.body;

      if (!fileBase64 || !mimeType) {
        return res.status(400).json({
          error: 'يرجى تقديم بيانات الملف ونوع MIME (File base64 and mimeType required).',
        });
      }

      // Check Gemini API key
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'مفتاح Gemini API غير مهيأ في الخادم (GEMINI_API_KEY is not configured).',
        });
      }

      // Prepare system prompt tailored to the exact columns in the template:
      // A: مسلسل (no)
      // B: التاريخ (date)
      // C: اسم المورد (The seller's name)
      // D: الرقم الضريبي (tax number)
      // E: رقم الفاتوره (invoice number)
      // F: البيانات (details)
      // G: المبلغ قبل الضريبه (amount befor tax)
      // H: الضريبه (tax)
      // I: المبلغ بعد الضريبه (last amount)
      const promptText = `
أنت خبير محاسبي متخصص في قراءة وفحص الفواتير الضريبية والإيصالات والمستندات المالية باللغتين العربية والإنجليزية، وتفريغها في جدول إكسيل مطابق للمعايير المحاسبية.
المطلوب:
قم بفحص المستند أو صورة الفاتورة المرفقة بدقة بالغة واستخراج الحقول التالية بدقة متناهية:
1. date (التاريخ): تاريخ الفاتورة بصيغة YYYY-MM-DD إن أمكن، أو التاريخ كما ورد في الفاتورة.
2. sellerName (اسم المورد / The seller's name): اسم الشركة أو المؤسسة أو المتجر أو المورد المصدر للفاتورة.
3. taxNumber (الرقم الضريبي / tax number): الرقم الضريبي أو رقم التسجيل الضريبي أو رقم القيمة المضافة (VAT/TRN) للمورد. إن لم يتوفر اكتب "غير محدد" أو اتركه فارغاً.
4. invoiceNumber (رقم الفاتوره / invoice number): رقم الفاتورة أو المعرف الفريد لها.
5. details (البيانات / details): بيان أو تفاصيل المنتجات / الخدمات المباعة أو وصف مختصر للمشتريات (مثال: "مشتريات مواد غذائية" أو "أدوات مكتبية ومستلزمات حاسب" أو سرد البنود الرئيسية).
6. amountBeforeTax (المبلغ قبل الضريبه / amount befor tax): القيمة الإجمالية الصافية قبل احتساب ضريبة القيمة المضافة كقيمة رقمية (رقم عشري، بدون رموز العملة).
7. tax (الضريبه / tax): قيمة الضريبة (ضريبة القيمة المضافة VAT) كقيمة رقمية. إن لم توجد ضريبة اجعلها 0.
8. lastAmount (المبلغ بعد الضريبه / last amount): الإجمالي النهائي للفاتورة شاملاً الضريبة كقيمة رقمية.
9. taxRatePercent: نسبة الضريبة المئوية إن ذكرت (مثل 15 أو 14 أو 5).
10. currency: العملة المستخرجة (SAR، EGP، AED، USD، إلخ).

ملاحظات هامة جداً:
- إذا كان المستند يحتوي على أكثر من فاتورة أو إيصال، استخرج كل فاتورة كعنصر منفصل في مصفوفة invoices.
- تأكد أن الأرقام صحيحة وعشرية ومطابقة لما هو مدون في الفاتورة: amountBeforeTax + tax يجب أن تقارب lastAmount.
- إذا كان هناك غموض في قراءة النص العربي أو الإنجليزي، استخدم سياق الأرقام والأسماء لتصحيحه محاسبياً بدقة.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: fileBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              invoices: {
                type: Type.ARRAY,
                description: 'قائمة الفواتير المستخرجة من المستند',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: {
                      type: Type.STRING,
                      description: 'تاريخ الفاتورة (التاريخ / date)',
                    },
                    sellerName: {
                      type: Type.STRING,
                      description: 'اسم المورد (اسم المورد / The seller name)',
                    },
                    taxNumber: {
                      type: Type.STRING,
                      description: 'الرقم الضريبي (الرقم الضريبي / tax number)',
                    },
                    invoiceNumber: {
                      type: Type.STRING,
                      description: 'رقم الفاتورة (رقم الفاتوره / invoice number)',
                    },
                    details: {
                      type: Type.STRING,
                      description: 'بيانات وتفاصيل المشتريات (البيانات / details)',
                    },
                    amountBeforeTax: {
                      type: Type.NUMBER,
                      description: 'المبلغ قبل الضريبة كقيمة رقمية (المبلغ قبل الضريبه)',
                    },
                    tax: {
                      type: Type.NUMBER,
                      description: 'قيمة الضريبة كقيمة رقمية (الضريبه)',
                    },
                    lastAmount: {
                      type: Type.NUMBER,
                      description: 'المبلغ بعد الضريبة / الإجمالي النهائي (المبلغ بعد الضريبه)',
                    },
                    taxRatePercent: {
                      type: Type.NUMBER,
                      description: 'نسبة الضريبة المئوية',
                    },
                    currency: {
                      type: Type.STRING,
                      description: 'رمز أو اسم العملة إن وجد',
                    },
                    notes: {
                      type: Type.STRING,
                      description: 'ملاحظات تدقيق إضافية',
                    },
                  },
                  required: [
                    'date',
                    'sellerName',
                    'invoiceNumber',
                    'details',
                    'amountBeforeTax',
                    'tax',
                    'lastAmount',
                  ],
                },
              },
            },
            required: ['invoices'],
          },
        },
      });

      const text = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini JSON output:', text);
        return res.status(500).json({
          error: 'فشل في قراءة مخرجات الذكاء الاصطناعي كـ JSON صالح.',
          raw: text,
        });
      }

      const extractedInvoices = parsedData.invoices || [];

      res.json({
        success: true,
        fileName: fileName || 'file',
        invoices: extractedInvoices,
      });
    } catch (err: any) {
      console.error('Error during OCR invoice extraction:', err);
      const isQuotaError =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.toLowerCase().includes('quota');

      let userMsg = err?.message || 'حدث خطأ أثناء معالجة الفاتورة واستخراج البيانات.';
      if (isQuotaError) {
        userMsg = 'تم الوصول إلى الحد الأقصى للطلبات المجانية (Rate Limit / Quota Exceeded). يرجى الانتظار دقيقة والمحاولة مجدداً أو ترقية الحساب.';
      }

      res.status(isQuotaError ? 429 : 500).json({
        error: userMsg,
        isQuotaExceeded: isQuotaError,
      });
    }
  });

  // Serve static files or Vite middlewares
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Invoice OCR to Excel Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
