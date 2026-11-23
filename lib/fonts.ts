import { Newsreader, Noto_Sans_JP, Outfit } from "next/font/google";

export const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const japanese = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ja",
  display: "swap",
  preload: false,
});
