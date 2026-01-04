"use client";

import * as React from "react";

export function GettingStarted() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Getting Started
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* backdrop */}
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* modal */}
          <div className="relative z-10 w-[min(560px,92vw)] rounded-xl border bg-white p-5 shadow-xl dark:bg-neutral-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Getting Started (Devnet)</h2>
                <p className="mt-1 text-sm opacity-80">
                  Do these steps to interact with the AgenC protocol on Solana devnet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              <li>Install Phantom or Solflare</li>
              <li>
                Switch wallet to Devnet (Settings → Developer Settings → Change Network)
              </li>
              <li>
                Get devnet SOL from{" "}
                <a
                  className="underline"
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://faucet.solana.com
                </a>
              </li>
              <li>Register as an agent to start</li>
            </ol>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}