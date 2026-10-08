import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Check,
  Compass,
  ExternalLink,
  Globe2,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Page } from "@/components/site/Page";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, Country, countryName, flagOf } from "@/lib/countries";
import { usePrices } from "@/lib/use-prices";
import {
  GOLD_NISAB_G,
  SILVER_NISAB_G,
  formatMoney,
  formatNumber,
  goldNisabValue,
  silverNisabValue,
} from "@/lib/nisab";
import { getOfficialFatwa } from "@/lib/official-nisab";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "مقارنة نصاب الزكاة بين الدول · نِصاب" },
      {
        name: "description",
        content:
          "مقارنة حية لقيمة نصاب الذهب والفضة في جميع الدول العربية والإسلامية والعالمية بالعملات المحلية وبالدولار الموحد.",
      },
      { property: "og:title", content: "مقارنة نصاب الزكاة بين الدول · نِصاب" },
      {
        property: "og:description",
        content:
          "جدول تفاعلي لمقارنة أنصبة الزكاة في أكثر من 40 دولة، مع بيان الجهات الإفتائية المعتمدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Compare,
});

type CurrencyMode = "local" | "usd";
type RegionFilter = "all" | "arab" | "muslim" | "other";

const ARAB_CODES = new Set([
  "SA",
  "EG",
  "AE",
  "KW",
  "QA",
  "OM",
  "BH",
  "JO",
  "PS",
  "LB",
  "IQ",
  "SY",
  "YE",
  "SD",
  "LY",
  "TN",
  "DZ",
  "MA",
  "MR",
  "SO",
  "DJ",
  "KM",
]);

