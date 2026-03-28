"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { TrendingUp, Loader2 } from "lucide-react";

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 75
      ? "bg-green-500"
      : value >= 50
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 rounded-full bg-muted h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right font-medium">{value}</span>
    </div>
  );
}

export const ScoreDealUI = makeAssistantToolUI<
  { query?: string },
  { status: string }
>({
  toolName: "score_deal",
  render: ({ status }) => {
    const isRunning = status.type === "running";

    return (
      <div className="my-2 w-full max-w-sm rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Scoring deals…
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 text-accent" />
              Deals scored & ranked
            </>
          )}
        </div>
      </div>
    );
  },
});
