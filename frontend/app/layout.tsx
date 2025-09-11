import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import "./globals.css"

import AuthRouteWrapper from "@/components/AuthRouteWrapper"

export const metadata: Metadata = {
  title: "Stock Manager Pro",
  description: "Professional inventory management system",
  generator: "OptiStock",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="stock-manager-theme"
          >
            {/* wrap children so auth pages get a different background */}
            <AuthRouteWrapper>
              {children}
            </AuthRouteWrapper>
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
