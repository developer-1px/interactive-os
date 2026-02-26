/**
 * Block Registry — Single source of truth for block type → component mapping.
 *
 * Every block type in the builder resolves through this registry.
 * BuilderPage and NCPTabNavBlock both consume this same map.
 *
 * To add a new block:
 *   1. Create the component in src/pages/builder/
 *   2. Add it to this registry
 *   — No other files need to be modified.
 */

import type React from "react";
import {
  NCPFeatureCardsBlock,
  NCPFooterBlock,
  NCPHeroBlock,
  NCPNewsBlock,
  NCPNoticeBlock,
  NCPPricingBlock,
  NCPProductHeroBlock,
  NCPRelatedServicesBlock,
  NCPSectionFooterBlock,
  NCPServicesBlock,
  NCPTabNavBlock,
  TabContainerBlock,
} from "@/pages/builder";

export const BLOCK_REGISTRY: Record<string, React.FC<{ id: string }>> = {
  hero: NCPHeroBlock,
  news: NCPNewsBlock,
  services: NCPServicesBlock,
  pricing: NCPPricingBlock,
  tabs: TabContainerBlock,
  footer: NCPFooterBlock,
  "ncp-product-hero": NCPProductHeroBlock,
  "ncp-feature-cards": NCPFeatureCardsBlock,
  "ncp-notice": NCPNoticeBlock,
  "ncp-section-footer": NCPSectionFooterBlock,
  "ncp-related-services": NCPRelatedServicesBlock,
  "ncp-tab-nav": NCPTabNavBlock,
};
