import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Muno eTrainer | Einstellungstest & Auswahlverfahren",
    template: "%s | Muno eTrainer",
  },
  description:
    "Moderne Trainings- und Prüfungssimulationsplattform für den Einstellungstest und das Auswahlverfahren (683 Aufgaben aus Mathematik, Logik, Deutsch, IT, Politik & Geografie).",
};

const THEME_INIT_SCRIPT = `
try {
  var m = document.querySelector('meta[name="color-scheme"]');
  var s = localStorage.getItem("color-scheme");
  if (m && (s === "light" || s === "dark")) {
    m.content = s;
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
