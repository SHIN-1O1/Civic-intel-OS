import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Civic-intel-OS | Admin Portal",
  description: "Government-grade administrative dashboard for civic infrastructure management",
  keywords: ["civic", "government", "admin", "dashboard", "infrastructure"],
};

import { AuthProvider } from "@/contexts/auth-context";
import { NotificationsProvider } from "@/contexts/notifications-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <NotificationsProvider>
            {children}
            <Toaster position="top-right" richColors />
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

