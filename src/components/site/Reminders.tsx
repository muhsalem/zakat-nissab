import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarClock, Check, Sparkles, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";

export interface HawlSettings {
  startIso: string;
  lunar: boolean;
  leadDays: number;
  dismissedFor?: string;
  nisabAlerts: boolean;
}

const STORAGE_KEY = "nisab.hawl.tracker";

function defaultSettings(): HawlSettings {
  // Default to 1 year ago or empty
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return {
    startIso: d.toISOString().slice(0, 10),
    lunar: true, // 354 days
    leadDays: 14,
    dismissedFor: "",
    nisabAlerts: true,
  };
}

function loadSettings(): HawlSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

function saveSettings(s: HawlSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    window.dispatchEvent(new Event("nisab-hawl"));
  } catch (err) {
    console.debug("Failed to save hawl settings", err);
  }
}

export function Reminders() {
  const { t, lang } = useI18n();
  const [settings, setSettings] = useState<HawlSettings | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  }, []);

  const update = useCallback(
    (patch: Partial<HawlSettings>) => {
      if (!settings) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(next);
    },
    [settings],
  );

  const requestNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationStatusMsg(
        lang === "ar" ? "الإشعارات غير مدعومة في هذا المتصفح" : "Notifications not supported",
      );
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setHasNotificationPermission(true);
        setNotificationStatusMsg(
          lang === "ar" ? "تم تفعيل الإشعارات بنجاح" : "Notifications enabled",
        );
        new Notification(t("hawl.notifyTitle"), {
          body:
            lang === "ar"
              ? "سيتم تنبيهك عند اقتراب موعد حول زكاتك بإذن الله."
              : "You will receive a notification before your Hawl date.",
          icon: "/favicon.ico",
        });
      } else {
        setNotificationStatusMsg(
          lang === "ar" ? "تم رفض إذن الإشعارات" : "Notification permission denied",
        );
      }
    } catch {
      setNotificationStatusMsg(
        lang === "ar" ? "تعذر طلب الإشعارات" : "Could not request notifications",
      );
    }
  };

  if (!settings) return null;

  // Compute next due date & days remaining
  const startDate = new Date(settings.startIso);
  const daysInYear = settings.lunar ? 354 : 365;
  const now = new Date();

  // Calculate next due date
  let dueDate = new Date(startDate);
  if (!Number.isNaN(dueDate.getTime())) {
    while (dueDate.getTime() <= now.getTime()) {
      dueDate = new Date(dueDate.getTime() + daysInYear * 24 * 60 * 60 * 1000);
    }
  } else {
    dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const diffMs = dueDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isDueToday = daysLeft === 0;
  const isNear = daysLeft <= settings.leadDays;
  const dueDateKey = dueDate.toISOString().slice(0, 10);
  const isDismissed = settings.dismissedFor === dueDateKey;

  // Hijri date formatting for the due date
  const hijriFormatter = new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-u-ca-islamic-umalqura",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const gregorianFormatter = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let hijriStr = "";
  let gregStr = "";
  try {
    hijriStr = hijriFormatter.format(dueDate);
    gregStr = gregorianFormatter.format(dueDate);
  } catch {
    gregStr = dueDate.toISOString().slice(0, 10);
  }

  return (
    <section className="card-surface mt-8 p-5 sm:p-6" aria-labelledby="hawl-reminder-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <h2 id="hawl-reminder-title" className="text-base font-semibold text-foreground">
              {t("hawl.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("hawl.sub")}</p>
          </div>
        </div>

        {/* Days remaining badge */}
        <div className="flex items-center gap-2">
          {daysLeft > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("hawl.remaining").replace("{days}", String(daysLeft))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3.5" />
              {t("hawl.dueToday")}
            </span>
          )}
        </div>
      </div>

      {/* Near due or due today alert banner */}
      {isNear && !isDismissed && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <BellRing className="size-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">
                  {isDueToday
                    ? t("hawl.dueToday")
                    : t("hawl.due").replace("{days}", String(daysLeft))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {hijriStr} · {gregStr}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/calculator"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("home.cta.calc")}
              </Link>
              <button
                onClick={() => update({ dismissedFor: dueDateKey })}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("alert.dismiss")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form controls */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-muted-foreground">{t("hawl.start")}</span>
          <input
            type="date"
            value={settings.startIso}
            onChange={(e) => update({ startIso: e.target.value, dismissedFor: "" })}
            className="num mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">{t("hawl.calendar")}</span>
          <select
            value={settings.lunar ? "lunar" : "solar"}
            onChange={(e) => update({ lunar: e.target.value === "lunar" })}
            className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lunar">
              {t("hawl.lunar")} (354 {lang === "ar" ? "يوماً" : "days"})
            </option>
            <option value="solar">
              {t("hawl.solar")} (365 {lang === "ar" ? "يوماً" : "days"})
            </option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-muted-foreground">
            {lang === "ar" ? "تنبيه مسبق قبل الموعد بـ" : "Advance reminder"}
          </span>
          <select
            value={settings.leadDays}
            onChange={(e) => update({ leadDays: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={7}>{lang === "ar" ? "أسبوع واحد (7 أيام)" : "1 week (7 days)"}</option>
            <option value={14}>{lang === "ar" ? "أسبوعين (14 يوماً)" : "2 weeks (14 days)"}</option>
            <option value={30}>
              {lang === "ar" ? "شهر كامل (30 يوماً)" : "1 month (30 days)"}
            </option>
          </select>
        </label>
      </div>

      {/* Next due date display & Notification setup */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3.5 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t("hawl.next")}:</span>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2 font-medium text-foreground">
            <span>{gregStr}</span>
            <span className="text-xs text-primary font-normal">({hijriStr})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasNotificationPermission ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="size-4" />
              {t("hawl.notifyOn")}
            </span>
          ) : (
            <button
              onClick={requestNotifications}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
            >
              <BellRing className="size-3.5 text-primary" />
              {t("hawl.notifyEnable")}
            </button>
          )}
        </div>
      </div>

      {notificationStatusMsg && (
        <p className="mt-2 text-xs text-muted-foreground">{notificationStatusMsg}</p>
      )}

      <p className="mt-3 text-[0.7rem] text-muted-foreground">🔒 {t("hawl.privacy")}</p>
    </section>
  );
}
