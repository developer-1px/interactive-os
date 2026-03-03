/**
 * APG Tabs Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * W3C APG Example: Danish Composers biographical tabs.
 *
 * Two activation modes:
 *   - Automatic: selection follows focus (followFocus: true)
 *   - Manual: arrow keys move focus only, Enter/Space activates
 *
 * Headless pattern:
 *   OS injects aria-selected, role="tab", tabIndex onto Item.
 *   Item.Content auto-manages role="tabpanel" + aria-labelledby + hidden.
 *   CSS reads those attributes. No manual state management needed.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { useState } from "react";

// ─── Tab Data (W3C APG Example: Danish Composers) ───

interface TabDefinition {
  id: string;
  label: string;
  content: {
    name: string;
    dates: string;
    description: string;
  };
}

const TABS: TabDefinition[] = [
  {
    id: "tab-ahlefeldt",
    label: "Maria Theresia Ahlefeldt",
    content: {
      name: "Maria Theresia Ahlefeldt",
      dates: "16 January 1755 – 20 December 1810",
      description:
        "Maria Theresia Ahlefeldt was a Danish, originally German, composer. She is known as the first female composer in Denmark. Maria Theresia composed music for several ballets, operas, and plays of the royal theatre. She was given good critic as a composer and described as a \"virkelig Tonekunstnerinde\" ('a True Artist of Music').",
    },
  },
  {
    id: "tab-andersen",
    label: "Carl Joachim Andersen",
    content: {
      name: "Carl Joachim Andersen",
      dates: "29 April 1847 – 7 May 1909",
      description:
        "Carl Joachim Andersen was a Danish flutist, conductor and composer born in Copenhagen, son of the flutist Christian Joachim Andersen. Both as a virtuoso and as composer of flute music, he is considered one of the best of his time. He was considered to be a tough leader and teacher and demanded as such a lot from his orchestras but through that style he reached a high level.",
    },
  },
  {
    id: "tab-fonseca",
    label: "Ida Henriette da Fonseca",
    content: {
      name: "Ida Henriette da Fonseca",
      dates: "July 27, 1802 – July 6, 1858",
      description:
        "Ida Henriette da Fonseca was a Danish opera singer and composer. Ida Henriette da Fonseca was the daughter of Abraham da Fonseca (1776–1849) and Marie Sofie Kiærskou (1784–1863). She and her sister Emilie da Fonseca were students of Giuseppe Siboni, choir master of the Opera in Copenhagen. She was given a place at the royal Opera alongside her sister the same year she debuted in 1827.",
    },
  },
  {
    id: "tab-lange-muller",
    label: "Peter Erasmus Lange-Müller",
    content: {
      name: "Peter Erasmus Lange-Müller",
      dates: "1 December 1850 – 26 February 1926",
      description:
        "Peter Erasmus Lange-Müller was a Danish composer and pianist. His compositional style was influenced by Danish folk music and by the work of Robert Schumann; Johannes Brahms; and his Danish countrymen, including J.P.E. Hartmann.",
    },
  },
];

// ─── OS App + Zone (Automatic mode) ───

const TabsApp = defineApp("apg-tabs", {});

const autoZone = TabsApp.createZone("tablist-auto");
const AutoUI = autoZone.bind({
  role: "tablist",
  options: { select: { followFocus: true } },
});

const manualZone = TabsApp.createZone("tablist-manual");
const ManualUI = manualZone.bind({
  role: "tablist",
  options: { select: { followFocus: false } },
});

// ─── Tab Panel Content (shared between modes) ───

function TabPanelContent({ tab }: { tab: TabDefinition }) {
  return (
    <>
      <p className="text-base leading-relaxed text-gray-700">
        <strong>{tab.content.name}</strong>
        <br />
        <span className="text-sm text-gray-500">({tab.content.dates})</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {tab.content.description}
      </p>
    </>
  );
}

// ─── Tab List (reusable for both modes) ───

function TabListSection({ UI, label }: { UI: typeof AutoUI; label: string }) {
  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden shadow-sm">
      {/* Tab List */}
      <UI.Zone
        className="flex border-b border-gray-300 bg-gray-100"
        aria-label={label}
      >
        {TABS.map((tab) => (
          <UI.Item
            key={tab.id}
            id={tab.id}
            className="
              relative px-4 py-3 text-sm font-medium cursor-pointer select-none
              border-r border-gray-300 last:border-r-0
              text-gray-600
              hover:bg-gray-50
              aria-selected:bg-white aria-selected:text-indigo-700
              aria-selected:border-t-2 aria-selected:border-t-indigo-600
              aria-selected:-mb-px aria-selected:border-b-white
              data-[focused=true]:outline-none data-[focused=true]:ring-2
              data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-inset
              transition-colors
            "
          >
            {tab.label}
          </UI.Item>
        ))}
      </UI.Zone>

      {/* Tab Panels — OS-driven visibility via Item.Content */}
      <div className="bg-white min-h-[140px]">
        {TABS.map((tab) => (
          <UI.Item.Content
            key={tab.id}
            for={tab.id}
            className="p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400"
          >
            <TabPanelContent tab={tab} />
          </UI.Item.Content>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───

export function TabsPattern() {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const isAuto = mode === "auto";

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-1">Tabs</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Example: Biographical information about four Danish composers.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec →
        </a>
      </p>

      {/* Activation Mode Toggle */}
      <fieldset className="mb-4 flex items-center gap-4 text-sm">
        <legend className="font-medium text-gray-700 mr-2">Activation:</legend>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="tab-activation"
            value="auto"
            checked={isAuto}
            onChange={() => setMode("auto")}
            className="accent-indigo-600"
          />
          <span
            className={
              isAuto ? "font-semibold text-indigo-700" : "text-gray-600"
            }
          >
            Automatic
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="tab-activation"
            value="manual"
            checked={!isAuto}
            onChange={() => setMode("manual")}
            className="accent-indigo-600"
          />
          <span
            className={
              !isAuto ? "font-semibold text-indigo-700" : "text-gray-600"
            }
          >
            Manual
          </span>
        </label>
        <span className="text-xs text-gray-400 ml-2">
          {isAuto
            ? "Arrow keys change selection immediately"
            : "Arrow keys move focus, Enter/Space selects"}
        </span>
      </fieldset>

      {/* Render active mode */}
      {isAuto ? (
        <TabListSection UI={AutoUI} label="Danish Composers" />
      ) : (
        <TabListSection UI={ManualUI} label="Danish Composers" />
      )}
    </div>
  );
}
