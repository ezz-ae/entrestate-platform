"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-md bg-secondary border border-border">
        <div className="w-7 h-7" />
        <div className="w-7 h-7" />
        <div className="w-7 h-7" />
      </div>
    )
  }

  const themes = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
  ]

  return (
    <div className="flex items-center gap-1 p-1 rounded-md bg-secondary border border-border">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded transition-colors ${
            theme === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  )
}
