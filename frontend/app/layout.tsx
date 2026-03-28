import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReFind — AI Shopping Agent",
  description:
    "An assistant-first secondhand shopping agent that searches, compares, and negotiates the best deals for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <div className="relative" style={{ zIndex: 1, height: "100%" }}>
          <AuthKitProvider>{children}</AuthKitProvider>
        </div>
      </body>
    </html>
  );
}
