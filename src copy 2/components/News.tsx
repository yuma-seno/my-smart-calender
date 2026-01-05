import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import { fetchWithProxy } from "../utils/fetchWithProxy";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";

interface NewsProps {
  rssUrl: string;
}

interface NewsItem {
  title: string;
  source: string;
  description: string;
  pubDate?: string;
  link?: string;
}

const News = ({ rssUrl }: NewsProps) => {
  const [news, setNews] = useState([] as NewsItem[]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null as string | null);
  const swiperRef = useRef<SwiperInstance | null>(null);

  useEffect(() => {
    if (!rssUrl) return;
    const fetchNews = async () => {
      setError(null);
      try {
        const xmlString = await fetchWithProxy(rssUrl);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5);
        if (!items.length) throw new Error("No items");

        const channelTitle =
          xmlDoc.querySelector("channel > title")?.textContent || "NEWS";

        const formatPubDate = (raw: string | null): string | undefined => {
          if (!raw) return undefined;
          const date = new Date(raw);
          if (isNaN(date.getTime())) return undefined;
          const month = date.getMonth() + 1;
          const day = date.getDate();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${month}月${day}日 ${hours}:${minutes}`;
        };

        setNews(
          items.map((item) => {
            const title =
              item.querySelector("title")?.textContent || "No Title";
            const description =
              item.querySelector("description")?.textContent?.trim() || "";
            const pubDate = formatPubDate(
              item.querySelector("pubDate")?.textContent || null
            );
            const link = item.querySelector("link")?.textContent?.trim();
            return {
              title,
              source: channelTitle,
              description,
              pubDate,
              link,
            } as NewsItem;
          })
        );
        setCurrentIndex(0);
      } catch (err) {
        setError("News Error");
      }
    };
    fetchNews();
    const intervalId = window.setInterval(fetchNews, 5 * 60 * 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [rssUrl]);

  const handleNext = () => swiperRef.current?.slideNext();
  const handlePrev = () => swiperRef.current?.slidePrev();

  if (error || !news.length)
    return (
      <Card className="items-center justify-center text-sm">
        <AlertCircle size={16} className="mb-1" />
        <span className="text-gray-500 dark:text-gray-400">No News</span>
      </Card>
    );

  return (
    <Card className="justify-center select-none group relative p-0 overflow-hidden">
      <Swiper
        className="w-full h-full flex flex-col justify-center"
        slidesPerView={1}
        spaceBetween={16}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          setCurrentIndex(swiper.realIndex ?? swiper.activeIndex);
        }}
      >
        {news.map((article: NewsItem, index: number) => (
          <SwiperSlide key={index} className="w-full h-full">
            <Card className="w-full h-full relative">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-50"
                style={{ backgroundImage: "url('./images/news-bg.png')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

              <div className="absolute inset-0 p-[26px] flex flex-col justify-start w-full">
                <div className="inline-block text-white/70 text-[11px]  pb-0.5 text-right w-full">
                  {article.source}
                </div>

                <h2 className="max-w-full text-white text-[26px] leading-tight mt-[10px] line-clamp-2 break-words">
                  {article.title}
                </h2>

                <div className="absolute bottom-[36px] left-[26px] right-[26px] flex items-end justify-between gap-[20px]">
                  <div className="flex-1 min-w-0 max-w-full">
                    {article.description && (
                      <p className="text-gray-300 text-[14px] leading-relaxed line-clamp-3 mb-[9px] break-words">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-gray-400 text-[13px]">
                      <span>{article.pubDate || ""}</span>
                    </div>
                  </div>
                  <div className="flex-none bg-white p-[5px] rounded-[4px]">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        article.link ?? "https://example.com"
                      )}`}
                      alt="記事URLのQRコード"
                      className="w-[65px] h-[65px] object-contain"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute inset-y-0 left-0 flex items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={handlePrev}
          className="p-1 bg-black/5 dark:bg-white/10 rounded-full text-gray-400 dark:text-white"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={handleNext}
          className="p-1 bg-black/5 dark:bg-white/10 rounded-full text-gray-400 dark:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-20">
        {news.map((_: NewsItem, i: number) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === currentIndex
                ? "w-4 bg-blue-500"
                : "w-1.5 bg-gray-300 dark:bg-white/20"
            }`}
          />
        ))}
      </div>
    </Card>
  );
};

export default News;
