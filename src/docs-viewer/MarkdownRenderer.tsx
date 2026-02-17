import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { extractText } from "./docsUtils";
import { MermaidBlock } from "./MermaidBlock";
import "./code-theme.css";

// biome-ignore lint/suspicious/noExplicitAny: ReactMarkdown component props
const MarkdownComponents: Record<string, React.FC<any>> = {
  h1: (props) => (
    <h1
      className="text-3xl font-extrabold tracking-tight mb-6 mt-4 text-slate-900 leading-[1.2] max-w-2xl"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-xl font-bold text-slate-850 mt-10 mb-5 tracking-tight border-b border-slate-100 pb-2.5 max-w-2xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-lg font-bold text-slate-800 mt-8 mb-3.5 tracking-tight max-w-2xl"
      {...props}
    />
  ),
  h4: (props) => (
    <h4
      className="text-[15px] font-bold text-slate-800 mt-6 mb-3 tracking-tight max-w-2xl"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="text-slate-600 leading-[1.65] mb-4 text-[14px] font-normal max-w-2xl"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="list-disc list-outside ml-6 mb-5 text-slate-600 space-y-1.5 text-[14px] marker:text-indigo-400 max-w-2xl"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="list-decimal list-outside ml-6 mb-5 text-slate-600 space-y-1.5 text-[14px] marker:text-indigo-400 font-medium max-w-2xl"
      {...props}
    />
  ),
  li: (props) => <li className="pl-2" {...props} />,
  strong: (props) => <strong className="font-bold text-slate-900" {...props} />,
  a: (props) => (
    <a
      className="text-indigo-600 font-medium hover:text-indigo-700 transition-all border-b border-indigo-200 hover:border-indigo-500 pb-0.5"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-indigo-500 pl-6 py-3 my-6 bg-slate-50 text-slate-700 italic rounded-r-xl text-[14px] font-medium max-w-2xl"
      {...props}
    />
  ),
  hr: (props) => <hr className="border-slate-100 my-8 max-w-2xl" {...props} />,
  // biome-ignore lint/suspicious/noExplicitAny: ReactMarkdown component props
  code: ({ className, children, ...props }: any) => {
    const isBlock =
      className?.includes("hljs") || className?.includes("language-");
    if (isBlock) {
      return (
        <code className={clsx("hljs", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium border border-slate-200/50"
        {...props}
      >
        {children}
      </code>
    );
  },
  // biome-ignore lint/suspicious/noExplicitAny: ReactMarkdown component props
  pre: ({ children, ...props }: any) => {
    const codeChild = children?.props;
    const langClass = codeChild?.className ?? "";
    const lang = langClass
      .replace(/language-/, "")
      .replace(/hljs/, "")
      .trim();

    // Mermaid block: render as diagram
    if (lang === "mermaid" || langClass.includes("language-mermaid")) {
      const code = extractText(codeChild?.children);
      return <MermaidBlock code={code} />;
    }

    return (
      <div className="rounded-xl overflow-hidden my-8 border border-slate-200 bg-[#fbfcfd] shadow-sm relative group max-w-4xl">
        <div className="flex items-center px-4 py-2 border-b border-slate-100 bg-slate-50/50 justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            {lang || "code"}
          </div>
        </div>
        <pre
          className="p-5 overflow-x-auto text-[12px] font-mono leading-relaxed [&>code]:bg-transparent [&>code]:p-0 [&>code]:rounded-none [&>code]:border-none"
          {...props}
        >
          {children}
        </pre>
      </div>
    );
  },
  table: (props) => (
    <div className="my-8 overflow-x-auto max-w-4xl border border-slate-200 rounded-lg">
      <table className="w-full border-collapse text-[13px]" {...props} />
    </div>
  ),
  thead: (props) => (
    <thead className="bg-slate-50/80 border-b border-slate-200" {...props} />
  ),
  th: (props) => (
    <th
      className="px-5 py-3 text-left font-bold text-slate-900 uppercase tracking-wider text-[10px]"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="px-5 py-3 border-b border-slate-100 text-slate-600"
      {...props}
    />
  ),
};

/** Shared markdown renderer with all plugins and styled components */
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="docs-content max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeHighlight, { ignoredLanguages: ["mermaid"] }]]}
        components={MarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
