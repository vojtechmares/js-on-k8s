import type { ReactNode } from "react";

export const metadata = { title: "js-on-k8s Next.js example" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
