import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Settings, Moon, Sun } from "lucide-react";
import "./index.css";

import Calendar from "./components/Calendar";
import Weather from "./components/Weather";
import Schedule from "./components/Schedule";
import News from "./components/News";
import SettingsModal from "./components/SettingsModal";
import { SmartDashConfig, CalendarConfig } from "./types/config";
import { fetchWithProxy } from "./utils/fetchWithProxy";
import { parseICal } from "./utils/ical";

const defaultConfig: SmartDashConfig = {
  city: "Tokyo",
  rssUrl: "https://news.web.nhk/n-data/conf/na/rss/cat0.xml",
  calendars: [],
};

const HOLIDAY_ICAL_URL =
  "https://calendar.google.com/calendar/ical/ja.japanese%23holiday%40group.v.calendar.google.com/public/basic.ics";

const normalizeConfig = (
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
    city: raw?.city || defaultConfig.city,
    rssUrl: raw?.rssUrl || defaultConfig.rssUrl,
    calendars,
  };
};

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};

const getInitialConfig = (): SmartDashConfig => {
  try {
    const savedConfig = getCookie("smartDashConfig");
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return normalizeConfig(parsed);
    }
  } catch (e) {
    // ignore and fall back to default
  }
  return normalizeConfig();
};

const getInitialTheme = (): string => {
  try {
    const savedTheme = getCookie("smartDashTheme");
    if (savedTheme) {
      const lowered = savedTheme.toLowerCase();
      // 古いバージョンで JSON 文字列や余計な文字が入っていても
      // "light" / "dark" を含んでいればそれを優先的に採用する
      if (lowered.includes("light")) return "light";
      if (lowered.includes("dark")) return "dark";
    }
  } catch (e) {
    // ignore and fall back to default
  }
  return "dark";
};
// --- Main App ---

const App = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme() as string);
  const [config, setConfig] = useState(getInitialConfig() as SmartDashConfig);
  const [selectedDate, setSelectedDate] = useState(null as Date | null);
  const [events, setEvents] = useState({} as Record<string, any[]>);
  const selectionTimerRef = useRef(null as number | null);

  useEffect(() => {
    const calendars = (config.calendars || []).filter(
      (c: any) => c.url && c.url.trim().length
    );
    if (!calendars.length) {
      setEvents({});
      return;
    }
    let active = true;
    const fetchEvents = async () => {
      const merged: Record<string, any[]> = {};
      await Promise.all(
        calendars.map(async (cal: any, index: number) => {
          const url = cal.url.trim();
          if (!url) return;
          try {
            const icalText = await fetchWithProxy(url);
            const parsed = parseICal(icalText);
            const isHolidayCalendar = url === HOLIDAY_ICAL_URL;
            Object.entries(parsed).forEach(([date, items]) => {
              if (!merged[date]) merged[date] = [];
              const enhanced = (items as any[]).map((ev) => ({
                ...ev,
                calendarIndex: index,
                calendarColor: cal.color,
                calendarName: cal.name,
                isHoliday: isHolidayCalendar,
              }));
              merged[date].push(...enhanced);
            });
          } catch (e) {
            console.error("iCal Fetch Error:", url, e);
          }
        })
      );
      Object.keys(merged).forEach((date) =>
        merged[date].sort((a, b) =>
          (a.timeStr || "").localeCompare(b.timeStr || "")
        )
      );
      if (active) setEvents(merged);
    };
    fetchEvents();
    const intervalId = window.setInterval(fetchEvents, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [config.calendars]);

  useEffect(() => {
    if (selectedDate) {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = setTimeout(
        () => setSelectedDate(null),
        15000
      );
    }
    return () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, [selectedDate]);

  // テーマに応じて <html> に dark クラスを付け外し
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setCookie("smartDashTheme", newTheme, 365);
  };

  const saveSettings = (newConfig: SmartDashConfig) => {
    const normalized = normalizeConfig(newConfig);
    setConfig(normalized);
    setCookie("smartDashConfig", JSON.stringify(normalized), 365);
    setSettingsOpen(false);
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 relative bg-gray-100 dark:bg-neutral-900">
      {/* 設定ボタン (Absolute配置) */}
      <div className="absolute top-[1%] right-[1%] z-50 flex gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 rounded-full shadow-sm text-gray-700 dark:text-gray-200"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 rounded-full shadow-sm text-gray-700 dark:text-gray-200"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Main Grid */}
      <div className="w-full h-full grid grid-cols-[72%_27%] p-[1%] gap-[1%]">
        {/* Left Column */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 min-h-0">
            <Calendar
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 h-full pt-10">
          <div className="flex-none h-[23%]">
            <Weather city={config.city} />
          </div>
          <div className="flex-1 min-h-0">
            <Schedule events={events} selectedDate={selectedDate} />
          </div>
          <div className="flex-none h-[250px]">
            <News rssUrl={config.rssUrl} />
          </div>
        </div>
      </div>

      {settingsOpen && (
        <SettingsModal
          config={config}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
