import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Una sola familia en tres pesos; la variable la toma --font-sans en globals.css.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inspecciones de calidad",
  description: "Registro de inspecciones de calidad por producto y lote, con filtros y totales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={plex.variable}>
      <body className="font-sans text-cuerpo antialiased">{children}</body>
    </html>
  );
}
