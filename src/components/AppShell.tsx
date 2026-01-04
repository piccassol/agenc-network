"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import {
  PROGRAM_ID,
  IS_DEVNET,
  SOLANA_CLUSTER,
  explorerAddressUrl,
  shortenAddress,
} from "@/lib/solanaConfig";

type Tab = "tasks" | "agents" | "ai" | "settings";
type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved: Theme = savedTheme ?? (systemPrefersDark ? "dark" : "light");
    setTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

export function AppShell({
  activeTab,
  setActiveTab,
  children,
}: {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();

  const shortProgram = shortenAddress(PROGRAM_ID, 4, 4);
  const explorer = explorerAddressUrl(PROGRAM_ID, SOLANA_CLUSTER);

  // Subtitle like screenshot: "devnet • program: Abcd…Wxyz"
  const subtitle = IS_DEVNET
    ? `devnet • program: ${shortProgram}`
    : `program: ${shortProgram}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 gap-3">
      <div className="w-full max-w-4xl h-[600px] flex flex-col shadow-lg overflow-hidden border border-border bg-card/70 backdrop-blur">
        {/* Header bar */}
        <div className="border-b px-4 py-2.5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold">AgenC Coordination</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subtitle}{" "}
              <a
                href={explorer}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 opacity-80 hover:opacity-100"
                title={PROGRAM_ID}
              >
                (Explorer)
              </a>
            </p>
          </div>

          <div className="flex gap-1.5 items-center">
            {/* Theme toggle (matches the little square button in screenshot) */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 grid place-items-center border border-border bg-transparent hover:bg-muted/40 transition-colors"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              type="button"
            >
              {theme === "light" ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </button>

            {/* Segmented control like screenshot */}
            <div className="relative inline-flex h-8 bg-muted border border-border shadow-sm">
              <div
                className="absolute top-0 h-full bg-background border border-border shadow-sm transition-all duration-300 ease-out"
                style={{
                  left:
                    activeTab === "tasks"
                      ? "0%"
                      : activeTab === "agents"
                      ? "25%"
                      : activeTab === "ai"
                      ? "50%"
                      : "75%",
                  width: "25%",
                }}
              />
              {(["tasks", "agents", "ai", "settings"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                  className={`relative z-10 w-28 flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                    activeTab === tab
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-muted-foreground"
                  }`}
                >
                  {tab === "tasks"
                    ? "Tasks"
                    : tab === "agents"
                    ? "Agents"
                    : tab === "ai"
                    ? "AI"
                    : "Settings"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">{children}</div>
      </div>

      {/* Footer small text (optional, keep minimal like screenshot) */}
      <div className="text-xs text-muted-foreground/70">
        {IS_DEVNET ? "🚧 Devnet Beta • Do not use real funds" : "Mainnet"}
      </div>
    </div>
  );
}
