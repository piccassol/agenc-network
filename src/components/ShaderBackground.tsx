"use client";

import * as React from "react";

export function ShaderBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-black">
      {/* Center background image - clearly visible */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: "url('/tet.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "500px auto",
        }}
      />

      {/* Moving border light - single line traveling around the perimeter */}
      <div
        className="absolute inset-0"
        style={{
          padding: "3px",
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.9) 5deg, transparent 15deg)",
          animation: "border-sweep 6s linear infinite",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
    </div>
  );
}
