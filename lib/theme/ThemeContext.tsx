'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  mounted: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Force light mode — remove any stale dark class and reset localStorage
    try {
      localStorage.setItem('ner_theme', 'light')
    } catch {
      // ignore
    }
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
    setMounted(true)
  }, [])

  // Theme is permanently light — toggle and setTheme are no-ops kept for API compat
  const setTheme = (_: Theme) => {}
  const toggleTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
