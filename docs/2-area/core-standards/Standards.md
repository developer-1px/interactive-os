# Standards: Coding & Architecture

## 1. The Anti-Noise Mandate
To maintain a high-signal workspace for both Humans and AI:
- **No Barrel Files**: Avoid `index.ts` files. They create "Index-Hell" and make file searching inefficient.
- **Strict Symbol Matching**: File names must exactly match the primary symbol they export (e.g., `TodoEngine.tsx` exports `TodoEngine`).

## 2. Naming Conventions

### Abbreviations
We distinguish between **Ambiguous Abbreviations** (Bad) and **Standard Conventions** (Good).

#### ✅ Acceptable Standard Abbreviations
- `ctx` (Context)
- `cmd` (Command)
- `id` (Identifier)
- `ref` (Reference)
- `props` (Properties)
- `e` (Event)

#### ❌ Avoid Ambiguous Abbreviations
- `cat` -> Use `category`
- `val` -> Use `value`
- `nav` -> Use `navigation`
- `idx` -> Use `index`
- `err` -> Use `error`

## 3. AI-Safe Syntax (Expect-Pattern)
For logic builders and assertions, we prefer **E2E-style syntax** over custom builders.
- **Rule**: Use `Expect(item).toBeValid()` instead of `Rule().item().isValid()`.
- **Rationale**: LLMs are heavily trained on Jest/Playwright patterns. Aligning with this "Training Set Bias" significantly improves generation reliability and reduces hallucination.
