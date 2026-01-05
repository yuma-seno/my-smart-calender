import { SmartDashConfig, CalendarConfig } from "../types/config";

export const DEFAULT_CONFIG: SmartDashConfig = {
  city: "Tokyo",
  rssUrl: "https://news.web.nhk/n-data/conf/na/rss/cat0.xml",
  calendars: [],
};

export const HOLIDAY_ICAL_URL =
  "https://calendar.google.com/calendar/ical/ja.japanese%23holiday%40group.v.calendar.google.com/public/basic.ics";

const CONFIG_COOKIE_KEY = "smartDashConfig";
const THEME_COOKIE_KEY = "smartDashTheme";

export const normalizeConfig = (
  raw?: Partial<SmartDashConfig> & { icalUrl?: string; icalUrls?: string[] }
): SmartDashConfig => {
  const palette = [
    "#60a5fa", // blue-400
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

  return {
    city: raw?.city || DEFAULT_CONFIG.city,
    rssUrl: raw?.rssUrl || DEFAULT_CONFIG.rssUrl,
    calendars,
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

export const getInitialConfig = (): SmartDashConfig => {
  try {
    const savedConfig = getCookie(CONFIG_COOKIE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return normalizeConfig(parsed);
    }
  } catch (e) {
    // ignore and fall back to default
  }
  return normalizeConfig();
};

export const getInitialTheme = (): string => {
  try {
    const savedTheme = getCookie(THEME_COOKIE_KEY);
    if (savedTheme) {
      const lowered = savedTheme.toLowerCase();
      if (lowered.includes("light")) return "light";
      if (lowered.includes("dark")) return "dark";
    }
  } catch (e) {
    // ignore and fall back to default
  }
  return "dark";
};

export const saveConfigToCookie = (config: SmartDashConfig) => {
  setCookie(CONFIG_COOKIE_KEY, JSON.stringify(config), 365);
};

export const saveThemeToCookie = (theme: string) => {
  setCookie(THEME_COOKIE_KEY, theme, 365);
};
