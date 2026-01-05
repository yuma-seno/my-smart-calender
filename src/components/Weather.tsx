import React, { useState, useEffect } from "react";
import { Cloud } from "lucide-react";
import Card from "./Card";

interface WeatherProps {
  city: string;
  resetToken: number;
  dateChangeToken: number;
}

interface ForecastItem {
  date: Date;
  code: number;
  maxTemp: number;
  minTemp: number;
}

const Weather = ({ city, resetToken, dateChangeToken }: WeatherProps) => {
  const [forecast, setForecast] = useState([] as ForecastItem[]);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef(null as any);

  useEffect(() => {
    if (!city) return;
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
          )}&count=1&language=ja&format=json`
        );
        const geoData = await geoRes.json();
        if (!geoData.results?.length) return;
        const { latitude, longitude, name } = geoData.results[0];
        setLocationName(name);
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
        );
        const wData = await wRes.json();
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
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const intervalId = window.setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [city, dateChangeToken]);

  useEffect(() => {
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } catch (e) {
        scrollRef.current.scrollLeft = 0;
      }
    }
  }, [resetToken]);

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
    <Card className="p-4">
      {!loading && (
        <div
          ref={scrollRef}
          className="flex-1 flex overflow-x-auto pb-1 hidden-scrollbar items-center"
        >
          {forecast.map((item: ForecastItem, i: number) => (
            <div
              key={i}
              className="flex flex-col items-center min-w-[44px] gap-0.2 px-8"
            >
              <span className="text-[15px] text-gray-500 dark:text-gray-400">
                {item.date.getMonth() + 1}/{item.date.getDate()}
              </span>
              <span className="text-[33px] my-0.2">
                {getWeatherIcon(item.code)}
              </span>
              <span className="text-[16px] text-gray-600 dark:text-white">
                {item.maxTemp}°
              </span>
              <span className="text-[16px] text-gray-600 dark:text-white">
                {item.minTemp}°
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default Weather;
