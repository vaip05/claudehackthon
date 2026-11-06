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
        {/* --tabbar-h lets the Talk composer sit above the fixed tab bar; --header-h lets Talk's sticky header sit under the app header (60px) */}
        <div
          className="mx-auto flex min-h-screen w-full max-w-md flex-col"
          style={{ "--tabbar-h": "3.5rem", "--header-h": "3.75rem" } as React.CSSProperties}
        >
          <Header />
          <PrivacyBanner />
          <main className="flex flex-1 flex-col px-5 pb-6 pt-2">{children}</main>
          <Disclaimer />
        </div>
        <TabBar />
      </body>
    </html>
  );
}
