"use client";

import { SearchProgressUI, FBSearchUI, OfferUpSearchUI } from "./SearchProgressCard";
import { ScoreDealUI } from "./DealScoreCard";
import { DraftMessageUI } from "./ContactApproval";

/**
 * Registers all tool UIs with assistant-ui.
 * Render this inside AssistantRuntimeProvider — each component
 * self-registers via makeAssistantToolUI / useAssistantToolUI.
 */
export function ToolUIs() {
  return (
    <>
      <SearchProgressUI />
      <FBSearchUI />
      <OfferUpSearchUI />
      <ScoreDealUI />
      <DraftMessageUI />
    </>
  );
}
