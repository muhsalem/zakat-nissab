import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  RotateCcw,
  Printer,
  BookmarkPlus,
  Building2,
  ExternalLink,
  Info,
  Calendar,
  CheckCircle2,
  HelpCircle,
  History,
} from "lucide-react";

import { Field, Page } from "@/components/site/Page";
import { CountryPicker } from "@/components/site/Shell";
import { StateNote, useNisab } from "@/components/site/Prices";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { KARATS } from "@/lib/nisab";
import { upsertLedgerRecord, type ZakatYearRecord } from "@/lib/ledger";
import { getPortalsForCountry } from "@/lib/official-portals";
import { Reminders } from "@/components/site/Reminders";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "حاسبة الزكاة الشرعية المعيارية · نِصاب" },
      {
        name: "description",
        content:
          "احسب زكاتك وفق معايير المحاسبة والتدقيق الشرعي (AAOIFI) على النقد والأسهم والذهب والديون، مع خيار الحول القمري والشمسي.",
      },
      { property: "og:title", content: "حاسبة الزكاة الشرعية المعيارية · نِصاب" },
      {
        property: "og:description",
        content:
          "حاسبة زكاة دقيقة بالعملة المحلية مع تفصيل الأسهم والديون والحول الهجري والميلادي والترحيل لسجل الأعوام.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calculator,
});

const num = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);

