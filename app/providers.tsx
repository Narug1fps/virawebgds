'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from "@/components/theme-provider"
import CookieConsent from "@/components/cookie-consent"

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Only wrap with GoogleOAuthProvider when a client id is configured.
  // Passing an empty string causes the underlying library to throw a runtime error.
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </GoogleOAuthProvider>
    )
  }

  return (
    <ThemeProvider>
      {children}
      <CookieConsent />
    </ThemeProvider>
  )
}
