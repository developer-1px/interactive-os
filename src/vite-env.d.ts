/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.spec.ts" {
  const content: unknown;
  export default content;
}

declare module "virtual:docs-meta" {
  const meta: Record<string, { mtime: number }>;
  export default meta;
}

declare module "virtual:agent-activity" {
  interface AgentActivityEntry {
    ts: string;
    session: string;
    tool: string;
    detail: string;
  }
  const entries: AgentActivityEntry[];
  export default entries;
}
