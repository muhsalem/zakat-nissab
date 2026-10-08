import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Calculator, HeartHandshake } from "lucide-react";

import { LANGS, useI18n } from "@/lib/i18n";
import { COUNTRIES, countryName, flagOf } from "@/lib/countries";
import { ThemePicker } from "./ThemePicker";
import { NisabBrand } from "./NisabLogo";
import { MainNav } from "./MainNav";

export function CountryPicker({ compact = false }: { compact?: boolean }) {
  const { t, lang, country, setCountry } = useI18n();
  const muslim = COUNTRIES.filter((c) => c.muslim);
  const rest = COUNTRIES.filter((c) => !c.muslim);
  return (
    <label className="flex items-center gap-2 text-sm">
      {!compact && <span className="text-muted-foreground">{t("hero.country")}</span>}
      <select
        aria-label={t("hero.country")}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        <optgroup label="—">
          {muslim.map((c) => (
            <option key={c.code} value={c.code}>
              {flagOf(c.code)} {countryName(c, lang)} · {c.currency}
            </option>
          ))}
        </optgroup>
        <optgroup label="—">
          {rest.map((c) => (
            <option key={c.code} value={c.code}>
              {flagOf(c.code)} {countryName(c, lang)} · {c.currency}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

function LangPicker() {
  const { lang, setLang } = useI18n();
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value as typeof lang)}
      className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const isAr = lang === "ar";

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Logo with Authentic Calligraphic Branding & Shariah Scale Emblem */}
          <div className="flex items-center shrink-0">
            <NisabBrand />
          </div>

          {/* Clean Categorized Navigation */}
          <div className="flex items-center justify-center">
            <MainNav />
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Action CTA on medium+ screens */}
            <Link
              to="/calculator"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calculator className="size-3.5" />
              <span>{isAr ? "احسب زكاتك" : "Calculate"}</span>
            </Link>

            {/* Visual Identity Theme Switcher */}
            <ThemePicker />

            {/* Language Selector */}
            <LangPicker />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Master Institutional Footer */}
      <footer className="mt-20 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand & Waqf Column */}
            <div className="lg:col-span-2 space-y-4">
              <NisabBrand />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {isAr
                  ? "منصة وقفية معرفية مستقلة لحساب أنصبة الزكاة ومتابعة أسعار الذهب والفضة الحية ومحاسبة الأموال وفق الأوزان الشرعية المعتمدة."
                  : "An independent Islamic waqf reference providing live precious metal spot prices, zakat thresholds (Gold 85g / Silver 595g), and verified wealth calculators."}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                <HeartHandshake className="size-4 shrink-0" />
                <span>
                  {isAr
                    ? "وقفٌ معرفي تقني رقمي لوجه الله تعالى · صدقة جارية"
                    : "Digital Knowledge Waqf · Endowed for the public good"}
                </span>
              </div>
            </div>

            {/* Column: Services */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3">
                {isAr ? "الأنصبة والحساب" : "Calculators & Rates"}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground transition-colors">
                    {isAr ? "الأسعار والأنصبة الحية" : "Live Spot Nisab"}
                  </Link>
                </li>
                <li>
                  <Link to="/calculator" className="hover:text-foreground transition-colors">
                    {isAr ? "حاسبة الزكاة الذكية" : "Zakat Calculator"}
                  </Link>
                </li>
                <li>
                  <Link to="/compare" className="hover:text-foreground transition-colors">
                    {isAr ? "مقارنة الذهب والفضة" : "Gold vs Silver"}
                  </Link>
                </li>
                <li>
                  <Link to="/countries" className="hover:text-foreground transition-colors">
                    {isAr ? "دليل الدول والعملات" : "Country Directory"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verify"
                    className="hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <span>{isAr ? "توثيق الزوار الميداني" : "Crowdsourced Verifications"}</span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
                      {isAr ? "تشاركي" : "New"}
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column: Fiqh Encyclopedia */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3">
                {isAr ? "الموسوعة الفقهية" : "Knowledge & Fiqh"}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/types" className="hover:text-foreground transition-colors">
                    {isAr ? "أنواع الزكاة وأحكامها" : "Types of Zakat"}
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="hover:text-foreground transition-colors">
                    {isAr ? "تأصيل الصاع والمثقال" : "Classical Standards"}
                  </Link>
                </li>
                <li>
                  <Link to="/chronology" className="hover:text-foreground transition-colors">
                    {isAr ? "التسلسل التاريخي" : "Historical Archive"}
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-foreground transition-colors">
                    {isAr ? "الأسئلة الشائعة والفتاوى" : "Scholarly FAQ"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column: Tech & Waqf */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3">
                {isAr ? "التقنية والشفافية" : "Transparency & API"}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/ledger" className="hover:text-foreground transition-colors">
                    {isAr ? "سجل العمليات المباشر" : "Live Price Ledger"}
                  </Link>
                </li>
                <li>
                  <Link to="/developers" className="hover:text-foreground transition-colors">
                    {isAr ? "بوابة المطورين والـ API" : "Developers API"}
                  </Link>
                </li>
                <li>
                  <Link to="/waqf" className="hover:text-foreground transition-colors">
                    {isAr ? "الميثاق الوقفي والرؤية" : "Waqf Charter"}
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-foreground transition-colors">
                    {t("nav.admin")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>{t("footer.disclaimer")}</p>
            <p className="font-mono">ذهب ٨٥ جم · فضة ٥٩٥ جم · 85g Gold · 595g Silver</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
