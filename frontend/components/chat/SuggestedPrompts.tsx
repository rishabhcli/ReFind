"use client";

import { Search, Sofa, Bike, Gamepad2 } from "lucide-react";

const PROMPTS = [
  {
    icon: <Sofa className="h-4 w-4" />,
    label: "Find me a used couch under $200",
  },
  {
    icon: <Bike className="h-4 w-4" />,
    label: "Best deals on bikes near me",
  },
  {
    icon: <Search className="h-4 w-4" />,
    label: "Looking for a vintage record player",
  },
  {
    icon: <Gamepad2 className="h-4 w-4" />,
    label: "Cheap PS5 in good condition",
  },
];

export function SuggestedPrompts() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex flex-col items-center gap-2">
        <Search className="h-8 w-8 text-accent" />
        <h2 className="text-xl font-semibold">What are you looking for?</h2>
        <p className="text-sm text-muted-foreground">
          Tell me what you want and I&apos;ll search the best deals for you
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
            onClick={() => {
              // assistant-ui composer doesn't expose a programmatic send easily
              // so we dispatch an input event to the composer textarea
              const textarea = document.querySelector(
                "[data-aui-composer-input]"
              ) as HTMLTextAreaElement | null;
              if (textarea) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value"
                )?.set;
                nativeInputValueSetter?.call(textarea, prompt.label);
                textarea.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                textarea.focus();
              }
            }}
          >
            <span className="text-accent">{prompt.icon}</span>
            {prompt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
