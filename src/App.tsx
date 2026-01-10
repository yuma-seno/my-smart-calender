import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Settings, Moon, Sun, SunMoon } from "lucide-react";

import Calendar from "./components/Calendar";
import Weather from "./components/Weather";
import Schedule from "./components/Schedule";
import News from "./components/News";
import SettingsModal from "./components/SettingsModal";
import { SmartCalenderConfig } from "./types/config";
import {
  getInitialConfig,
  normalizeConfig,
  saveConfigToCookie,
} from "./utils/config";
import { useNowWithDateChange } from "./hooks/useNowWithDateChange";
import { useCalendarEvents } from "./hooks/useCalendarEvents";

const INACTIVITY_TIMEOUT_MS = 60 * 1000;

type Theme = "light" | "dark";

const parseTimeToMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":");
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

const getThemeForSchedule = (
  now: Date,
  lightStart: string,
  darkStart: string
): Theme => {
  const current = now.getHours() * 60 + now.getMinutes();
  const light = parseTimeToMinutes(lightStart);
  const dark = parseTimeToMinutes(darkStart);

  // If equal, treat as always dark (arbitrary but deterministic).
  if (light === dark) return "dark";

  // dark interval is [darkStart, lightStart)
  if (dark < light) {
    return current >= dark && current < light ? "dark" : "light";
  }
  // wraps midnight
  return current >= dark || current < light ? "dark" : "light";
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SmartCalenderConfig>(() =>
    getInitialConfig()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [resetToken, setResetToken] = useState<number>(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const { now, dateChangeToken } = useNowWithDateChange();
  const events = useCalendarEvents(config.calendars);

  const effectiveTheme: Theme = useMemo(() => {
    if (config.themeMode === "dark") return "dark";
    if (config.themeMode === "light") return "light";
    return getThemeForSchedule(
      now,
      config.themeSchedule.lightStart,
      config.themeSchedule.darkStart
    );
  }, [
    config.themeMode,
    config.themeSchedule.darkStart,
    config.themeSchedule.lightStart,
    now,
  ]);

  const timeLabel = useMemo(() => {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [now]);

  const registerInteraction = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      setResetToken((prev: number) => prev + 1);
      setSelectedDate(null);
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [effectiveTheme]);

  const cycleThemeMode = () => {
    const next =
      config.themeMode === "schedule"
        ? "light"
        : config.themeMode === "light"
        ? "dark"
        : "schedule";
    const updated = normalizeConfig({ ...config, themeMode: next } as any);
    setConfig(updated);
    saveConfigToCookie(updated);
  };

  const saveSettings = (newConfig: SmartCalenderConfig) => {
    const normalized = normalizeConfig(newConfig as any);
    setConfig(normalized);
    saveConfigToCookie(normalized);
    setSettingsOpen(false);
  };

  useEffect(() => {
    registerInteraction();
    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [registerInteraction]);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 relative bg-gray-100 dark:bg-neutral-900"
      onPointerDown={registerInteraction}
      onKeyDown={registerInteraction}
      onWheel={registerInteraction}
      onTouchStart={registerInteraction}
    >
      <div className="absolute top-[1%] right-[1%] z-50 flex items-center gap-3">
        <span className="text-base font-medium text-gray-700 dark:text-gray-200 select-none">
          {timeLabel}
        </span>
        <button
          type="button"
          onClick={cycleThemeMode}
          title={
            config.themeMode === "schedule"
              ? `Theme: Schedule (Light ${config.themeSchedule.lightStart} / Dark ${config.themeSchedule.darkStart})`
              : `Theme: ${config.themeMode}`
          }
          className="p-2 bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 rounded-full shadow-sm text-gray-700 dark:text-gray-200"
        >
          {config.themeMode === "schedule" ? (
            <SunMoon size={18} />
          ) : config.themeMode === "dark" ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="p-2 bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 rounded-full shadow-sm text-gray-700 dark:text-gray-200"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="w-full h-full grid grid-cols-[72%_27%] p-[1%] gap-[1%]">
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 min-h-0">
            <Calendar
              events={events}
              selectedDate={selectedDate}
              resetToken={resetToken}
              today={now}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full pt-10">
          <div className="flex-none h-[180px]">
            <Weather
              city={config.city}
              resetToken={resetToken}
              dateChangeToken={dateChangeToken}
            />
          </div>
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <Schedule
                events={events}
                selectedDate={selectedDate}
                today={now}
              />
            </div>
          </div>
          <div className="flex-none h-[250px]">
            <News rssUrl={config.rssUrl} resetToken={resetToken} />
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

export default App;
