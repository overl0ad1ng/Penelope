import type { Metadata } from "next";
import { Cinzel, Noto_Sans } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";
import Footer from "@/ui/Footer";
import Header from "@/ui/Header";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${config.title} · Ten3b`,
  description: config.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
