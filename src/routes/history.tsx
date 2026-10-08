import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Compass, ArrowRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Page } from "@/components/site/Page";
import { CountryPicker } from "@/components/site/Shell";
import { useNisab } from "@/components/site/Prices";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { GOLD_NISAB_G, SILVER_NISAB_G, TROY_OUNCE_G } from "@/lib/nisab";
import { readManualHistory, type ManualPricePoint } from "@/lib/overrides";
import { getHistory, type HistoryRange, type HistoryResponse } from "@/lib/prices.functions";
import { HistoricalYearsCalculator } from "@/components/site/HistoricalYearsCalculator";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "الأسعار التاريخية للنصاب وحساب السنوات السابقة · نِصاب" },
      {
        name: "description",
        content:
          "تتبّع قيمة نصاب الذهب والفضّة تاريخياً، مع حاسبة متخصصة لحساب زكاة السنوات السابقة بأنصبتها الرسمية المعتمدة.",
      },
      { property: "og:title", content: "الأسعار التاريخية للنصاب وحساب السنوات السابقة · نِصاب" },
      {
        property: "og:description",
        content: "رسوم بيانية وحاسبة تبرئة الذمة لزكوات الأعوام السابقة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

const RANGES: HistoryRange[] = ["1mo", "6mo", "1y", "5y", "10y", "20y", "50y"];

function History() {
  const { t, lang, currency } = useI18n();
  const { money } = useNisab();
  const [range, setRange] = useState<HistoryRange>("1y");
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const [manualHistory, setManualHistory] = useState<ManualPricePoint[]>([]);

  useEffect(() => {
    const sync = () => setManualHistory(readManualHistory());
    sync();
    window.addEventListener("nisab-overrides", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("nisab-overrides", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const fetchHistory = useServerFn(getHistory);
  const { data, isLoading, isError, refetch } = useQuery<HistoryResponse>({
    queryKey: ["history", range, currency],
    queryFn: () => fetchHistory({ data: { range, currency } }),
    staleTime: 60 * 60 * 1000,
  });

  const grams = metal === "gold" ? GOLD_NISAB_G : SILVER_NISAB_G;

  const series = useMemo(
    () =>
      [
        ...(data?.points ?? []).map((p) => ({
          t: p.t,
          value: ((metal === "gold" ? p.gold : p.silver) / TROY_OUNCE_G) * p.rate * grams,
          manual: false,
        })),
        ...manualHistory
          .filter((p) => p.currency === currency)
          .map((p) => ({
            t: p.t,
            value:
              ((metal === "gold" ? p.goldUsdOz : p.silverUsdOz) / TROY_OUNCE_G) * p.rate * grams,
            manual: true,
          })),
      ].sort((a, b) => a.t - b.t),
    [data, manualHistory, currency, metal, grams],
  );

  const stats = useMemo(() => {
    if (series.length === 0) return null;
    const vals = series.map((s) => s.value);
    const first = vals[0]!;
    const last = vals[vals.length - 1]!;
    return {
      high: Math.max(...vals),
      low: Math.min(...vals),
      change: ((last - first) / first) * 100,
      last,
    };
  }, [series]);

  const fmtTick = (v: number) =>
    new Intl.DateTimeFormat(lang === "ar" ? "en" : lang, {
      month: "short",
      year: "2-digit",
    }).format(new Date(v));

  return (
    <Page eyebrow="HISTORY" title={t("history.title")} sub={t("history.sub")}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <CountryPicker />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("history.pick")}</span>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value as "gold" | "silver")}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="gold">{t("gold")}</option>
            <option value="silver">{t("silver")}</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-1" aria-label={t("history.period")}>
          {RANGES.map((r) => (
            <Button
              key={r}
              onClick={() => setRange(r)}
              size="sm"
              variant={r === range ? "default" : "outline"}
            >
              {t(`history.range.${r}`)}
            </Button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card-surface p-4">
            <span className="eyebrow text-muted-foreground">{t("history.high")}</span>
            <p className="num mt-1 text-xl text-foreground">{money(stats.high)}</p>
          </div>
          <div className="card-surface p-4">
            <span className="eyebrow text-muted-foreground">{t("history.low")}</span>
            <p className="num mt-1 text-xl text-foreground">{money(stats.low)}</p>
          </div>
          <div className="card-surface p-4">
            <span className="eyebrow text-muted-foreground">{t("history.change")}</span>
            <p
              className={`num mt-1 text-xl ${stats.change >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}
            >
              {stats.change >= 0 ? "+" : ""}
              {stats.change.toFixed(1)}%
            </p>
          </div>
          <div className="card-surface p-4">
            <span className="eyebrow text-muted-foreground">{t("common.latest")}</span>
            <p className="num mt-1 text-xl text-foreground">{money(stats.last)}</p>
          </div>
        </div>
      )}

      <div className="card-surface p-6">
        {isLoading && (
          <div className="flex h-72 items-center justify-center text-muted-foreground">
            {t("common.loading")}
          </div>
        )}
        {isError && (
          <div className="flex h-72 flex-col items-center justify-center gap-3">
            <p className="text-muted-foreground">{t("common.error")}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {t("common.retry")}
            </Button>
          </div>
        )}
        {!isLoading && !isError && !data?.fxAvailable && (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <p className="text-foreground">{t("history.fxUnavailable")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{currency}</p>
          </div>
        )}
        {!isLoading && !isError && data?.fxAvailable && series.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">{t("history.empty")}</p>
        )}
        {!isLoading && !isError && data?.fxAvailable && series.length > 0 && (
          <div dir="ltr" className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="nisabFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tickFormatter={fmtTick}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={40}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  width={80}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v: number) =>
                    Intl.NumberFormat("en", { notation: "compact" }).format(v)
                  }
                />
                <Tooltip
                  labelFormatter={(v) => fmtTick(Number(v))}
                  formatter={(v: number) => [money(v), t("history.sub")]}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#nisabFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-2">
          <p>{t("history.note")}</p>
          {data && (
            <p>
              {t("update.source")}: {data.metalsSource} · {data.ratesSource}
            </p>
          )}
          {manualHistory.some((p) => p.currency === currency) && (
            <p className="sm:col-span-2">{t("history.manualPoint")}</p>
          )}
        </div>
      </div>

      {/* Featured Banner: 2 AH to 1448 AH Islamic Chronology Encyclopedia */}
      <section className="mt-8 rounded-2xl border border-accent/50 bg-gradient-to-br from-card via-card to-accent/10 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/20 text-accent font-bold">
              <Compass className="size-6" />
            </span>
            <div>
              <span className="eyebrow text-xs text-accent">
                الموسوعة النقدية الإسلامية الكاملة
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                سجل كافة سنوات الهجرة النبوية (من 2 هـ إلى 1448 هـ)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تصفح كل سنة سنة منذ فرضت الزكاة في السنة الثانية للهجرة حتى اليوم؛ مقادير أنصبة
                الذهب والفضة والدنانير والدراهم والقوة الشرائية بحسب الدول.
              </p>
            </div>
          </div>

          <Link
            to="/chronology"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
          >
            <span>استعراض سجل سنوات الزكاة (2 هـ - 1448 هـ)</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Historical Years Zakat Calculator */}
      <HistoricalYearsCalculator />
    </Page>
  );
}
