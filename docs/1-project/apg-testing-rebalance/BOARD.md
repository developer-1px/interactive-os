# BOARD — APG Testing Rebalance

## 🔴 Now
- [x] **Infrastructure: KernelTestKit**
  - [x] Refactor `src/os/tests/createHeadlessTest.ts` to be a reusable test fixture (Global Kernel). (Step 302)
  - [x] Verified by `deletion-focus.test.ts` success.
- [ ] **Migration: Delete/Focus**
  - [x] Create `src/os/3-commands/tests/integration/deletion-focus.test.ts`. (Step 305)
  - [x] Reproduce the "Delete -> Focus Draft" bug *headless*. (Step 329)
  - [x] Verify fix works headless. (Step 329)
- [ ] **Migration: Multi-Select**
  - [ ] Create `src/os/3-commands/tests/integration/selection.test.ts` (Shift/Cmd logic).
  - [ ] Verify selection states across commands.

## ⏳ Done
- [x] **Analysis**: Executed `@[/doubt]` on current test suite.
- [x] **Setup**: Created project structure.

## 💡 Ideas
- Consider using property-based testing (fast-check) for `navigation` logic?
- Integrate `Snapshot Testing` for kernel state changes?
