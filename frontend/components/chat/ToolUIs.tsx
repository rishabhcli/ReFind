"use client";

import {
  MercariSearchUI,
  CraigslistSearchUI,
  GoodwillSearchUI,
  OfferUpSearchUI,
  FacebookSearchUI,
  FBSearchUI,
} from "./SearchProgressCard";
import { ScoreDealUI, ShortlistResultUI } from "./DealScoreCard";
import { DraftMessageUI } from "./ContactApproval";

/**
 * Registers all tool UIs with assistant-ui.
 * Must be rendered inside AssistantRuntimeProvider.
 */
export function ToolUIs() {
  return (
    <>
      {/* Search source progress badges */}
      <MercariSearchUI />
      <CraigslistSearchUI />
      <GoodwillSearchUI />
      <OfferUpSearchUI />
      <FacebookSearchUI />
      <FBSearchUI />

      {/* Scoring status */}
      <ScoreDealUI />

      {/* Full deal cards (one per top result) */}
      <ShortlistResultUI />

      {/* Seller contact approval */}
      <DraftMessageUI />
    </>
  );
}
