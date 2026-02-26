import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractHeadings, type TocHeading } from "./docsUtils";

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track which heading is currently visible via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    // Small delay to let markdown render complete
    const timer = setTimeout(() => {
      const elements = headings
        .map((h) => document.getElementById(h.slug))
        .filter((el): el is HTMLElement => el !== null);

      if (elements.length === 0) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Find the topmost visible heading
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            );

          if (visible[0]) {
            setActiveSlug(visible[0].target.id);
          }
        },
        {
          rootMargin: "-10% 0px -75% 0px",
          threshold: 0,
        },
      );

      for (const el of elements) {
        observerRef.current.observe(el);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [headings]);

  const handleClick = useCallback((slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSlug(slug);
    }
  }, []);

  if (headings.length < 2) return null;

  // Find the minimum depth to normalize indentation
  const minDepth = Math.min(...headings.map((h) => h.depth));

  return (
    <nav
      className={clsx(
        "fixed right-8 top-[7rem] max-h-[calc(100vh-8rem)] overflow-y-auto",
        "w-36 hidden xl:block",
        className,
      )}
    >
      <ul className="space-y-px border-l border-slate-200/40">
        {headings.map((heading) => (
          <TocItem
            key={heading.slug}
            heading={heading}
            minDepth={minDepth}
            isActive={activeSlug === heading.slug}
            onClick={handleClick}
          />
        ))}
      </ul>
    </nav>
  );
}

function TocItem({
  heading,
  minDepth,
  isActive,
  onClick,
}: {
  heading: TocHeading;
  minDepth: number;
  isActive: boolean;
  onClick: (slug: string) => void;
}) {
  const indent = heading.depth - minDepth;

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(heading.slug)}
        className={clsx(
          "block w-full text-left text-[10px] leading-tight py-0.5 truncate transition-colors duration-150",
          indent === 0 && "pl-2 font-medium",
          indent === 1 && "pl-4",
          indent >= 2 && "pl-6",
          isActive
            ? "text-indigo-500 border-l border-indigo-400 -ml-px"
            : "text-slate-400 hover:text-slate-600",
        )}
      >
        {heading.text}
      </button>
    </li>
  );
}
