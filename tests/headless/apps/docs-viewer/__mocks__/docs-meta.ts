/** Mock for virtual:docs-meta — provides fake mtime data for test docs */
const docsMeta: Record<string, { mtime: number }> = {
  STATUS: { mtime: Date.now() },
  "0-inbox/test-doc": { mtime: Date.now() - 1000 },
  "0-inbox/second-doc": { mtime: Date.now() - 2000 },
  "1-project/sample": { mtime: Date.now() - 3000 },
  "1-project/design": { mtime: Date.now() - 4000 },
  "1-project/roadmap": { mtime: Date.now() - 5000 },
  "2-area/notes": { mtime: Date.now() - 6000 },
  "2-area/patterns": { mtime: Date.now() - 7000 },
};

export default docsMeta;
