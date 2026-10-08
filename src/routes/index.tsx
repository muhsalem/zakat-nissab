import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Calculator,
  ChartNoAxesCombined,
  BookOpenText,
  Compass,
  History,
  Globe2,
  Scale,
  Code2,
  Users,
} from "lucide-react";

import { CountryPicker } from "@/components/site/Shell";
import { NisabAlert, StateNote, UpdateMeta, useNisab } from "@/components/site/Prices";
import { useI18n } from "@/lib/i18n";
import { GOLD_NISAB_G, KARATS, SILVER_NISAB_G, formatNumber } from "@/lib/nisab";
import { ShareDailyNisab } from "@/components/site/ShareDailyNisab";
import { Reminders } from "@/components/site/Reminders";
import { InvitationCard } from "@/components/site/InvitationCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نِصاب · قيمة نصاب الذهب والفضّة اليوم ومشاركتها" },
      {
        name: "description",
        content:
          "احسب نصاب الزكاة اليوم بأسعار الذهب والفضّة الحيّة، وشاركه حسب دولتك ومدينتك، مع سجل زكاة متعدد الأعوام.",
      },
      { property: "og:title", content: "نِصاب · قيمة نصاب الذهب والفضّة اليوم ومشاركتها" },
      {
        property: "og:description",
        content:
          "نصاب الذهب ٨٥ جراماً والفضّة ٥٩٥ جراماً، مع إرسال ومشاركة نصاب اليوم وسجل الأعوام.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const TYPES = ["cash", "gold", "trade", "crops", "livestock", "fitr"] as const;

function Home() {
  const { t, setCountry, lang } = useI18n();
  const { values, money, isLoading, isError, refetch, currency } = useNisab();

  // Read URL query params on mount for country sharing
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const countryParam = params.get("country");
    if (countryParam) {
      setCountry(countryParam.toUpperCase());
    }
  }, [setCountry]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <NisabAlert value={values?.lower} />

      <section className="rise">
        <p className="eyebrow text-muted-foreground">{t("hero.eyebrow")}</p>
        <h1 className="mt-2 max-w-3xl text-3xl leading-tight text-foreground sm:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("hero.sub")}</p>
        <div className="mt-5">
          <CountryPicker />
        </div>

        {/* Community Verification Callout */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-950 dark:text-emerald-50">
          <div className="flex items-center gap-2.5">
            <Users className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">
              {lang === "ar"
                ? "مشاركة الزائرين مفعلة: ساهم في تأكيد ومصادقة أسعار الذهب والفضة في أسواق بلدك اليوم لضبط النصاب بدقة شرعية."
                : "Crowdsourced verification active: Validate or submit today's local gold and silver prices for your country."}
            </span>
          </div>
          <Link
            to="/verify"
            className="font-bold underline underline-offset-4 hover:opacity-85 text-emerald-700 dark:text-emerald-300 shrink-0"
          >
            {lang === "ar" ? "منصة توثيق الزوار ←" : "Community Hub →"}
          </Link>
        </div>
      </section>

      {(isLoading || isError) && (
        <div className="mt-8">
          <StateNote isLoading={isLoading} isError={isError} refetch={refetch} />
        </div>
      )}

      {values && (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                label: t("nisab.gold"),
                metal: t("gold"),
                grams: GOLD_NISAB_G,
                total: values.gold,
                gram: values.goldGram,
                lower: values.gold <= values.silver,
              },
              {
                label: t("nisab.silver"),
                metal: t("silver"),
                grams: SILVER_NISAB_G,
                total: values.silver,
                gram: values.silverGram,
                lower: values.silver < values.gold,
              },
            ].map((c) => (
              <article key={c.label} className="card-surface rise p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-muted-foreground">{c.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="num">{c.grams}</span> {t("grams")} · {c.metal}
                    </p>
                  </div>
                  {c.lower && (
                    <span className="rounded-full bg-accent/25 px-3 py-1 text-xs text-foreground">
                      {t("home.lower")}
                    </span>
                  )}
                </div>
                <p className="num mt-6 text-3xl text-foreground sm:text-4xl">{money(c.total)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("perGram")}: <span className="num">{money(c.gram)}</span>
                </p>
              </article>
            ))}
          </section>

          {/* Share Daily Nisab Component */}
          <ShareDailyNisab values={values} money={money} />

          <section className="card-surface mt-6 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("ratio.label")}</p>
              <p className="num text-xl text-foreground">{formatNumber(values.ratio, 1)} : 1</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("ratio.note")}</p>
          </section>

          <section className="card-surface mt-4 overflow-x-auto p-6">
            <h2 className="text-xl text-foreground">{t("karat.title")}</h2>
            <table className="mt-4 w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-start">
                  <th className="py-2 text-start font-normal">{t("karat.title")}</th>
                  <th className="py-2 text-start font-normal">{t("karat.purity")}</th>
                  <th className="py-2 text-start font-normal">{t("karat.price")}</th>
                </tr>
              </thead>
              <tbody>
                {KARATS.map((k) => (
                  <tr key={k.k} className="border-t border-border">
                    <td className="num py-2.5 text-foreground">{k.k}K</td>
                    <td className="num py-2.5 text-muted-foreground">
                      {(k.purity * 100).toFixed(1)}%
                    </td>
                    <td className="num py-2.5 text-foreground">
                      {money(values.goldGram * k.purity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("common.source")} · {currency}
            </p>
          </section>

          <UpdateMeta />
          <Reminders />
        </>
      )}

      {/* Action CTA Grid */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/calculator"
          className="flex min-h-20 items-center gap-4 rounded-xl bg-primary px-5 py-4 text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
        >
          <Calculator className="size-6 shrink-0" aria-hidden="true" />
          <span>
            <strong className="block font-medium">{t("home.cta.calc")}</strong>
            <small className="mt-1 block opacity-75">{t("home.cta.calcSub")}</small>
          </span>
        </Link>

        <Link
          to="/compare"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-primary/40 bg-card px-5 py-4 text-foreground transition-all hover:bg-secondary shadow-sm"
        >
          <Globe2 className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="block font-medium">{t("compare.title")}</strong>
            <small className="mt-1 block text-muted-foreground">
              {lang === "ar"
                ? "مقارنة حية لجميع الدول والعملات"
                : "Compare all countries & currencies"}
            </small>
          </span>
        </Link>

        <Link
          to="/verify"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-500/10 px-5 py-4 text-foreground transition-all hover:bg-secondary shadow-sm"
        >
          <Users
            className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>
            <strong className="block font-medium">
              {lang === "ar" ? "توثيق الزوار ومصادقة الأسعار" : "Community Price Verification"}
            </strong>
            <small className="mt-1 block text-muted-foreground">
              {lang === "ar"
                ? "تأكيد أسعار الصاغة محلياً حسب كل دولة"
                : "Validate bullion prices by country"}
            </small>
          </span>
        </Link>

        <Link
          to="/chronology"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-accent/60 bg-gradient-to-br from-card via-card to-accent/10 px-5 py-4 text-foreground transition-all hover:bg-secondary shadow-sm"
        >
          <Compass className="size-6 shrink-0 text-accent" aria-hidden="true" />
          <span>
            <strong className="block font-medium">سجل سنوات الهجرة (2 - 1448 هـ)</strong>
            <small className="mt-1 block text-muted-foreground">
              موسوعة أنصبة كافة الأعوام والعملات (بدءاً من فرض الزكاة)
            </small>
          </span>
        </Link>

        <Link
          to="/ledger"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-foreground transition-colors hover:bg-secondary"
        >
          <BookOpenText
            className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span>
            <strong className="block font-medium">سجل الزكاة متعدد الأعوام</strong>
            <small className="mt-1 block text-muted-foreground">
              توثيق وتتبع زكواتك السابقة والحالية
            </small>
          </span>
        </Link>

        <Link
          to="/developers"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-foreground transition-colors hover:bg-secondary"
        >
          <Code2 className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="block font-medium">الربط المحاسبي (ERP & API)</strong>
            <small className="mt-1 block text-muted-foreground">
              ودجت وواجهات للبرامج والمواقع
            </small>
          </span>
        </Link>

        <Link
          to="/history"
          className="flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-foreground transition-colors hover:bg-secondary"
        >
          <ChartNoAxesCombined
            className="size-6 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>
            <strong className="block font-medium">{t("home.cta.history")}</strong>
            <small className="mt-1 block text-muted-foreground">{t("home.cta.historySub")}</small>
          </span>
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl text-foreground">{t("types.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("home.types.sub")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((k) => (
            <article key={k} className="card-surface p-5">
              <h3 className="text-lg text-foreground">{t(`types.${k}.t`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`types.${k}.d`)}</p>
            </article>
          ))}
        </div>
        <Link
          to="/types"
          className="mt-5 inline-block text-sm text-foreground underline underline-offset-4"
        >
          {t("types.all")}
        </Link>
      </section>

      <section className="mt-14">
        <InvitationCard />
      </section>
    </div>
  );
}
