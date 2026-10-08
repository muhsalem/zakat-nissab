import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Globe2,
  Landmark,
  Scale,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Page } from "@/components/site/Page";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, Country, countryName, flagOf } from "@/lib/countries";
import { usePrices } from "@/lib/use-prices";
import {
  GOLD_NISAB_G,
  KARATS,
  SILVER_NISAB_G,
  formatMoney,
  formatNumber,
  goldNisabValue,
  perGram,
  silverNisabValue,
} from "@/lib/nisab";
import { getOfficialFatwa } from "@/lib/official-nisab";
import { ZAKAT_PORTALS } from "@/lib/official-portals";
import { CountryVerificationSection } from "@/components/site/CountryVerificationSection";

export const Route = createFileRoute("/country/$code")({
  loader: ({ params }) => {
    const code = params.code.toUpperCase();
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) throw notFound();
    return { country };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "دولة غير متاحة · نِصاب" }, { name: "robots", content: "noindex" }],
      };
    }
    const { country } = loaderData;
    const title = `نصاب الزكاة في ${country.ar} · ${country.currency}`;
    const desc = `قيمة نصاب الذهب (٨٥غ) والفضّة (٥٩٥غ) في ${country.ar} بعملة ${country.currency}، محدّثة يومياً مع الفتوى الرسمية ومصارف الزكاة.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CountryDetail,
});

function CountryDetail() {
  const { country } = Route.useLoaderData();
  const { t, lang, setCountry } = useI18n();
  const { data: base, isLoading } = usePrices();

  const [copied, setCopied] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  const rate = base?.rates?.[country.currency] ?? 1;
  const goldUsdOz = base?.goldUsdOz ?? 2800;
  const silverUsdOz = base?.silverUsdOz ?? 32;

  const goldGram = perGram(goldUsdOz, rate);
  const silverGram = perGram(silverUsdOz, rate);
  const goldNisab = goldNisabValue(goldUsdOz, rate);
  const silverNisab = silverNisabValue(silverUsdOz, rate);
  const lowerNisab = Math.min(goldNisab, silverNisab);

  const fatwa = getOfficialFatwa(country.code);
  const portal = ZAKAT_PORTALS.find((p) => p.countryCode === country.code);

  const money = (v: number) => formatMoney(v, country.currency, lang);

  // Quick calculator logic
  const cashNum = parseFloat(cashAmount.replace(/,/g, "")) || 0;
  const isDue = cashNum >= lowerNisab;
  const zakatDue = isDue ? cashNum * 0.025 : 0;

  const copyShareText = () => {
    const text =
      lang === "ar"
        ? `📍 نصاب الزكاة اليوم في ${country.ar} (${country.currency}):\n` +
          `• نصاب الذهب (85 جم): ${money(goldNisab)}\n` +
          `• نصاب الفضة (595 جم): ${money(silverNisab)}\n` +
          `• النصاب الأدنى الأحوط: ${money(lowerNisab)}\n` +
          `المرجع الشرعي: ${fatwa.authorityAr}\n` +
          `🔗 للتفاصيل والحاسبة: ${typeof window !== "undefined" ? window.location.href : ""}`
        : `📍 Today's Zakat Nisab in ${country.en} (${country.currency}):\n` +
          `• Gold Nisab (85g): ${money(goldNisab)}\n` +
          `• Silver Nisab (595g): ${money(silverNisab)}\n` +
          `• Lower Nisab: ${money(lowerNisab)}\n` +
          `Authority: ${fatwa.authorityEn}\n` +
          `🔗 Details: ${typeof window !== "undefined" ? window.location.href : ""}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Page
      eyebrow={country.code}
      title={`${flagOf(country.code)} ${t("country.title").replace("{name}", countryName(country, lang))}`}
      sub={
        lang === "ar"
          ? `قيمة النصاب بالعملة المحلية (${country.currency}) بأسعار السوق الفورية والفتوى المعتمدة.`
          : `Live nisab threshold in ${country.currency} with local rulings and verified portals.`
      }
    >
      {/* Action header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/compare"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-3.5 rtl:rotate-180" />
            {t("compare.title")}
          </Link>
          <span className="text-border">|</span>
          <span className="text-xs text-muted-foreground font-mono">
            1 USD = {rate.toFixed(4)} {country.currency}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCountry(country.code)}
            className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            {lang === "ar" ? "تعيين كبلدي الافتراضي" : "Set as default country"}
          </button>
          <button
            onClick={copyShareText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                {lang === "ar" ? "تم النسخ" : "Copied"}
              </>
            ) : (
              <>
                <Share2 className="size-3.5" />
                {lang === "ar" ? "مشاركة النصاب" : "Share"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Nisab Cards */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-muted-foreground">{t("nisab.gold")}</span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
              {GOLD_NISAB_G} {t("grams")} (24k)
            </span>
          </div>
          <p className="num mt-3 text-3xl font-bold text-foreground">{money(goldNisab)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {money(goldGram)} / {t("grams")} (عيار 24)
          </p>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground">{t("karat.title")}:</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              {KARATS.map((k) => (
                <div key={k.karat} className="rounded-lg bg-secondary/50 p-2">
                  <span className="block font-medium text-foreground">
                    {lang === "ar" ? `عيار ${k.karat}` : `${k.karat}k`}
                  </span>
                  <span className="num mt-1 block font-mono text-muted-foreground">
                    {money(goldGram * (k.purity / 1000))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card-surface p-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-emerald-600 dark:text-emerald-400 font-semibold">
              {t("nisab.silver")}
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              {SILVER_NISAB_G} {t("grams")}
            </span>
          </div>
          <p className="num mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {money(silverNisab)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {money(silverGram)} / {t("grams")}
          </p>

          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Scale className="size-4" />
              <span>{t("home.lower")}</span>
            </div>
            <p className="num mt-1 text-lg font-bold text-foreground">{money(lowerNisab)}</p>
            <p className="mt-1 text-[0.75rem] text-muted-foreground">{t("ratio.note")}</p>
          </div>
        </section>
      </div>

      {/* Official Sharia Authority & Ruling Card */}
      <section className="card-surface mt-8 p-6" aria-labelledby="official-title">
        <div className="flex items-center gap-2.5 border-b border-border pb-4">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-5" />
          </div>
          <div>
            <h2 id="official-title" className="text-base font-semibold text-foreground">
              {lang === "ar" ? "المرجع الإفتائي والجهة الشرعية" : "Official Fatwa & Authority"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? fatwa.authorityAr : fatwa.authorityEn}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {lang === "ar" ? "الفتوى والضابط المعتمد" : "Adopted Sharia Standard"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {lang === "ar" ? fatwa.rulingAr : fatwa.rulingEn}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              💡 {lang === "ar" ? fatwa.notesAr : fatwa.notesEn}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              {lang === "ar" ? "مصارف ودفع الزكاة الموثوقة" : "Verified Zakat Channels"}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {portal
                ? lang === "ar"
                  ? portal.descriptionAr
                  : portal.descriptionEn
                : lang === "ar"
                  ? "يُرجى إخراج الزكاة إلى الجهات الخيرية المرخصة شرعياً أو المستحقين المباشرين."
                  : "Distribute your zakat via officially licensed national charity funds."}
            </p>
            {(portal?.url || fatwa.portalUrl) && (
              <a
                href={portal?.url ?? fatwa.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <span>
                  {portal
                    ? lang === "ar"
                      ? portal.nameAr
                      : portal.nameEn
                    : lang === "ar"
                      ? fatwa.portalNameAr
                      : "Official Portal"}
                </span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Community Price Verification & Visitor Endorsement Hub */}
      <CountryVerificationSection
        country={country}
        lang={lang}
        spotGoldGram={goldGram}
        spotSilverGram={silverGram}
        spotGoldNisab={goldNisab}
        spotSilverNisab={silverNisab}
      />

      {/* Quick Calculator in this Country's Currency */}
      <section className="card-surface mt-8 p-6">
        <h2 className="text-base font-semibold text-foreground">
          {lang === "ar"
            ? `احسب زكاتك الآن بـ (${country.currency})`
            : `Calculate your zakat in (${country.currency})`}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {lang === "ar"
            ? "أدخل إجمالي أموالك ومدخراتك وسنحسب لك ما إذا بلغت النصاب ومقدار الزكاة المستحقة فوراً."
            : "Enter your total zakatable wealth to see if it reaches the nisab and the amount due."}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="text-xs text-muted-foreground">
              {t("calc.cash")} ({country.currency}):
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0.00"
              className="num mt-1 w-full rounded-xl border border-input bg-card px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring font-mono"
            />
          </label>

          <div className="rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm">
            <span className="block text-xs text-muted-foreground">{t("calc.due")}:</span>
            <span className="num font-mono text-lg font-bold text-primary">{money(zakatDue)}</span>
          </div>
        </div>

        {cashNum > 0 && (
          <div className="mt-3 text-xs">
            {isDue ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {t("calc.above")} ({money(cashNum)} ≥ {money(lowerNisab)})
              </span>
            ) : (
              <span className="text-muted-foreground">
                — {t("calc.below")} (أقل من النصاب الأدنى: {money(lowerNisab)})
              </span>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <Link to="/calculator" className="text-primary hover:underline font-medium">
            {lang === "ar"
              ? "فتح حاسبة الزكاة التفصيلية (ذهب، فضة، تجارة، ديون) ←"
              : "Open detailed calculator (gold, trade, debts) →"}
          </Link>
        </div>
      </section>

      {/* Historical & Chronology Links */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/chronology"
          className="card-surface p-5 transition-colors hover:border-primary/50"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              {lang === "ar"
                ? "مرجع النصاب التاريخي (من عام 2 هـ - فرض الزكاة)"
                : "Historical Chronology (from 2 AH - Institution of Zakat)"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "ar"
              ? "استعرض قيمة نصاب الذهب والفضة عبر كل سنوات الهجرة منذ فرض الزكاة في 2 هـ وحتى 1448 هـ."
              : "Explore the zakat nisab across all Islamic eras from 2 AH to 1448 AH."}
          </p>
        </Link>

        <Link to="/ledger" className="card-surface p-5 transition-colors hover:border-primary/50">
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-emerald-500" />
            <h3 className="font-semibold text-foreground">
              {lang === "ar" ? "سجل الأعوام والسنوات السابقة" : "Multi-Year Zakat Ledger"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {lang === "ar"
              ? "احسب ووثق زكاة السنوات الماضية التي لم تؤدها بنصاب كل عام بدقة شرعية ومحاسبية."
              : "Calculate and record unpaid zakat from prior years using historical thresholds."}
          </p>
        </Link>
      </section>
    </Page>
  );
}
