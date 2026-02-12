import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
});

export function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${crypto.randomUUID()}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = idRef.current;

    let cancelled = false;
    mermaid
      .render(id, code.trim())
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Mermaid render error:", err);
          setError(String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden my-8 border border-red-200 bg-red-50/50 p-5 max-w-4xl">
        <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
          Mermaid Error
        </div>
        <pre className="text-[12px] font-mono text-red-600 whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden my-8 border border-slate-200 bg-white shadow-sm max-w-4xl">
      <div className="flex items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50 justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          mermaid
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-5 flex justify-center [&>svg]:max-w-full"
      />
    </div>
  );
}
