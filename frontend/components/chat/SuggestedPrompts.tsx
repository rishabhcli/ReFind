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

export function SuggestedPrompts() {
  const fillInput = (text: string) => {
    const textarea = document.querySelector(
      "[data-aui-composer-input]",
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;

    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    setter?.call(textarea, text);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  };

  return (
    <section
      className="flex w-full flex-col gap-4"
      style={{ maxWidth: "980px" }}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-dim)",
              marginBottom: "6px",
              fontWeight: 700,
            }}
          >
            Try a search
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "var(--muted-foreground)",
              lineHeight: 1.6,
            }}
          >
            Start with a concrete product, budget, or condition and ReFind will do the cross-market search.
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        style={{ width: "100%" }}
      >
        {PROMPTS.map((prompt) => {
          const Icon = prompt.icon;

          return (
            <button
              key={prompt.label}
              className="interactive focus-ring flex items-start gap-3 text-left"
              style={{
                borderRadius: "20px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                padding: "16px 18px",
                color: "var(--card-foreground)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--card-strong)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--card)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              onClick={() => fillInput(prompt.label)}
            >
              <span
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  background: "rgba(143, 165, 138, 0.12)",
                  border: "1px solid rgba(143, 165, 138, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-strong)",
                  flexShrink: 0,
                }}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.45,
                    color: "var(--foreground)",
                  }}
                >
                  {prompt.label}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {prompt.sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