function Calculator() {
  const { t, currency, country } = useI18n();
  const { values, money, isLoading, isError, refetch } = useNisab();

  // Basic Assets
  const [cash, setCash] = useState("");
  const [business, setBusiness] = useState("");
  const [tradingStocks, setTradingStocks] = useState("");
  const [investmentStocks, setInvestmentStocks] = useState("");
  const [receivables, setReceivables] = useState("");
  const [currentDebts, setCurrentDebts] = useState("");

  // Metals
  const [goldG, setGoldG] = useState("");
  const [karat, setKarat] = useState(21);
  const [localGoldPremium, setLocalGoldPremium] = useState("0"); // % margin/spread
  const [silverG, setSilverG] = useState("");
  const [standard, setStandard] = useState<"silver" | "gold">("silver");

  // Fiqh & Calendar settings
  const [calendarType, setCalendarType] = useState<"hijri" | "gregorian">("hijri");
  const zakatRate = calendarType === "hijri" ? 0.025 : 0.02577;

  // Feedback states
  const [savedToLedger, setSavedToLedger] = useState(false);

  // Calculations
  const purity = KARATS.find((k) => k.k === karat)?.purity ?? 1;
  const premiumMultiplier = 1 + num(localGoldPremium) / 100;
  const goldPricePerGram = values ? values.goldGram * premiumMultiplier : 0;
  const goldValue = values ? num(goldG) * goldPricePerGram * purity : 0;
  const silverValue = values ? num(silverG) * values.silverGram : 0;
  const metals = goldValue + silverValue;

  // Long-term investment shares: according to AAOIFI standard, only current zakatable assets are taxed (~10% average proxy if breakdown unavailable)
  const taxableInvestmentStocks = num(investmentStocks) * 0.1;

  const totalAssets =
    num(cash) +
    num(business) +
    num(tradingStocks) +
    taxableInvestmentStocks +
    num(receivables) +
    metals;

  // Deduct current short-term debts only
  const net = Math.max(0, totalAssets - num(currentDebts));

  const nisab = values ? (standard === "silver" ? values.silver : values.gold) : 0;
  const due = net >= nisab ? net * zakatRate : 0;
  const above = Boolean(values) && net >= nisab && net > 0;

  const reset = () => {
    setCash("");
    setBusiness("");
    setTradingStocks("");
    setInvestmentStocks("");
    setReceivables("");
    setCurrentDebts("");
    setGoldG("");
    setSilverG("");
    setLocalGoldPremium("0");
    setSavedToLedger(false);
  };

  const saveToLedgerHandler = () => {
    if (!values) return;
    const currentYear = calendarType === "hijri" ? 1448 : new Date().getFullYear();
    const newRecord: ZakatYearRecord = {
      id: `calc-import-${Date.now()}`,
      yearLabel: calendarType === "hijri" ? `${currentYear} هـ` : `${currentYear} م`,
      yearType: calendarType,
      yearNumber: currentYear,
      country,
      currency,
      nisabStandard: standard,
      nisabThreshold: nisab,
      netWealth: net,
      zakatRate,
      zakatDue: due,
      zakatPaid: 0,
      status: due > 0 ? "due" : "exempt",
      paidDate: new Date().toISOString().split("T")[0],
      notes: `تم الترحيل من الحاسبة الشرعية · معيار نصاب ${standard === "silver" ? "الفضة" : "الذهب"}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    upsertLedgerRecord(newRecord);
    setSavedToLedger(true);
    setTimeout(() => setSavedToLedger(false), 4000);
  };

  const officialPortals = getPortalsForCountry(country);

  return (
    <Page eyebrow="CALCULATOR" title={t("calc.title")} sub={t("calc.sub")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <CountryPicker />

        {/* Calendar Switcher */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1 text-xs">
          <Calendar className="size-4 text-muted-foreground ms-2" />
          <span className="text-muted-foreground">نوع الحول:</span>
          <button
            type="button"
            onClick={() => setCalendarType("hijri")}
            className={`rounded-lg px-3 py-1 font-medium transition-colors ${
              calendarType === "hijri"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            قمري هجري (٢٫٥٪)
          </button>
          <button
            type="button"
            onClick={() => setCalendarType("gregorian")}
            className={`rounded-lg px-3 py-1 font-medium transition-colors ${
              calendarType === "gregorian"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            شمسي ميلادي (٢٫٥٧٧٪)
          </button>
        </div>
      </div>

      {(isLoading || isError) && (
        <div className="mb-6">
          <StateNote isLoading={isLoading} isError={isError} refetch={refetch} />
        </div>
      )}

      {/* Link to Historical Years Zakat Calculator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-3.5 text-xs text-foreground">
        <div className="flex items-center gap-2.5">
          <History className="size-4 text-accent shrink-0" />
          <span>
            هل ترغب بحساب زكاة أعوام ماضية؟ احسبها بالأنصبة الرسمية المعتمدة لكل عام سابق لتبرئة
            الذمة.
          </span>
        </div>
        <Link
          to="/history"
          className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
        >
          الانتقال لحاسبة زكاة السنوات السابقة بأنصبتها التاريخية ←
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-surface space-y-6 p-6 sm:p-8">
          {/* Section 1: Cash & Liquid Wealth */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent" />
              الأموال النقدية والسيولة البنكية
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("calc.cash")} value={cash} onChange={setCash} suffix={currency} />
              <Field
                label={t("calc.business")}
                value={business}
                onChange={setBusiness}
                suffix={currency}
              />
            </div>
          </div>

          {/* Section 2: Stocks & Investments */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent" />
                الأسهم والاستثمارات والأصول المالية
              </h3>
              <span className="text-[0.7rem] text-muted-foreground">
                معيار الأيوفي الشرعي رقم (9)
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field
                  label="أسهم المضاربة والتداول السريع"
                  value={tradingStocks}
                  onChange={setTradingStocks}
                  suffix={currency}
                />
                <p className="mt-1 text-[0.75rem] text-muted-foreground">
                  تُقوّم بالقيمة السوقية كاملة يوم الحول لأنها عروض تجارة.
                </p>
              </div>

              <div>
                <Field
                  label="أسهم الاستثمار طويل الأجل (صناديق/ريع)"
                  value={investmentStocks}
                  onChange={setInvestmentStocks}
                  suffix={currency}
                />
                <p className="mt-1 text-[0.75rem] text-muted-foreground">
                  تُحسب زكاة الأصول الزكوية النقدية المتداولة فقط (مقدّرة بنحو ١٠٪ كمتوسط).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Debts & Receivables */}
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent" />
              الديون المرجوة والديون المستحقة
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Field
                  label="ديون لك عند الغير (مرجوة السداد)"
                  value={receivables}
                  onChange={setReceivables}
                  suffix={currency}
                />
                <p className="mt-1 text-[0.75rem] text-muted-foreground">
                  تُضاف إن كان المدين مقتدراً ومقراً بالدين.
                </p>
              </div>

              <div>
                <Field
                  label="ديون حالّة عليك واجبة السداد هذا الحول"
                  value={currentDebts}
                  onChange={setCurrentDebts}
                  suffix={currency}
                />
                <p className="mt-1 text-[0.75rem] text-amber-700 dark:text-amber-400">
                  تُخصم الأقساط الحالية فقط، ولا يُخصم أصل التمويل طويل الأجل.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Gold & Silver */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent" />
                الذهب والفضة (السبائك والادخار)
              </h3>
              <span className="text-[0.7rem] text-muted-foreground">
                حلي الزينة الشخصي معفى عند الجمهور
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label={t("calc.goldWeight")}
                value={goldG}
                onChange={setGoldG}
                suffix={t("grams")}
              />

              <label className="block">
                <span className="text-sm text-muted-foreground">{t("calc.karat")}</span>
                <select
                  value={karat}
                  onChange={(e) => setKarat(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {KARATS.map((k) => (
                    <option key={k.k} value={k.k}>
                      {k.k}K ({Math.round(k.purity * 1000)} سهم)
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <Field
                  label="هامش السوق المحلي/المصنعية"
                  value={localGoldPremium}
                  onChange={setLocalGoldPremium}
                  suffix="%"
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label={t("calc.silverWeight")}
                  value={silverG}
                  onChange={setSilverG}
                  suffix={t("grams")}
                />
              </div>

              <label className="block">
                <span className="text-sm text-muted-foreground">{t("calc.standard")}</span>
                <select
                  value={standard}
                  onChange={(e) => setStandard(e.target.value as "silver" | "gold")}
                  className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="silver">{t("nisab.silver")} (الأحظ للفقراء)</option>
                  <option value="gold">{t("nisab.gold")} (٨٥ جم)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button onClick={reset} variant="outline" size="sm">
              <RotateCcw className="size-4 me-1.5" />
              {t("calc.reset")}
            </Button>

            <Button onClick={saveToLedgerHandler} variant="secondary" size="sm" disabled={!values}>
              {savedToLedger ? (
                <>
                  <CheckCircle2 className="size-4 me-1.5 text-emerald-600" />
                  تم التوثيق في سجل الأعوام!
                </>
              ) : (
                <>
                  <BookmarkPlus className="size-4 me-1.5" />
                  ترحيل إلى سجل الأعوام
                </>
              )}
            </Button>

            <Button onClick={() => window.print()} variant="ghost" size="sm" className="ms-auto">
              <Printer className="size-4 me-1.5" />
              طباعة كشف الحساب
            </Button>
          </div>
        </div>

        {/* Calculation Summary Sidebar */}
        <div className="space-y-6">
          <aside className="card-surface p-6 lg:sticky lg:top-24 border border-border">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-muted-foreground">{t("calc.summary")}</p>
              <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                {calendarType === "hijri" ? "حول قمري ٢٫٥٪" : "حول شمسي ٢٫٥٧٧٪"}
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">قيمة الذهب والفضة المحسوبة</dt>
                <dd className="num text-foreground">{money(metals)}</dd>
              </div>

              <div className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">إجمالي الموجودات الزكوية</dt>
                <dd className="num text-foreground">{money(totalAssets)}</dd>
              </div>

              <div className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">الديون المخصومة (الحالة فقط)</dt>
                <dd className="num text-amber-700 dark:text-amber-400">
                  - {money(num(currentDebts))}
                </dd>
              </div>

              <div className="flex justify-between gap-3 border-b border-border/60 pb-2 font-medium">
                <dt className="text-foreground">{t("calc.netWealth")}</dt>
                <dd className="num text-foreground">{money(net)}</dd>
              </div>

              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                <dt>
                  {t("calc.nisabValue")} ({standard === "silver" ? "فضة" : "ذهب"})
                </dt>
                <dd className="num">{money(nisab)}</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
              <div className="flex items-center justify-between text-xs opacity-80">
                <span>{t("calc.due")}</span>
                <span>النسبة: {calendarType === "hijri" ? "٢٫٥٪" : "٢٫٥٧٧٪"}</span>
              </div>
              <p className="num mt-2 text-3xl sm:text-4xl font-bold">{money(due)}</p>
              <p className="mt-2 text-xs opacity-90">
                {above
                  ? "بلغ وعاؤك النصاب وحال عليه الحول؛ فالزكاة واجبة في ذمتك."
                  : "أموالك دون النصاب الشرعي، ولا زكاة واجبة عليك."}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
              <Link to="/ledger" className="hover:underline flex items-center gap-1 text-primary">
                <Building2 className="size-3.5" />
                سجل الزكاة متعدد الأعوام
              </Link>
              <Link
                to="/chronology"
                className="hover:underline flex items-center gap-1 text-accent"
              >
                <Calendar className="size-3.5" />
                سنوات الهجرة (2 - 1448 هـ)
              </Link>
            </div>
          </aside>

          {/* Official Portals Box */}
          <div className="card-surface p-5 border border-accent/30 bg-gradient-to-br from-card to-secondary/30">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-4 text-accent" />
              <h4 className="text-sm font-semibold text-foreground">
                منصات ومصارف إخراج الزكاة المعتمدة
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              قنوات رسمية موثوقة في بلدك لتوصيل زكاتك مباشرة إلى مستحقيها الشرعيين:
            </p>

            <div className="space-y-2.5">
              {officialPortals.map((portal) => (
                <a
                  key={portal.id}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs text-foreground transition-all hover:border-accent hover:bg-secondary/40"
                >
                  <div>
                    <strong className="block font-medium text-foreground">{portal.nameAr}</strong>
                    <span className="text-[0.7rem] text-muted-foreground line-clamp-1">
                      {portal.descriptionAr}
                    </span>
                  </div>
                  <ExternalLink className="size-3.5 ms-2 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Reminders />
    </Page>
  );
}
