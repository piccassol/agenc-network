"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Moon, Sun, Terminal, MessageSquare, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

interface NavigationProps {
  theme: Theme
  onToggleTheme: () => void
}

export function Navigation({ theme, onToggleTheme }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleTheme}
        className="h-8 w-8 bg-transparent"
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <div className="relative" ref={menuRef}>
        <Button
          variant="outline"
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-8 bg-transparent gap-1.5 px-3"
        >
          <span className="text-sm">Menu</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-card border shadow-lg z-50">
            <div className="py-1">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  isActive("/") ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Community Hub
              </Link>
              <Link
                href="/technical"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  isActive("/technical") ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                <Terminal className="w-4 h-4" />
                Technical Dashboard
              </Link>
              <Link
                href="/wallet"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  isActive("/wallet") ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                <Wallet className="w-4 h-4" />
                TETSUO Wallet
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
