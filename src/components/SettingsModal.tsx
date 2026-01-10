import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

import {
  SmartCalenderConfig,
  CalendarConfig,
  ThemeMode,
} from "../types/config";
import {
  DEFAULT_CALENDAR_COLOR,
  DEFAULT_CONFIG,
  HOLIDAY_ICAL_URL,
} from "../utils/config";

interface SettingsModalProps {
  config: SmartCalenderConfig;
  onSave: (config: SmartCalenderConfig) => void;
  onClose: () => void;
}

interface SettingsForm {
  city: string;
  rssUrl: string;
  calendars: CalendarConfig[];
  themeMode: ThemeMode;
  lightStart: string;
  darkStart: string;
}

const SettingsModal = ({ config, onSave, onClose }: SettingsModalProps) => {
  const [formData, setFormData] = useState({
    city: config.city,
    rssUrl: config.rssUrl,
    calendars:
      config.calendars?.filter(
        (c: CalendarConfig) => c.url !== HOLIDAY_ICAL_URL
      ) || [],
    themeMode: config.themeMode,
    lightStart:
      config.themeSchedule?.lightStart ||
      DEFAULT_CONFIG.themeSchedule.lightStart,
    darkStart:
      config.themeSchedule?.darkStart || DEFAULT_CONFIG.themeSchedule.darkStart,
  } as SettingsForm);

  useEffect(() => {
    setFormData({
      city: config.city,
      rssUrl: config.rssUrl,
      calendars:
        config.calendars?.filter(
          (c: CalendarConfig) => c.url !== HOLIDAY_ICAL_URL
        ) || [],
      themeMode: config.themeMode,
      lightStart:
        config.themeSchedule?.lightStart ||
        DEFAULT_CONFIG.themeSchedule.lightStart,
      darkStart:
        config.themeSchedule?.darkStart ||
        DEFAULT_CONFIG.themeSchedule.darkStart,
    });
  }, [config]);

  const handleChange = (field: keyof SettingsForm, value: any) =>
    setFormData((prev: SettingsForm) => ({ ...prev, [field]: value }));

  const handleCalendarChange = (
    index: number,
    field: keyof CalendarConfig,
    value: string
  ) => {
    setFormData((prev: SettingsForm) => {
      const next = [...prev.calendars];
      const target = next[index] || {
        url: "",
        color: DEFAULT_CALENDAR_COLOR,
      };
      next[index] = { ...target, [field]: value } as CalendarConfig;
      return { ...prev, calendars: next };
    });
  };

  const handleAddCalendar = () => {
    setFormData((prev: SettingsForm) => ({
      ...prev,
      calendars: [
        ...prev.calendars,
        { url: "", color: DEFAULT_CALENDAR_COLOR } as CalendarConfig,
      ],
    }));
  };

  const handleRemoveCalendar = (index: number) => {
    setFormData((prev: SettingsForm) => ({
      ...prev,
      calendars: prev.calendars.filter(
        (_: CalendarConfig, i: number) => i !== index
      ),
    }));
  };

  const handleSave = () => {
    const calendars = (formData.calendars || [])
      .map((c: CalendarConfig) => ({
        url: (c.url || "").trim(),
        color: c.color || DEFAULT_CALENDAR_COLOR,
        ...(c.name ? { name: c.name.trim() } : {}),
      }))
      .filter((c: CalendarConfig) => c.url.length);
    onSave({
      city: formData.city,
      rssUrl: formData.rssUrl,
      calendars,
      themeMode: formData.themeMode,
      themeSchedule: {
        lightStart: formData.lightStart,
        darkStart: formData.darkStart,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-600 dark:text-white">
            設定
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-500 dark:text-gray-400">
              テーマ
            </label>
            <select
              value={formData.themeMode}
              onChange={(e: any) => handleChange("themeMode", e.target.value)}
              className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 ring-blue-500"
            >
              <option value="schedule">時刻で自動切替</option>
              <option value="light">ライト固定</option>
              <option value="dark">ダーク固定</option>
            </select>
            {formData.themeMode === "schedule" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">
                    ライト開始
                  </label>
                  <input
                    type="time"
                    value={formData.lightStart}
                    onChange={(e: any) =>
                      handleChange("lightStart", e.target.value)
                    }
                    className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">
                    ダーク開始
                  </label>
                  <input
                    type="time"
                    value={formData.darkStart}
                    onChange={(e: any) =>
                      handleChange("darkStart", e.target.value)
                    }
                    className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-500 dark:text-gray-400">
              地域
            </label>
            <input
              name="city"
              value={formData.city}
              onChange={(e: any) => handleChange("city", e.target.value)}
              className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-500 dark:text-gray-400">
              RSS URL
            </label>
            <input
              name="rssUrl"
              value={formData.rssUrl}
              onChange={(e: any) => handleChange("rssUrl", e.target.value)}
              className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-500 dark:text-gray-400">
              iCal カレンダー一覧
            </label>
            <div className="space-y-2 h-45 overflow-y-auto pr-1">
              {formData.calendars.map((cal: CalendarConfig, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-2"
                >
                  <input
                    type="color"
                    value={cal.color || DEFAULT_CALENDAR_COLOR}
                    onChange={(e: any) =>
                      handleCalendarChange(index, "color", e.target.value)
                    }
                    className="w-10 h-10 rounded-md border border-gray-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={cal.url}
                    onChange={(e: any) =>
                      handleCalendarChange(index, "url", e.target.value)
                    }
                    placeholder="https://calendar.example.com/ical"
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCalendar(index)}
                    className="text-xs text-red-500 hover:text-red-400 px-2 py-1"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCalendar}
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                + カレンダーを追加
              </button>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
