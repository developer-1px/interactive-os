# Abbreviation Naming Convention Refinement

**Date**: 2026-02-02
**Source**: User Feedback
**Related**: `.agent/rules.md`

## Context
The user noted that strict "No Abbreviations" rules might conflict with industry-standard conventions that are effectively their own terms, such as:
- `ctx` (Context)
- `cmd` (Command)
- `id` (Identifier)
- `ref` (Reference)

## Decision
We need to refine the naming convention rule to distinguish between **Ambiguous Abbreviations** (bad) and **Standard Conventions** (acceptable).

- **Bad**: `cat` (Category? Catalog?), `val` (Value? Valid?), `nav` (Navigation?)
- **Good/Acceptable**: `ctx`, `cmd`, `id`, `ref`, `props`, `e` (event)

## Action Items
1. Update `.agent/rules.md` to explicitly list acceptable standard abbreviations.
2. Continue with refactoring of *ambiguous* abbreviations (e.g., `cat` -> `category`).
3. Stop any planned refactoring of widely accepted terms like `ctx` or `cmd`.
