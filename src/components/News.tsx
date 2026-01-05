import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import { fetchWithProxy } from "../utils/fetchWithProxy";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface NewsProps {
  rssUrl: string;
  resetToken: number;
}

interface NewsItem {
  title: string;
  source: string;
  description: string;
  pubDate?: string;
  link?: string;
  imageUrl?: string;
}

const MAX_NEWS_ITEMS = 20;

const News = ({ rssUrl, resetToken }: NewsProps) => {
  const [news, setNews] = useState([] as NewsItem[]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null as string | null);
  const swiperRef = useRef(null as any);

  useEffect(() => {
    if (!rssUrl) {
      setNews([]);
      setError(null);
      return;
    }

    const fetchNews = async () => {
      setError(null);
      try {
        const xmlString = await fetchWithProxy(rssUrl);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const allItems = Array.from(xmlDoc.querySelectorAll("item"));
        if (!allItems.length) throw new Error("No items");

        // メモリ使用量と描画コストを抑えるため、保持する記事数に上限を設ける
        const items = allItems.slice(0, MAX_NEWS_ITEMS);

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

        const baseNews: NewsItem[] = items.map((item: any) => {
          const title = item.querySelector("title")?.textContent || "No Title";
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
        });

        // 各記事の OGP 画像を取得して背景に利用
        const newsWithOg: NewsItem[] = await Promise.all(
          baseNews.map(async (item: NewsItem) => {
            if (!item.link) return item;
            try {
              const html = await fetchWithProxy(item.link);
              const ogDoc = new DOMParser().parseFromString(html, "text/html");
              const ogImage =
                ogDoc
                  .querySelector('meta[property="og:image"]')
                  ?.getAttribute("content") || undefined;
              if (!ogImage) return item;
              return { ...item, imageUrl: ogImage } as NewsItem;
            } catch {
              return item;
            }
          })
        );

        // 記事内容が変わらない場合は再レンダーを抑制
        setNews((prev) => {
          const unchanged =
            prev.length === newsWithOg.length &&
            prev.every((p, idx) => {
              const curr = newsWithOg[idx];
              return (
                p.title === curr.title &&
                p.description === curr.description &&
                p.pubDate === curr.pubDate &&
                p.link === curr.link &&
                p.imageUrl === curr.imageUrl
              );
            });
          return unchanged ? prev : newsWithOg;
        });
        window.setTimeout(() => {
          if (!swiperRef.current) return;
          setCurrentIndex(
            swiperRef.current?.realIndex ?? swiperRef.current?.activeIndex
          );
        }, 100);
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

  useEffect(() => {
    if (swiperRef.current) {
      try {
        if (typeof swiperRef.current.slideToLoop === "function") {
          swiperRef.current.slideToLoop(0);
        } else {
          swiperRef.current.slideTo(0);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [resetToken]);

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
        loop={true}
        onSwiper={(swiper: any) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper: any) => {
          setCurrentIndex(swiper.realIndex ?? swiper.activeIndex);
        }}
      >
        {news.map((article: NewsItem, index: number) => (
          <SwiperSlide key={index} className="w-full h-full">
            <Card className="w-full h-full relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${
                    article.imageUrl || "./images/news-bg.png"
                  }')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/50" />

              <div className="absolute inset-0 px-[21px] py-[15px] justify-start w-full flex flex-col">
                <h2 className="flex-none max-w-full text-white text-[24px] leading-tight mt-[9px] mb-[5px] line-clamp-2 break-words">
                  {article.title}
                </h2>

                <p className="flex-1 text-gray-300 text-[16px] leading-relaxed break-words line-clamp-4">
                  <span className="float-right w-[0px] h-[28px] t-0"></span>
                  <span className="flex-none bg-white p-[3px] rounded-[4px] float-right ml-2 clear-right">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        article.link ?? "https://example.com"
                      )}`}
                      alt="記事URLのQRコード"
                      className="w-[68px] h-[68px] object-contain clear-right"
                    />
                  </span>
                  {article.description}
                </p>
                <div className="flex-none flex items-center justify-between text-gray-400 text-[13px] mb-[10px] pt-[6px] border-t-2 border-white/50">
                  <span>{article.source}</span>
                  <span>{article.pubDate || ""}</span>
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

      {/* クリック時の詳細ダイアログ処理は廃止し、
          詳細参照は QR コードからのみ行う。 */}
    </Card>
  );
};

export default News;
