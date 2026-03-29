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
import { DraftMessageUI, ContactSellerUI } from "./ContactApproval";

/**
 * Registers all tool UIs with assistant-ui.
 * Must be rendered inside AssistantRuntimeProvider.
 */
export function ToolUIs() {
  return (
    <>
      {/* Search progress cards */}
      <EbaySearchUI />
      <MercariSearchUI />
      <CraigslistSearchUI />
      <GoodwillSearchUI />
      <FacebookSearchUI />
      <FBSearchUI />
      <OfferUpSearchUI />
      <PoshmarkSearchUI />
      <BrowserEnricherUI />
      {/* Deal scoring / shortlist */}
      <ScoreDealUI />
      <ShortlistResultUI />
      {/* Negotiation / contact */}
      <NegotiateStrategyUI />
      <DraftMessageUI />
      <ContactSellerUI />
    </>
  );
}
