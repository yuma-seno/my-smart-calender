import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import { Settings, Moon, Sun } from "lucide-react";
import "./index.css";

import Calendar from "./components/Calendar";
import Schedule from "./components/Schedule";
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

interface ForecastItem {
  date: Date;
  code: number;
  maxTemp: number;
  minTemp: number;
}

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
  const [theme, setTheme] = useState<string>(() => getInitialTheme());
  const [config, setConfig] = useState<SmartDashConfig>(() =>
    getInitialConfig()
  );
  const [selectedDate, setSelectedDate] = useState(null as Date | null);
  const [events, setEvents] = useState({} as Record<string, any[]>);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [locationName, setLocationName] = useState("");
  const calendarRef = useRef<{
    nextMonth: () => void;
    prevMonth: () => void;
  } | null>(null);

  useEffect(() => {
    const calendars = (config.calendars || []).filter(
      (c) => c.url && c.url.trim().length
    );
    if (!calendars.length) {
      setEvents({});
      return;
    }
    let active = true;
    const fetchEvents = async () => {
      const merged: Record<string, any[]> = {};
      await Promise.all(
        calendars.map(async (cal, index) => {
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
    if (!config.city) return;
    let active = true;
    const fetchWeather = async () => {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            config.city
          )}&count=1&language=ja&format=json`
        );
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return;
        const { latitude, longitude, name } = geoData.results[0];
        if (!active) return;
        setLocationName(name);

        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
        );
        const wData = await wRes.json();
        if (!active) return;
        setForecast(
          wData.daily.time.map((t: string, i: number) => ({
            date: new Date(t),
            code: wData.daily.weathercode[i] as number,
            maxTemp: Math.round(wData.daily.temperature_2m_max[i] as number),
            minTemp: Math.round(wData.daily.temperature_2m_min[i] as number),
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchWeather();
    const intervalId = window.setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [config.city]);

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

  const forecastByDate = useMemo(() => {
    const map: Record<string, any> = {};
    forecast.forEach((item) => {
      const y = item.date.getFullYear();
      const m = item.date.getMonth() + 1;
      const d = item.date.getDate();
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
        2,
        "0"
      )}`;
      map[key] = item;
    });
    return map;
  }, [forecast]);

  const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  let panelTitle = "詳細";
  let selectedForecast: ForecastItem | null = null;
  if (selectedDate) {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    const d = selectedDate.getDate();
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    panelTitle = `${m}月${d}日（${weekdayLabels[selectedDate.getDay()]}）`;
    selectedForecast =
      (forecastByDate[key] as ForecastItem | undefined) || null;
  }

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "☔";
    if (code <= 77) return "❄️";
    if (code <= 99) return "⛈️";
    return "❓";
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 relative bg-white dark:bg-neutral-900">
      {/* 上部コントロール（テーマ・月移動・設定） */}
      <div className="absolute top-[1%] right-[1%] z-30 flex gap-2 items-center text-[13px]">
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

      {/* Main: Fullscreen Calendar */}
      <div className="w-full h-full p-[1%]">
        <Calendar
          ref={calendarRef as any}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          forecastByDate={forecastByDate}
        />
      </div>

      {/* Slide-over Detail Panel */}
      <div
        className={`absolute inset-0 z-40 transition-pointer-events ${
          selectedDate ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            selectedDate ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSelectedDate(null)}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[42%] max-w-[520px] bg-white dark:bg-neutral-900 shadow-xl border-l border-gray-200 dark:border-white/10 transform transition-transform duration-300 ease-out flex flex-col ${
            selectedDate ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex flex-col">
              <span className="text-[30px] font-bold text-gray-800 dark:text-white">
                {panelTitle}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Schedule */}
            <div className="h-full">
              <Schedule events={events} selectedDate={selectedDate} />
            </div>
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
