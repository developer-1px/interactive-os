/**
 * APG Feed Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/
 *
 * W3C APG: Scrollable list of articles with keyboard navigation.
 *   - Page Down / Page Up: move between articles
 *   - Control+End / Control+Home: exit feed forward/backward
 *   - Tab: exit feed zone
 *   - Each article: role=article, aria-posinset, aria-setsize, aria-labelledby
 *
 * Headless pattern:
 *   OS injects data-focused, role=article, tabIndex onto Item.
 *   CSS reads those attributes. No render-prop, no JS state.
 *   aria-posinset and aria-setsize are data attributes set by the component.
 */

import { defineApp } from "@os-sdk/app/defineApp";

// ─── Article Data ───

interface FeedArticle {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  title: string;
  summary: string;
}

const ARTICLES: FeedArticle[] = [
  {
    id: "article-1",
    author: "Alice Chen",
    avatar: "AC",
    timestamp: "2 hours ago",
    title: "Getting Started with Accessible Web Components",
    summary:
      "Building accessible components is not just about compliance. It is about creating experiences that work for everyone. In this article, we explore the fundamentals of ARIA roles and keyboard navigation patterns.",
  },
  {
    id: "article-2",
    author: "Bob Martinez",
    avatar: "BM",
    timestamp: "5 hours ago",
    title: "The Feed Pattern: Infinite Scroll Done Right",
    summary:
      "Infinite scroll can be a nightmare for screen reader users. The W3C APG Feed pattern provides a contract between web pages and assistive technologies that makes scrollable content accessible.",
  },
  {
    id: "article-3",
    author: "Carol Washington",
    avatar: "CW",
    timestamp: "1 day ago",
    title: "Keyboard Navigation Patterns You Should Know",
    summary:
      "Page Down, Page Up, Control+End, Control+Home. These are not just convenience shortcuts, they are essential navigation keys defined by the WAI-ARIA Authoring Practices Guide.",
  },
  {
    id: "article-4",
    author: "David Kim",
    avatar: "DK",
    timestamp: "2 days ago",
    title: "Understanding ARIA Roles and Properties",
    summary:
      "Every ARIA role carries semantic meaning. The feed role tells assistive technologies that this is a scrollable list of articles. The article role identifies each piece of content within that feed.",
  },
  {
    id: "article-5",
    author: "Elena Popov",
    avatar: "EP",
    timestamp: "3 days ago",
    title: "Testing Accessibility with Headless Tools",
    summary:
      "You do not need a browser to verify accessibility contracts. Headless testing lets you validate ARIA attributes, keyboard interactions, and focus management without any DOM rendering.",
  },
];

// ─── App + Zone (defineApp pattern) ───

const FeedApp = defineApp<Record<string, never>>("apg-feed-app", {});
const feedZone = FeedApp.createZone("apg-feed");
const FeedUI = feedZone.bind({ role: "feed" });

// ─── Article Card ───
// Zero render-prop. Zero JS state.
// OS → data-focused, role=article, tabIndex → CSS reads them.

function ArticleCard({
  article,
  index,
  total,
}: {
  article: FeedArticle;
  index: number;
  total: number;
}) {
  const labelId = `${article.id}-title`;
  const descId = `${article.id}-desc`;

  return (
    <FeedUI.Item
      id={article.id}
      aria-posinset={index + 1}
      aria-setsize={total}
      aria-labelledby={labelId}
      aria-describedby={descId}
      className="
        group p-5 bg-white border border-gray-200 rounded-lg
        transition-all duration-150
        data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:border-indigo-300
        data-[focused=true]:shadow-md
        hover:border-gray-300 hover:shadow-sm
      "
    >
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {article.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {article.author}
          </div>
          <div className="text-xs text-gray-400">{article.timestamp}</div>
        </div>
      </div>

      {/* Title */}
      <h3
        id={labelId}
        className="text-base font-semibold text-gray-900 mb-2 leading-snug"
      >
        {article.title}
      </h3>

      {/* Summary */}
      <p
        id={descId}
        className="text-sm text-gray-600 leading-relaxed line-clamp-3"
      >
        {article.summary}
      </p>

      {/* Actions (decorative, not interactive in this demo) */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">Like</span>
        <span className="text-xs text-gray-400">Comment</span>
        <span className="text-xs text-gray-400">Share</span>
      </div>
    </FeedUI.Item>
  );
}

// ─── Main Component ───

export function FeedPattern() {
  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Feed</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Feed Pattern: Scrollable list of articles. Page Down/Up moves
        between articles. Control+End/Home exits the feed.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/feed/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      <FeedUI.Zone
        className="space-y-3"
        aria-label="Example Feed"
      >
        {ARTICLES.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            index={index}
            total={ARTICLES.length}
          />
        ))}
      </FeedUI.Zone>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
        <div className="font-medium text-gray-700">Keyboard Shortcuts</div>
        <div>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">
            Page Down
          </kbd>{" "}
          / <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">
            Page Up
          </kbd>{" "}
          Move between articles
        </div>
        <div>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">
            Ctrl+End
          </kbd>{" "}
          / <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">
            Ctrl+Home
          </kbd>{" "}
          Exit feed
        </div>
        <div>
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono">
            Tab
          </kbd>{" "}
          Exit feed zone
        </div>
      </div>
    </div>
  );
}
