"use client";

import {
  EbaySearchUI,
  MercariSearchUI,
  CraigslistSearchUI,
  GoodwillSearchUI,
  OfferUpSearchUI,
  FacebookSearchUI,
  FBSearchUI,
  PoshmarkSearchUI,
  BrowserEnricherUI,
} from "./SearchProgressCard";
import { ScoreDealUI, ShortlistResultUI, NegotiateStrategyUI } from "./DealScoreCard";
import { DraftMessageUI } from "./ContactApproval";

/**
 * Registers all tool UIs with assistant-ui.
 * Must be rendered inside AssistantRuntimeProvider.
 */
export function ToolUIs() {
  return (
    <>
      <EbaySearchUI />
      <MercariSearchUI />
      <CraigslistSearchUI />
      <GoodwillSearchUI />
      <FacebookSearchUI />
      <FBSearchUI />
      <OfferUpSearchUI />
      <PoshmarkSearchUI />
      <ScoreDealUI />
      <BrowserEnricherUI />
      <ShortlistResultUI />
      <NegotiateStrategyUI />
      <DraftMessageUI />
    </>
  );
}