function Compare() {
  const { t, lang, setCountry } = useI18n();
  const { data: base, isLoading } = usePrices();

  const [query, setQuery] = useState("");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("local");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [selectedCodes, setSelectedCodes] = useState<string[]>(["SA", "EG", "AE", "KW", "JO"]);

  const goldUsdOz = base?.goldUsdOz ?? 2800;
  const silverUsdOz = base?.silverUsdOz ?? 32;

  // Base USD values
  const goldNisabUsd = goldNisabValue(goldUsdOz, 1);
  const silverNisabUsd = silverNisabValue(silverUsdOz, 1);
  const lowerNisabUsd = Math.min(goldNisabUsd, silverNisabUsd);
  const ratio = goldUsdOz / silverUsdOz;

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter((c) => {
      // Region filter
      if (regionFilter === "arab" && !ARAB_CODES.has(c.code)) return false;
      if (regionFilter === "muslim" && !c.muslim) return false;
      if (regionFilter === "other" && c.muslim) return false;

      // Text query
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const name = countryName(c, lang).toLowerCase();
      return (
        name.includes(q) || c.code.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q)
      );
    });
  }, [regionFilter, query, lang]);

  const toggleSelect = (code: string) => {
    if (selectedCodes.includes(code)) {
      if (selectedCodes.length > 1) {
        setSelectedCodes(selectedCodes.filter((c) => c !== code));
      }
    } else {
      if (selectedCodes.length < 6) {
        setSelectedCodes([...selectedCodes, code]);
      }
    }
  };

  return (
    <Page eyebrow={t("brand.tagline")} title={t("compare.title")} sub={t("compare.sub")}>
      {/* Global ratio & benchmark stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="eyebrow text-muted-foreground">{t("nisab.gold")} (85g USD)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground">
            ${formatNumber(Math.round(goldNisabUsd), 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ${(goldUsdOz / 31.1034768).toFixed(2)} / {t("grams")}
          </p>
        </div>

        <div className="card-surface p-5">
          <p className="eyebrow text-muted-foreground">{t("nisab.silver")} (595g USD)</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${formatNumber(Math.round(silverNisabUsd), 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ${(silverUsdOz / 31.1034768).toFixed(2)} / {t("grams")}
          </p>
        </div>

        <div className="card-surface p-5">
          <p className="eyebrow text-muted-foreground">{t("ratio.label")}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-primary">{ratio.toFixed(1)} : 1</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("ratio.note")}</p>
        </div>
      </section>

      {/* Side-by-side scorecard of selected countries */}
      <section className="card-surface mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("compare.selected")} ({selectedCodes.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              {lang === "ar"
                ? "انقر على أي دولة في الجدول أدناه لإضافتها أو إزالتها من بطاقة المقارنة (بحد أقصى 6 دول)."
                : "Click any country in the table below to pin or unpin it (up to 6 countries)."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
            >
              <Users className="size-3.5 text-emerald-600" />
              <span>{lang === "ar" ? "توثيق الزوار الميداني" : "Crowdsourced Verifications"}</span>
            </Link>
            <span className="text-xs text-muted-foreground">{t("compare.currencyMode")}:</span>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
              <button
                onClick={() => setCurrencyMode("local")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  currencyMode === "local"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("compare.local")}
              </button>
              <button
                onClick={() => setCurrencyMode("usd")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  currencyMode === "usd"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("compare.usd")}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedCodes.map((code) => {
            const country = COUNTRIES.find((c) => c.code === code);
            if (!country) return null;
            const rate = base?.rates?.[country.currency] ?? 1;
            const fatwa = getOfficialFatwa(country.code);

            const goldVal = currencyMode === "usd" ? goldNisabUsd : goldNisabValue(goldUsdOz, rate);
            const silverVal =
              currencyMode === "usd" ? silverNisabUsd : silverNisabValue(silverUsdOz, rate);
            const lowerVal = Math.min(goldVal, silverVal);

            const formatVal = (v: number) =>
              currencyMode === "usd"
                ? `$${formatNumber(Math.round(v), 0)}`
                : formatMoney(v, country.currency, lang);

            return (
              <div
                key={country.code}
                className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{flagOf(country.code)}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {countryName(country, lang)}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {country.code} · {country.currency}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/country/$code"
                      params={{ code: country.code.toLowerCase() }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title={lang === "ar" ? "الصفحة المخصصة" : "Dedicated page"}
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </div>

                  <div className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2.5">
                      <span className="text-xs text-muted-foreground">{t("nisab.gold")} (85g)</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatVal(goldVal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-2.5">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        {t("nisab.silver")} (595g)
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatVal(silverVal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                      <span className="text-muted-foreground">{t("compare.lower")}</span>
                      <span className="font-mono font-bold text-primary">
                        {formatVal(lowerVal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {lang === "ar" ? fatwa.authorityAr : fatwa.authorityEn}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.7rem] leading-relaxed">
                      {lang === "ar" ? fatwa.rulingAr : fatwa.rulingEn}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                  <button
                    onClick={() => setCountry(country.code)}
                    className="text-primary hover:underline"
                  >
                    {lang === "ar" ? "تعيين كبلدي الافتراضي" : "Set as my country"}
                  </button>
                  <Link
                    to="/country/$code"
                    params={{ code: country.code.toLowerCase() }}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {lang === "ar" ? "التفاصيل والفتوى ←" : "View details →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filter and search toolbar */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", ar: "جميع الدول", en: "All Countries" },
                { id: "arab", ar: "الدول العربية", en: "Arab Countries" },
                { id: "muslim", ar: "العالم الإسلامي", en: "Muslim World" },
                { id: "other", ar: "بقية الدول", en: "Other Countries" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setRegionFilter(f.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  regionFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {lang === "ar" ? f.ar : f.en}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === "ar" ? "ابحث باسم الدولة أو العملة..." : "Search country or currency..."
              }
              className="w-full rounded-xl border border-input bg-card py-2 pe-3 ps-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Complete Directory Table */}
        <div className="card-surface mt-4 overflow-x-auto p-4 sm:p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-3 text-start">{t("compare.country")}</th>
                <th className="pb-3 text-start">{t("hero.currency")}</th>
                <th className="pb-3 text-end">{t("nisab.gold")} (85g)</th>
                <th className="pb-3 text-end">{t("nisab.silver")} (595g)</th>
                <th className="pb-3 text-end">{t("compare.lower")}</th>
                <th className="pb-3 text-start ps-4">
                  {lang === "ar" ? "الجهة الشرعية" : "Authority"}
                </th>
                <th className="pb-3 text-center">{lang === "ar" ? "تثبيت" : "Pin"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCountries.map((c) => {
                const rate = base?.rates?.[c.currency] ?? 1;
                const fatwa = getOfficialFatwa(c.code);
                const isSelected = selectedCodes.includes(c.code);

                const goldVal =
                  currencyMode === "usd" ? goldNisabUsd : goldNisabValue(goldUsdOz, rate);
                const silverVal =
                  currencyMode === "usd" ? silverNisabUsd : silverNisabValue(silverUsdOz, rate);
                const lowerVal = Math.min(goldVal, silverVal);

                const formatVal = (v: number) =>
                  currencyMode === "usd"
                    ? `$${formatNumber(Math.round(v), 0)}`
                    : formatMoney(v, c.currency, lang);

                return (
                  <tr key={c.code} className="group transition-colors hover:bg-secondary/40">
                    <td className="py-3 font-medium text-foreground">
                      <Link
                        to="/country/$code"
                        params={{ code: c.code.toLowerCase() }}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <span className="text-lg">{flagOf(c.code)}</span>
                        <span>{countryName(c, lang)}</span>
                      </Link>
                    </td>

                    <td className="py-3 font-mono text-xs text-muted-foreground">{c.currency}</td>

                    <td className="py-3 text-end font-mono text-foreground">
                      {formatVal(goldVal)}
                    </td>

                    <td className="py-3 text-end font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatVal(silverVal)}
                    </td>

                    <td className="py-3 text-end font-mono font-semibold text-primary">
                      {formatVal(lowerVal)}
                    </td>

                    <td className="py-3 ps-4 text-xs text-muted-foreground">
                      <span className="line-clamp-1">
                        {lang === "ar" ? fatwa.authorityAr : fatwa.authorityEn}
                      </span>
                    </td>

                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleSelect(c.code)}
                        className={`size-6 rounded-md text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                        title={isSelected ? "إلغاء التثبيت" : "تثبيت للمقارنة"}
                      >
                        {isSelected ? "✓" : "+"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("compare.localNote")} · {t("compare.note")}
        </p>
      </section>
    </Page>
  );
}
