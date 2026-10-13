# تشغيل InvoiceGrid على دومينك بدون Orange Pi

الواجهة تُخدم من Cloudflare Workers Static Assets. القراءة تمر عبر Worker إلى Gemini، والتعديل وإنشاء Excel يحدثان داخل المتصفح. لا يحتاج هذا المسار إلى Docker أو قاعدة بيانات أو Cloudflare Tunnel أو اتصال بجهاز Orange Pi.

## طبيعة الجلسة

- الفواتير والنتائج في ذاكرة الصفحة فقط؛ لا تُحفظ في localStorage أو قاعدة بيانات.
- تُحفظ اللغة وعداد استخدام محلي فقط. العداد ليس رصيد حساب Gemini.
- الملفات تُرسل إلى Gemini للقراءة؛ تنطبق سياسة مزوّد الخدمة على معالجتها. التطبيق نفسه لا يكتب ملفات الفواتير ولا يسجل محتواها.
- نزّل Excel قبل الإغلاق. يظهر تنبيه مغادرة إذا بقيت نتائج غير مصدرة، لكن بعض متصفحات الهاتف لا تضمن إظهار هذا التنبيه.
- عند تعدد العملات، Excel يحتوي ورقة لكل عملة بنفس الأعمدة التسعة وبنفس ترتيب الصفوف داخل العملة. CSV ونسخ الجدول يتطلبان اختيار عملة واحدة إذا احتوت النتائج على عدة عملات؛ يحافظ CSV على تسلسل النتائج الظاهرة بدون صف إجمالي. تصدير نتائج البحث يصدّر الظاهر فقط.

## التجهيز من كمبيوترك

استخدم Node.js 22.12 أو أحدث، وحساب Cloudflare ودومين مُدار DNS فيه عبر Cloudflare. انقل DNS بحذر إذا كان لديك مواقع حالية، مع الحفاظ على سجلاتها؛ ربط هذا التطبيق لا يتطلب تغيير عنوان تطبيقاتك الحالية.

```bash
git clone https://github.com/shado0ox/InvoiceGrid.git
cd InvoiceGrid
npm ci
npx wrangler login
npm run deploy
```

الأوامر تعمل بعد دمج فرع التطوير. `workers_dev` وPreview URLs معطّلان في الإعداد؛ لذلك لا يظهر رابط عام بديل يتجاوز الدومين المحمي. أول نشر يجهز المشروع، وخدمة OCR تبقى مغلقة حتى تكتمل إعدادات Access.

## ربط الدومين وحماية مفتاح القراءة

1. افتح **Workers & Pages → invoicegrid → Settings → Domains & Routes → Add → Custom Domain**، واختر دومينًا فرعيًا مثل `invoices.example.com`. Cloudflare يكون الاستضافة الفعلية ويجهز DNS وHTTPS، دون توجيه الدومين إلى Orange Pi.
2. من **Zero Trust → Access → Applications** أضف تطبيق **Self-hosted** للدومين نفسه، بحيث يشمل كل المسارات. اختر الدخول بكود البريد، وأنشئ سياسة **Allow** لبريدك تحديدًا. لا تستخدم سياسة Bypass.
3. انسخ **Application Audience (AUD)** من إعداد التطبيق، واسم فريقك مثل `my-team.cloudflareaccess.com`، بدون `https://` أو مسار.
4. في **Worker → Settings → Variables and Secrets** أضف:
   - Secret: `GEMINI_API_KEY` — مفتاح Gemini الفعلي.
   - Variable: `GEMINI_MODEL` — مثال `gemini-3.8-flash`، أو نموذج متاح في حسابك يدعم الصور وPDF وإخراج JSON.
   - Variable: `ACCESS_TEAM_DOMAIN` — مثال `my-team.cloudflareaccess.com`.
   - Variable: `ACCESS_AUD` — Audience الخاص بتطبيق Access.
5. انشر الإعدادات، وافتح الدومين، وسجل ببريدك. الـWorker يتحقق من توقيع JWT والجهة المصدرة وAudience وانتهاء الصلاحية؛ مجرد إرسال ترويسة Access مزيفة لا يسمح باستخدام المفتاح.

يمكن إدخال المفتاح من CLI أيضًا، دون كتابته داخل المستودع:

```bash
npx wrangler secret put GEMINI_API_KEY
```

لا تضف المفتاح إلى متغير يبدأ بـ`VITE_`؛ هذه المتغيرات تدخل ملفات المتصفح. لا تضف سجلات محتوى الطلبات أو الفواتير إلى الـWorker. إعداد observability معطل في هذا المشروع؛ سجلات حساب Cloudflare وGemini تخضع لإعدادات مزوّد الخدمة.

## اختبار التشغيل بعد الربط

1. افتح الدومين في نافذة خاصة: يظهر طلب الدخول من Cloudflare Access.
2. بعد الدخول، ارفع صورة فاتورة صغيرة ثم PDF، وراجع المستند بجانب الحقول.
3. نزّل Excel وافتحه للتأكد من ترتيب الأعمدة والأرقام الضريبية والإجماليات.
4. جرّب عملتين: يجب أن تظهرا في ورقتين وإجماليات منفصلة.
5. رابط `/api/extract-invoice` بدون جلسة Access صالحة يجب أن يُحظر. لا تستخدم جهاز Orange Pi ضمن هذه التجربة.

## التحديثات والتكلفة

اربط مستودع GitHub من **Worker → Settings → Builds** لتفعيل النشر عند تحديث `main`: أمر البناء `npm ci && npm run build`، وأمر النشر `npx wrangler deploy`. احتفظ بالمفاتيح في إعدادات الـWorker، لا GitHub. أو حدّث يدويًا من كمبيوترك:

```bash
git pull --ff-only
npm ci
npm run deploy
```

يمكن البدء بخطة Cloudflare المناسبة لاستخدامك، ومنها الخطة المجانية ضمن حدودها. الملفات الثابتة وخدمة الـWorker لها حدود مختلفة؛ زمن CPU ومعالجة الملفات الكبيرة يجب قياسهما على الاستضافة الفعلية. Gemini له حصص وتكلفة مستقلة؛ استضافة الواجهة لا تجعل قراءة الفواتير مجانية تلقائيًا. الحد الحالي 6 MB لكل ملف، والطلبات متتابعة لتقليل الاستهلاك.

## تطوير محلي فقط

انسخ `.env.example` إلى `.env` وأدخل المفتاح محليًا، ثم `npm run dev`. سيرفر Node المحلي يستمع على `127.0.0.1`، ولا يستخدم Cloudflare Access؛ النشر المقصود للدومين هو Worker المحمي، وليس فتح هذا السيرفر للإنترنت.

التحقق: `npm run lint`، `npm test`، `npm run build`، و`npx wrangler deploy --dry-run`.

المراجع الرسمية:
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/workers/platform/pricing/
