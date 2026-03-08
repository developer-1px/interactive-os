/**
 * OS Test Suite: Field Lifecycle
 *
 * Exercises field commit triggers side by side:
 *   1. trigger:"enter" — type + Enter commits
 *   2. trigger:"change" — type auto-commits on change
 *   3. Field cancel (Escape) restores previous value
 *
 * Known gap: OG-013 — trigger:"change" doesn't auto-commit in headless.
 * Known gap: OG-014 — cross-zone editingItemId not transferred.
 */

import { Item, Zone } from "@os-react/internal";
import { Field } from "@os-react/6-project/field/Field";
import { defineApp } from "@os-sdk/app/defineApp";
import { produce } from "immer";
import type { TestCase } from "../index";

export const fieldLifecycleTests: TestCase[] = [
  { name: "type() sets field text", status: "pass" },
  { name: "field cancel (Escape) clears text", status: "pass" },
  { name: "type + Enter commits via onCommit", status: "fail", gap: "Enter routes to OS_ACTIVATE not OS_FIELD_COMMIT" },
  { name: "field text persists across type calls", status: "pass" },
  { name: "keyboard.press works in field zone", status: "pass" },
  { name: "trigger:change auto-commits on type", status: "fail", gap: "OG-013 trigger:change headless" },
  { name: "Tab to second field zone", status: "pass" },
];

// ─── App Definition ───

export interface FieldTestState {
  enterValue: string;
  changeValue: string;
}

const INITIAL_STATE: FieldTestState = {
  enterValue: "",
  changeValue: "",
};

export const FieldLifecycleApp = defineApp<FieldTestState>(
  "os-test-field-lifecycle",
  INITIAL_STATE,
);

// ─── Enter Trigger Zone ───

const enterZone = FieldLifecycleApp.createZone("field-enter-zone");

export const setEnterValue = enterZone.command(
  "setEnterValue",
  (ctx, payload: { value?: string; text?: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.enterValue = payload.value ?? payload.text ?? "";
    }),
  }),
);

const EnterFieldUI = enterZone.bind({
  role: "textbox",
  field: {
    fieldName: "enterField",
    onCommit: setEnterValue,
    trigger: "enter",
  },
});

// ─── Change Trigger Zone ───

const changeZone = FieldLifecycleApp.createZone("field-change-zone");

export const setChangeValue = changeZone.command(
  "setChangeValue",
  (ctx, payload: { value?: string; text?: string }) => ({
    state: produce(ctx.state, (draft) => {
      draft.changeValue = payload.value ?? payload.text ?? "";
    }),
  }),
);

const ChangeFieldUI = changeZone.bind({
  role: "textbox",
  field: {
    fieldName: "changeField",
    onCommit: setChangeValue,
    trigger: "change",
  },
});

// ─── React Component ───

export function FieldLifecyclePattern() {
  const state = FieldLifecycleApp.useComputed((s) => s);

  return (
    <div className="max-w-md space-y-8">
      <h3 className="text-lg font-semibold mb-3">Field Lifecycle</h3>
      <p className="text-sm text-gray-500 mb-4">
        Two fields with different commit triggers. Type text and observe when
        the value commits to app state.
      </p>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          trigger: &quot;enter&quot; — commit on Enter key
        </p>
        <EnterFieldUI.Zone
          aria-label="Enter trigger field"
          className="border border-gray-200 rounded-lg bg-white"
        >
          <Field.Editable
            className="
              w-full px-4 py-3 text-sm outline-none
              focus:ring-2 focus:ring-inset focus:ring-emerald-300 rounded-lg
            "
            placeholder="Type and press Enter to commit..."
          />
        </EnterFieldUI.Zone>
        <p className="text-xs text-gray-400">
          Committed value:{" "}
          <code className="bg-gray-100 px-1 rounded">
            {state?.enterValue || "(empty)"}
          </code>
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          trigger: &quot;change&quot; — commit on every change
        </p>
        <ChangeFieldUI.Zone
          aria-label="Change trigger field"
          className="border border-gray-200 rounded-lg bg-white"
        >
          <Field.Editable
            className="
              w-full px-4 py-3 text-sm outline-none
              focus:ring-2 focus:ring-inset focus:ring-emerald-300 rounded-lg
            "
            placeholder="Type to auto-commit..."
          />
        </ChangeFieldUI.Zone>
        <p className="text-xs text-gray-400">
          Committed value:{" "}
          <code className="bg-gray-100 px-1 rounded">
            {state?.changeValue || "(empty)"}
          </code>
        </p>
      </div>
    </div>
  );
}
