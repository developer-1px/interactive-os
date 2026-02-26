/**
 * TREE_TEST_BLOCKS — Shared fixture for tree-aware collection tests.
 *
 * Structure:
 *   hero-1 (root)
 *   tab-container-1 (accept: ["tab"])
 *     ├─ tab-1-overview (accept: ["section"])
 *     │   └─ tab-1-overview-s1
 *     ├─ tab-1-details (accept: ["section"])
 *     │   └─ tab-1-details-s1
 *     └─ tab-1-faq
 *   ncp-news (root)
 *   ncp-pricing (root)
 *   ncp-footer (root)
 *   ncp-cta (root)
 *
 * 6 root blocks, 3 tabs, 2 sections = 11 total nodes.
 */

import type { Block } from "@apps/builder/model/appState";

export const TREE_TEST_BLOCKS: Block[] = [
    {
        id: "hero-1",
        type: "hero",
        label: "Hero",
        fields: { title: "Test Hero" },
    },
    {
        id: "tab-container-1",
        type: "tabs",
        label: "Tabs Container",
        fields: {},
        accept: ["tab"],
        children: [
            {
                id: "tab-1-overview",
                type: "tab",
                label: "Overview",
                fields: {},
                accept: ["section"],
                children: [
                    {
                        id: "tab-1-overview-s1",
                        type: "section",
                        label: "Overview S1",
                        fields: { text: "Overview section content" },
                    },
                ],
            },
            {
                id: "tab-1-details",
                type: "tab",
                label: "Details",
                fields: {},
                accept: ["section"],
                children: [
                    {
                        id: "tab-1-details-s1",
                        type: "section",
                        label: "Details S1",
                        fields: { text: "Details section content" },
                    },
                ],
            },
            {
                id: "tab-1-faq",
                type: "tab",
                label: "FAQ",
                fields: {},
            },
        ],
    },
    {
        id: "ncp-news",
        type: "news",
        label: "News",
        fields: { title: "Latest News" },
    },
    {
        id: "ncp-pricing",
        type: "pricing",
        label: "Pricing",
        fields: { title: "Pricing Plans" },
    },
    {
        id: "ncp-footer",
        type: "footer",
        label: "Footer",
        fields: { brand: "Test Brand" },
    },
    {
        id: "ncp-cta",
        type: "cta",
        label: "CTA",
        fields: { title: "Call to Action" },
    },
];
