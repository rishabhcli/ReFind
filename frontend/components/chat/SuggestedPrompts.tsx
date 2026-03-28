"use client";

import { Sofa, Bike, Search, Gamepad2, Shirt, Camera } from "lucide-react";

const PROMPTS = [
  {
    icon: Gamepad2,
    label: "Cheap PS5 in good condition",
    sub: "Gaming",
  },
  {
    icon: Sofa,
    label: "Used couch under $200 near me",
    sub: "Furniture",
  },
  {
    icon: Bike,
    label: "Best deals on road bikes",
    sub: "Sports",
  },
  {
    icon: Search,
    label: "Vintage record player, any condition",
    sub: "Electronics",
  },
  {
    icon: Shirt,
    label: "Designer jackets under $100",
    sub: "Fashion",
  },
  {
    icon: Camera,
    label: "Mirrorless camera body, good condition",
    sub: "Electronics",
  },
];

const SOURCES = [
  { label: "Mercari", color: "#f43f5e" },
  { label: "Craigslist", color: "#f97316" },
  { label: "Goodwill", color: "#10b981" },
  { label: "OfferUp", color: "#38bdf8" },
  { label: "Facebook", color: "#8b5cf6" },
];

export function SuggestedPrompts() {
  const fillInput = (text: string) => {
    const textarea = document.querySelector(
      "[data-aui-composer-input]"
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    setter?.call(textarea, text);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  };

  return (
    <div
      className="flex flex-col items-center gap-10 py-12 px-4"
      style={{ maxWidth: "680px", width: "100%" }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(99,102,241,0.45)",
            marginBottom: "4px",
          }}
        >
          <Search className="h-6 w-6 text-white" />
        </div>
        <h2
          style={{
            fontSize: "38px",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            color: "#e2e2f0",
          }}
        >
          Find{" "}
          <span className="gradient-text">anything</span>{" "}
          secondhand.
        </h2>
        <p
          style={{
            fontSize: "15px",
            color: "#7878a0",
            maxWidth: "460px",
            lineHeight: "1.65",
          }}
        >
          AI searches 6 marketplaces simultaneously, ranks deals by value,
          and drafts negotiation messages for you.
        </p>

        {/* Source badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center" style={{ marginTop: "4px" }}>
          {SOURCES.map((s) => (
            <span
              key={s.label}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 11px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#7878a0",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: s.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Suggestion grid */}
      <div
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        style={{ width: "100%" }}
      >
        {PROMPTS.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <button
              key={prompt.label}
              className="interactive focus-ring flex items-center gap-3 text-left"
              style={{
                borderRadius: "14px",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "14px 16px",
                fontSize: "14px",
                color: "#c8c8e0",
                boxShadow:
                  "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
                e.currentTarget.style.color = "#e2e2f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.035)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "#c8c8e0";
              }}
              onClick={() => fillInput(prompt.label)}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: "#6366f1" }} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span style={{ fontSize: "13.5px", fontWeight: 500 }}>
                  {prompt.label}
                </span>
                <span style={{ fontSize: "11px", color: "#4a4a6a" }}>
                  {prompt.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
