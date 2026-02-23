import clsx from "clsx";
import { List } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type TocHeading, extractHeadings } from "./docsUtils";

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
                        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

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
                "sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto",
                "w-56 shrink-0 hidden xl:block",
                className,
            )}
        >
            <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <List size={12} />
                목차
            </div>
            <ul className="space-y-0.5 border-l border-slate-100">
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
                    "block w-full text-left text-[12px] leading-snug py-1 transition-all duration-200",
                    "hover:text-indigo-600",
                    indent === 0 && "pl-3 font-semibold",
                    indent === 1 && "pl-6 font-medium",
                    indent === 2 && "pl-9 font-normal",
                    indent >= 3 && "pl-12 font-normal",
                    isActive
                        ? "text-indigo-600 border-l-2 border-indigo-500 -ml-px"
                        : "text-slate-400 hover:text-slate-600",
                )}
                title={heading.text}
            >
                <span className="line-clamp-2">{heading.text}</span>
            </button>
        </li>
    );
}
