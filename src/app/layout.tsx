import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inspecciones de calidad",
  description:
    "Registro de inspecciones de calidad por producto y lote, con filtros y totales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
