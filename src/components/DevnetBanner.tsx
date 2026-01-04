"use client";

import * as React from "react";
import {
  IS_DEVNET,
  PROGRAM_ID,
  SOLANA_CLUSTER,
  explorerAddressUrl,
  shortenAddress,
} from "@/lib/solanaConfig";
import { GettingStarted } from "@/components/GettingStarted";

export function DevnetBanner() {
  if (!IS_DEVNET) return null;

  const shortId = shortenAddress(PROGRAM_ID, 4, 4);
  const explorerUrl = explorerAddressUrl(PROGRAM_ID, SOLANA_CLUSTER);

  return (
    <div className="w-full border-b bg-yellow-50 text-black dark:bg-yellow-900/30 dark:text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">🚧 Devnet Beta</span>
          <span className="opacity-70">Program:</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono underline underline-offset-2"
            title={PROGRAM_ID}
          >
            {shortId}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <GettingStarted />
        </div>
      </div>
    </div>
  );
}
