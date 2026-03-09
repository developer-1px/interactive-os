/** Mock for virtual:docs-meta — provides fake mtime data for test docs */
const docsMeta: Record<string, { mtime: number }> = {
  STATUS: { mtime: Date.now() },
  "0-inbox/test-doc": { mtime: Date.now() - 1000 },
  "1-project/sample": { mtime: Date.now() - 2000 },
};

export default docsMeta;
