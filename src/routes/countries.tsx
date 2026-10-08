import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Globe2,
  Landmark,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Page } from "@/components/site/Page";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, Country, countryName, flagOf } from "@/lib/countries";
import { usePrices } from "@/lib/use-prices";
import { formatMoney, goldNisabValue, silverNisabValue } from "@/lib/nisab";
import { getOfficialFatwa } from "@/lib/official-nisab";
import { getCountryVerificationSummary } from "@/lib/community-nisab";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "دليل أنصبة الزكاة في دول العالم · نِصاب" },
      {
        name: "description",
        content:
          "دليل شامل وفوري لقيمة نصاب الزكاة بالذهب والفضة والعملات المحلية في أكثر من 40 دولة، مع الفتاوى المعتمدة ومصارف الزكاة الرسمية.",
      },
      { property: "og:title", content: "دليل أنصبة الزكاة في دول العالم · نِصاب" },
      {
        property: "og:description",
        content: "تصفح نصاب الزكاة حسب دولتك بعملتها المحلية والجهات الإفتائية الرسمية المعتمدة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CountriesDirectory,
});

function CountriesDirectory() {
  const { t, lang, setCountry } = useI18n();
  const { data: base } = usePrices();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "muslim" | "other">("all");

  const goldUsdOz = base?.goldUsdOz ?? 2800;
  const silverUsdOz = base?.silverUsdOz ?? 32;

  const filtered = useMemo(() => {
    return COUNTRIES.filter((c) => {
      if (filter === "muslim" && !c.muslim) return false;
      if (filter === "other" && c.muslim) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const name = countryName(c, lang).toLowerCase();
      return (
        name.includes(q) || c.code.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q)
      );
    });
  }, [filter, query, lang]);

  return (
    <Page
      eyebrow={t("brand.tagline")}
      title={lang === "ar" ? "دليل أنصبة الزكاة في دول العالم" : "World Countries Zakat Directory"}
      sub={
        lang === "ar"
          ? "اختر دولتك للاطلاع على نصاب الذهب والفضة اليوم بعملتك، مع الفتوى الرسمية ومصارف الزكاة المعتمدة."
          : "Select your country to view today's gold and silver nisab, official fatwa, and verified channels."
      }
    >
      {/* Top search & filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {lang === "ar" ? "جميع الدول" : "All"} ({COUNTRIES.length})
          </button>
          <button
            onClick={() => setFilter("muslim")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === "muslim"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t("country.group.muslim")}
          </button>
          <button
            onClick={() => setFilter("other")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === "other"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t("country.group.other")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/verify"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
          >
            <Users className="size-3.5 text-emerald-600" />
            <span>{lang === "ar" ? "توثيق الزوار الميداني" : "Crowdsourced Verifications"}</span>
          </Link>
          <Link
            to="/compare"
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            {t("compare.title")}
          </Link>
          <div className="relative w-full sm:w-64">
            <Search className="absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ar" ? "ابحث عن الدولة أو العملة..." : "Search country..."}
              className="w-full rounded-xl border border-input bg-card py-1.5 pe-3 ps-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Grid of Countries */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((country) => {
          const rate = base?.rates?.[country.currency] ?? 1;
          const goldVal = goldNisabValue(goldUsdOz, rate);
          const silverVal = silverNisabValue(silverUsdOz, rate);
          const lowerVal = Math.min(goldVal, silverVal);
          const fatwa = getOfficialFatwa(country.code);
          const summary = getCountryVerificationSummary(country.code);

          const money = (v: number) => formatMoney(v, country.currency, lang);

          return (
            <div
              key={country.code}
              className="card-surface flex flex-col justify-between p-5 transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{flagOf(country.code)}</span>
                    <div>
                      <Link
                        to="/country/$code"
                        params={{ code: country.code.toLowerCase() }}
                        className="font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {countryName(country, lang)}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">
                        {country.currency} · {country.code}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/country/$code"
                    params={{ code: country.code.toLowerCase() }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title={lang === "ar" ? "الصفحة المخصصة" : "View page"}
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-2">
                    <span className="text-muted-foreground">{t("nisab.gold")} (85g)</span>
                    <span className="font-mono font-medium text-foreground">{money(goldVal)}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-2">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {t("nisab.silver")} (595g)
                    </span>
                    <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {money(silverVal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-1.5 font-semibold text-primary">
                    <span>{t("home.lower")}</span>
                    <span className="font-mono">{money(lowerVal)}</span>
                  </div>
                </div>

                <div className="mt-3 text-[0.75rem] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {lang === "ar" ? fatwa.authorityAr : fatwa.authorityEn}
                  </span>
                </div>

                {/* Community Verification Indicator */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] rounded bg-secondary/60 px-2 py-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="size-3 text-emerald-600" />
                    {lang === "ar" ? "توثيق الزوار:" : "Community:"}
                  </span>
                  <Link
                    to="/country/$code"
                    params={{ code: country.code.toLowerCase() }}
                    className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {summary.totalConfirmations > 0
                      ? lang === "ar"
                        ? `${summary.totalConfirmations} تأكيد ميداني ✓`
                        : `${summary.totalConfirmations} verified ✓`
                      : lang === "ar"
                        ? "شارك بالتوثيق +"
                        : "Verify +"}
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                <button
                  onClick={() => setCountry(country.code)}
                  className="text-primary hover:underline"
                >
                  {lang === "ar" ? "تعيين كبلدي" : "Select"}
                </button>
                <Link
                  to="/country/$code"
                  params={{ code: country.code.toLowerCase() }}
                  className="font-medium text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>{lang === "ar" ? "التفاصيل والفتوى" : "Full details"}</span>
                  <ArrowLeft className="size-3 rtl:rotate-0 rotate-180" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
