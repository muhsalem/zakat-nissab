import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Play,
  FileSpreadsheet,
  Globe,
  Layers,
  Terminal,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { Page } from "@/components/site/Page";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "الربط البرمجي والمحاسبي (Open Zakat API & ERP) · نِصاب" },
      {
        name: "description",
        content:
          "واجهة برمجة مفتوحة (REST API) وودجات جاهزة للربط مع البرامج المحاسبية (Odoo, Zoho, QuickBooks) وإكسل وجوجل شيت والمواقع.",
      },
      {
        property: "og:title",
        content: "الربط البرمجي والمحاسبي المفتوح لنصاب الزكاة اليومي",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DevelopersPage,
});

export function DevelopersPage() {
  const { currency, country } = useI18n();
  const [selectedCountry, setSelectedCountry] = useState(country || "SA");
  const [selectedCurrency, setSelectedCurrency] = useState(currency || "SAR");
  const [activeTab, setActiveTab] = useState<"curl" | "js" | "python" | "sheets" | "excel">("curl");
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedWidget, setCopiedWidget] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nisab.org";

  const apiUrl = `${baseUrl}/api/v1/nisab?country=${selectedCountry}&currency=${selectedCurrency}`;
  const csvUrl = `${baseUrl}/api/v1/nisab/csv?currency=${selectedCurrency}`;
  const widgetUrl = `${baseUrl}/widget?country=${selectedCountry}&currency=${selectedCurrency}`;

  const widgetIframeCode = `<iframe
  src="${widgetUrl}"
  width="340"
  height="220"
  frameborder="0"
  scrolling="no"
  style="border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.05);"
  title="نصاب الزكاة اليومي"
></iframe>`;

  const codeSnippets = {
    curl: `curl -X GET "${apiUrl}" \\
  -H "Accept: application/json"`,
    js: `// Fetch Live Nisab in JavaScript / TypeScript / Node.js
async function getDailyNisab() {
  const res = await fetch("${apiUrl}");
  const { data } = await res.json();

  console.log("نصاب الذهب:", data.nisab.gold.value, data.currency);
  console.log("نصاب الفضة:", data.nisab.silver.value, data.currency);
  console.log("الأحظ للفقراء:", data.nisab.recommendedLowerNisab);
  return data;
}`,
    python: `# Fetch Live Nisab in Python / Django / ERP Integration
import requests

response = requests.get("${apiUrl}")
if response.status_code == 200:
    nisab_data = response.json()["data"]
    gold_nisab = nisab_data["nisab"]["gold"]["value"]
    silver_nisab = nisab_data["nisab"]["silver"]["value"]
    print(f"نصاب الذهب اليوم: {gold_nisab} {nisab_data['currency']}")
    print(f"نصاب الفضة اليوم: {silver_nisab} {nisab_data['currency']}")`,
    sheets: `// دالة إدراج النصاب اليومي في Google Sheets مباشرة:
=IMPORTDATA("${csvUrl}")

// أو لجلب نصاب الفضة فقط في خلية واحدة:
=INDEX(IMPORTDATA("${csvUrl}"), 4, 2)

// لجلب نصاب الذهب في خلية واحدة:
=INDEX(IMPORTDATA("${csvUrl}"), 3, 2)`,
    excel: `// دالة إدراج النصاب في Microsoft Excel:
=WEBSERVICE("${apiUrl}")

// أو عبر Power Query (من الويب):
1. افتح تبويب "بيانات (Data)" -> "من الويب (From Web)"
2. الصق الرابط: ${apiUrl}
3. اختر تحويل JSON إلى جدول لحساب وعاء زكاة الشركة تلقائياً كل صباح`,
  };

  const handleTestApi = async () => {
    setLoadingApi(true);
    try {
      const res = await fetch(apiUrl);
      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err) {
      setApiResponse(JSON.stringify({ error: String(err) }, null, 2));
    } finally {
      setLoadingApi(false);
    }
  };

  const copyCode = (code: string, type: "code" | "widget") => {
    navigator.clipboard.writeText(code);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedWidget(true);
      setTimeout(() => setCopiedWidget(false), 2000);
    }
  };

  return (
    <Page
      eyebrow="OPEN API & ERP INTEGRATION"
      title="الربط البرمجي والمحاسبي لنصاب الزكاة"
      sub="واجهات برمجية مفتوحة (REST API) وودجات مضمّنة وصيغ جاهزة لربط نصاب اليوم بالأنظمة المحاسبية ومواقع الإنترنت."
    >
      {/* Intro Badges */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          ✓ API مجاني مفتوح المصدر (وقف لوجه الله)
        </span>
        <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          ✓ يدعم CORS لكافة النطاقات
        </span>
        <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-foreground">
          ✓ متوافق مع Odoo, QuickBooks, Zoho, Excel, Google Sheets
        </span>
      </div>

      {/* Target Selector */}
      <div className="card-surface p-6 border border-border">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="size-4 text-accent" />
          تحديد الدولة والعملة لإنشاء روابط الربط المخصصة
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">اختر الدولة</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                const match = COUNTRIES.find((c) => c.code === e.target.value);
                if (match) setSelectedCurrency(match.currency);
              }}
              className="mt-1.5 w-full rounded-xl border border-input bg-card p-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.nameAr} ({c.code}) · {c.currency}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">العملة المطلوبة</label>
            <input
              type="text"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value.toUpperCase())}
              placeholder="SAR"
              className="mt-1.5 w-full rounded-xl border border-input bg-card p-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Section 1: REST API & Code Samples */}
      <section className="mt-8 card-surface p-6 sm:p-8 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Code2 className="size-5 text-accent" />
              واجهة REST API اللحظية
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              مسار عام لإرجاع أسعار الذهب والفضة ونصاب الزكاة لحظياً بصيغة JSON القياسية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              GET
            </span>
            <code className="text-xs bg-secondary px-2 py-1 rounded text-foreground font-mono">
              /api/v1/nisab
            </code>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="mt-6 flex flex-wrap gap-1.5 border-b border-border pb-2">
          {[
            { id: "curl", label: "cURL / Terminal" },
            { id: "js", label: "JavaScript / Node" },
            { id: "python", label: "Python (Odoo / ERP)" },
            { id: "sheets", label: "Google Sheets" },
            { id: "excel", label: "Microsoft Excel" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Snippet Box */}
        <div className="relative mt-4 rounded-xl bg-ink p-4 text-cream font-mono text-xs overflow-x-auto">
          <button
            onClick={() => copyCode(codeSnippets[activeTab], "code")}
            className="absolute top-3 end-3 flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs text-cream hover:bg-white/20 transition-colors"
          >
            {copiedCode ? (
              <Check className="size-3 text-emerald-400" />
            ) : (
              <Copy className="size-3" />
            )}
            {copiedCode ? "تم النسخ!" : "نسخ الكود"}
          </button>
          <pre className="pe-24">{codeSnippets[activeTab]}</pre>
        </div>

        {/* Interactive Test Console */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              جرّب الاستعلام مباشرة واطلع على بنية الـ JSON الحية:
            </span>
            <Button
              onClick={handleTestApi}
              size="sm"
              disabled={loadingApi}
              className="bg-primary text-primary-foreground"
            >
              <Play className="size-3.5 me-1.5" />
              {loadingApi ? "جاري الاستعلام..." : "تشغيل الاستعلام الآن"}
            </Button>
          </div>

          {apiResponse && (
            <div className="mt-3 rounded-xl bg-secondary/70 p-4 border border-border font-mono text-xs text-foreground max-h-72 overflow-y-auto">
              <pre>{apiResponse}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Embeddable Widget for Websites & Dashboards */}
      <section className="mt-8 card-surface p-6 sm:p-8 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Laptop className="size-5 text-accent" />
              ودجة العرض المضمّنة (Embeddable Widget)
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              كود تضمين خفيف لعرض بطاقة نصاب الزكاة اليومية داخل بوابات المحاسبة أو لوحات التحكم أو
              المواقع الإخبارية والإسلامية.
            </p>
          </div>

          <Button onClick={() => copyCode(widgetIframeCode, "widget")} variant="outline" size="sm">
            {copiedWidget ? (
              <Check className="size-3.5 me-1 text-emerald-600" />
            ) : (
              <Copy className="size-3.5 me-1" />
            )}
            {copiedWidget ? "تم نسخ كود الودجة!" : "نسخ كود iframe"}
          </Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              كود HTML المباشر (انسخه وألصقه في موقعك أو نظامك)
            </label>
            <div className="relative mt-2 rounded-xl bg-ink p-4 text-cream font-mono text-xs">
              <pre className="whitespace-pre-wrap">{widgetIframeCode}</pre>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-6">
              تحدث الودجة الأسعار تلقائياً كل ساعة وتتكيف تلقائياً مع الدولة والعملة المحددة.
            </p>
          </div>

          {/* Live Preview of Widget */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              معاينة حية للودجة (Live Preview)
            </label>
            <div className="rounded-xl border border-border p-2 bg-secondary/30 flex justify-center">
              <iframe
                src={widgetUrl}
                width="340"
                height="220"
                className="rounded-lg border border-border shadow-sm"
                title="معاينة الودجة"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: All Available Public Endpoints */}
      <section className="mt-8 card-surface p-6 border border-border">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Layers className="size-4 text-accent" />
          فهرس مسارات الـ API العامة المتاحة
        </h3>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="font-mono text-foreground text-sm">GET /api/v1/nisab</strong>
              <p className="text-muted-foreground mt-0.5">
                النصاب اليومي المباشر، عيارات الذهب، الفضة، والنسبة المرجحة (يدعم
                ?country=SA&currency=SAR).
              </p>
            </div>
            <a
              href={`${baseUrl}/api/v1/nisab?country=SA&currency=SAR`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
            >
              فتح الرابط <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="rounded-xl border border-border bg-background p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="font-mono text-foreground text-sm">GET /api/v1/nisab/csv</strong>
              <p className="text-muted-foreground mt-0.5">
                صيغة CSV مخصصة لدوال Excel و Google Sheets (ImportData).
              </p>
            </div>
            <a
              href={`${baseUrl}/api/v1/nisab/csv?currency=SAR`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
            >
              فتح الرابط <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="rounded-xl border border-border bg-background p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="font-mono text-foreground text-sm">
                GET /api/v1/nisab/all-countries
              </strong>
              <p className="text-muted-foreground mt-0.5">
                كافة أنصبة الزكاة وأسعار الجرام لجميع دول العالم دفعة واحدة (للشركات المتعددة
                الفروع).
              </p>
            </div>
            <a
              href={`${baseUrl}/api/v1/nisab/all-countries`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
            >
              فتح الرابط <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="rounded-xl border border-border bg-background p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <strong className="font-mono text-foreground text-sm">
                GET /api/v1/nisab/chronology
              </strong>
              <p className="text-muted-foreground mt-0.5">
                المرجع التاريخي لأنصبة الزكاة والمقادير الشرعية منذ عام 1 هجرية وحتى اليوم بصيغة
                JSON.
              </p>
            </div>
            <a
              href={`${baseUrl}/api/v1/nisab/chronology`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
            >
              فتح الرابط <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </section>
    </Page>
  );
}
