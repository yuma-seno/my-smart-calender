import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Settings, Moon, Sun } from "lucide-react";

import Calendar from "./components/Calendar";
import Weather from "./components/Weather";
import Schedule from "./components/Schedule";
import News from "./components/News";
import SettingsModal from "./components/SettingsModal";
import { SmartDashConfig } from "./types/config";
import {
  getInitialConfig,
  getInitialTheme,
  normalizeConfig,
  saveConfigToCookie,
  saveThemeToCookie,
} from "./utils/config";
import { useNowWithDateChange } from "./hooks/useNowWithDateChange";
import { useCalendarEvents } from "./hooks/useCalendarEvents";

const INACTIVITY_TIMEOUT_MS = 60 * 1000;

type Theme = "light" | "dark";

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    return (
      initial === "light" || initial === "dark" ? initial : "dark"
    ) as Theme;
  });
  const [config, setConfig] = useState<SmartDashConfig>(() =>
    getInitialConfig()
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [resetToken, setResetToken] = useState<number>(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const { now, dateChangeToken } = useNowWithDateChange();
  const events = useCalendarEvents(config.calendars);

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
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    saveThemeToCookie(newTheme);
  };

  const saveSettings = (newConfig: SmartDashConfig) => {
    const normalized = normalizeConfig(newConfig);
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
          onClick={toggleTheme}
          className="p-2 bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 rounded-full shadow-sm text-gray-700 dark:text-gray-200"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
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
