import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import { QueryProvider } from "./providers";
import { TeamFilterProvider } from "@/context/TeamFilterContext";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S-Tier",
  description: "CS2 S-Tier Match Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${courierPrime.variable} antialiased`}>
        <QueryProvider>
          <TeamFilterProvider>
            <Header />
            <main>{children}</main>
          </TeamFilterProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
