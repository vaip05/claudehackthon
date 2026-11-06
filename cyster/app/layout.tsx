import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import PrivacyBanner from "@/components/PrivacyBanner";
import Disclaimer from "@/components/Disclaimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cyster",
  description: "A private cycle tracker and guide for PMOS and endometriosis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {/*
          Full-width shell. Each page sets its own width (see PageContainer); Talk runs edge to edge.
          --header-h is the fixed app header height, so Talk's sticky header can sit under it.
          --tabbar-h lifts Talk's composer above the bottom tab bar, which only exists below md.
        */}
        <div className="flex min-h-screen w-full flex-col [--header-h:3.75rem] [--tabbar-h:3.5rem] md:[--tabbar-h:0px]">
          <Header />
          <PrivacyBanner />
          <main className="flex flex-1 flex-col">{children}</main>
          <Disclaimer />
        </div>
        <TabBar />
      </body>
    </html>
  );
}
