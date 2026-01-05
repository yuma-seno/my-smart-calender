declare module "react";
declare module "react-dom/client";
declare module "react/jsx-runtime";
declare module "lucide-react";
declare module "swiper/react";
declare module "swiper/types";
declare module "swiper/css";
declare module "*.css";

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
