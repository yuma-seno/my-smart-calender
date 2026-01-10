import {
  SmartCalenderConfig,
  CalendarConfig,
  ThemeMode,
  ThemeSchedule,
} from "../types/config";

export const DEFAULT_CALENDAR_COLOR = "#60a5fa";

export const DEFAULT_CONFIG: SmartCalenderConfig = {
  city: "Tokyo",
  rssUrl: "https://news.web.nhk/n-data/conf/na/rss/cat0.xml",
  calendars: [],
  themeMode: "schedule",
  themeSchedule: {
    lightStart: "07:00",
    darkStart: "19:00",
  },
};

export const HOLIDAY_ICAL_URL =
  "https://calendar.google.com/calendar/ical/ja.japanese%23holiday%40group.v.calendar.google.com/public/basic.ics";

const CONFIG_COOKIE_KEY = "smartCalenderConfig";
const LEGACY_CONFIG_COOKIE_KEY = "smartDashConfig";
const LEGACY_THEME_COOKIE_KEY = "smartDashTheme";

const isValidTimeHHMM = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim());
};

const normalizeThemeMode = (value: unknown): ThemeMode => {
  if (value === "light" || value === "dark" || value === "schedule") {
    return value;
  }
  return DEFAULT_CONFIG.themeMode;
};

const normalizeThemeSchedule = (raw: any): ThemeSchedule => {
  const lightStart = isValidTimeHHMM(raw?.lightStart)
    ? raw.lightStart.trim()
    : DEFAULT_CONFIG.themeSchedule.lightStart;
  const darkStart = isValidTimeHHMM(raw?.darkStart)
    ? raw.darkStart.trim()
    : DEFAULT_CONFIG.themeSchedule.darkStart;
  return { lightStart, darkStart };
};

export const normalizeConfig = (
  raw?:
    | Partial<SmartCalenderConfig> & {
        icalUrl?: string;
        icalUrls?: string[];
      } & Record<string, unknown>
): SmartCalenderConfig => {
  const palette = [
    DEFAULT_CALENDAR_COLOR, // blue-400
    "#22c55e", // green-500
    "#f97316", // orange-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
  ];

  const calendars: CalendarConfig[] = [];

  if (Array.isArray(raw?.calendars) && raw.calendars.length) {
    raw.calendars.forEach((c, idx) => {
      const url = (c.url || "").trim();
      if (!url) return;
      const color = c.color || palette[idx % palette.length];
      const name = (c.name || "").trim();
      calendars.push({ url, color, ...(name ? { name } : {}) });
    });
  } else {
    const legacyUrls =
      (raw as any)?.icalUrls && (raw as any).icalUrls.length
        ? (raw as any).icalUrls
        : (raw as any)?.icalUrl
        ? [(raw as any).icalUrl]
        : [];
    legacyUrls
      .map((url: string) => (url || "").trim())
      .filter((url: string) => url.length)
      .forEach((url: string, idx: number) => {
        calendars.push({ url, color: palette[idx % palette.length] });
      });
  }

  if (!calendars.some((c) => c.url === HOLIDAY_ICAL_URL)) {
    calendars.push({ url: HOLIDAY_ICAL_URL, color: "#ef4444", name: "祝日" });
  }

  const themeMode = normalizeThemeMode((raw as any)?.themeMode);
  const themeSchedule = normalizeThemeSchedule((raw as any)?.themeSchedule);

  return {
    city: raw?.city || DEFAULT_CONFIG.city,
    rssUrl: raw?.rssUrl || DEFAULT_CONFIG.rssUrl,
    calendars,
    themeMode,
    themeSchedule,
  };
};

export const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

export const getInitialConfig = (): SmartCalenderConfig => {
  try {
    const savedConfig = getCookie(CONFIG_COOKIE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return normalizeConfig(parsed);
    }

    const legacySavedConfig = getCookie(LEGACY_CONFIG_COOKIE_KEY);
    if (legacySavedConfig) {
      const parsed = JSON.parse(legacySavedConfig);

      // Legacy migration: smartDashTheme cookie -> config.themeMode
      const hasThemeMode =
        parsed &&
        typeof parsed === "object" &&
        (parsed as any).themeMode &&
        (parsed as any).themeSchedule;

      if (!hasThemeMode) {
        const legacyTheme = getCookie(LEGACY_THEME_COOKIE_KEY);
        if (legacyTheme) {
          const lowered = legacyTheme.toLowerCase();
          const legacyMode: ThemeMode = lowered.includes("dark")
            ? "dark"
            : lowered.includes("light")
            ? "light"
            : "schedule";
          (parsed as any).themeMode = legacyMode;
        }
      }

      const normalized = normalizeConfig(parsed);
      try {
        saveConfigToCookie(normalized);
      } catch {
        // ignore cookie write failure
      }
      return normalized;
    }
  } catch (e) {
    // ignore and fall back to default
  }
  return normalizeConfig();
};

export const saveConfigToCookie = (config: SmartCalenderConfig) => {
  setCookie(CONFIG_COOKIE_KEY, JSON.stringify(config), 365);
};
