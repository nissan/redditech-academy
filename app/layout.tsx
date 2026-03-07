import type { Metadata } from "next";
import { Fraunces, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Redditech Academy — Free Technical Courses",
  description:
    "Free technical training courses from Redditech Labs. Master OAuth, OIDC, SAML, AI agents, and more.",
  metadataBase: new URL("https://learn.reddi.tech"),
  openGraph: {
    title: "Redditech Academy",
    description: "Free technical courses from Redditech Labs",
    url: "https://learn.reddi.tech",
    siteName: "Redditech Academy",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body
        className={`${fraunces.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased min-h-screen bg-[#0F172A] text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
