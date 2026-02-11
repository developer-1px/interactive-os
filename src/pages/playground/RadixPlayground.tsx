/**
 * Radix Playground — Interactive showcase for ZIFT Dialog component.
 *
 * Demonstrates:
 *  1. Basic Dialog (open/close/ESC)
 *  2. Nested Dialogs (focus stack)
 *  3. Dialog with actions
 */

import { Dialog } from "@os/6-components/radox/Dialog.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { FocusGroup } from "@os/6-components/base/FocusGroup.tsx";
import { FocusItem } from "@os/6-components/base/FocusItem.tsx";
import { useRadixPlaygroundBotRoutes } from "./RadixPlaygroundBot";

export function RadixPlayground() {
    const resetKey = useRadixPlaygroundBotRoutes();

    return (
        <div key={resetKey} className="min-h-screen bg-slate-50 p-8">
            {/* Header */}
            <div className="max-w-3xl mx-auto mb-8">
                <h1 className="text-2xl font-bold text-slate-800">
                    Radix Playground
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    ZIFT Dialog — Radix interface, Kernel engine. Zero useState, Zero
                    useEffect.
                </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* ─── Demo 1: Basic Dialog ─── */}
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                        1. Basic Dialog
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">
                        Click "Open" to show a dialog. Press ESC or click backdrop to close.
                        Focus restores automatically.
                    </p>

                    <FocusGroup
                        id="radix-base"
                        role="listbox"
                        navigate={{ orientation: "horizontal" }}
                        className="flex gap-2"
                    >
                        <FocusItem
                            id="radix-item-1"
                            role="option"
                            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 aria-[current=true]:bg-indigo-50 aria-[current=true]:border-indigo-300 aria-[current=true]:text-indigo-700 text-sm transition-colors"
                        >
                            Item 1
                        </FocusItem>
                        <FocusItem
                            id="radix-item-2"
                            role="option"
                            className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 aria-[current=true]:bg-indigo-50 aria-[current=true]:border-indigo-300 aria-[current=true]:text-indigo-700 text-sm transition-colors"
                        >
                            Item 2
                        </FocusItem>

                        <Dialog>
                            <Dialog.Trigger>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                                >
                                    Open Dialog
                                </button>
                            </Dialog.Trigger>
                            <Dialog.Content title="Basic Dialog">
                                <div className="space-y-3">
                                    <Item
                                        id="basic-opt-1"
                                        role="menuitem"
                                        className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-indigo-50 aria-[current=true]:text-indigo-700 text-sm cursor-pointer transition-colors"
                                    >
                                        Option A
                                    </Item>
                                    <Item
                                        id="basic-opt-2"
                                        role="menuitem"
                                        className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-indigo-50 aria-[current=true]:text-indigo-700 text-sm cursor-pointer transition-colors"
                                    >
                                        Option B
                                    </Item>
                                    <Item
                                        id="basic-opt-3"
                                        role="menuitem"
                                        className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-indigo-50 aria-[current=true]:text-indigo-700 text-sm cursor-pointer transition-colors"
                                    >
                                        Option C
                                    </Item>
                                    <div className="pt-2 border-t border-slate-100">
                                        <Dialog.Close className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
                                            Close
                                        </Dialog.Close>
                                    </div>
                                </div>
                            </Dialog.Content>
                        </Dialog>
                    </FocusGroup>
                </section>

                {/* ─── Demo 2: Nested Dialogs ─── */}
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                        2. Nested Dialogs
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">
                        Dialogs can nest. Each level pushes onto the focus stack. Closing
                        restores to the previous level.
                    </p>

                    <Dialog>
                        <Dialog.Trigger>
                            <button
                                type="button"
                                className="px-4 py-2 bg-violet-500 text-white text-sm rounded-lg hover:bg-violet-600 transition-colors shadow-sm"
                            >
                                Open Level 1
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Content title="Level 1">
                            <div className="space-y-3">
                                <Item
                                    id="l1-item-1"
                                    role="menuitem"
                                    className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-violet-50 aria-[current=true]:text-violet-700 text-sm cursor-pointer transition-colors"
                                >
                                    Level 1 — Item A
                                </Item>
                                <Item
                                    id="l1-item-2"
                                    role="menuitem"
                                    className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-violet-50 aria-[current=true]:text-violet-700 text-sm cursor-pointer transition-colors"
                                >
                                    Level 1 — Item B
                                </Item>

                                {/* Nested Dialog */}
                                <Dialog>
                                    <Dialog.Trigger>
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 bg-pink-500 text-white text-xs rounded-md hover:bg-pink-600 transition-colors"
                                        >
                                            Open Level 2
                                        </button>
                                    </Dialog.Trigger>
                                    <Dialog.Content title="Level 2 (Nested)">
                                        <div className="space-y-3">
                                            <Item
                                                id="l2-item-1"
                                                role="menuitem"
                                                className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-pink-50 aria-[current=true]:text-pink-700 text-sm cursor-pointer transition-colors"
                                            >
                                                Level 2 — Item X
                                            </Item>
                                            <Item
                                                id="l2-item-2"
                                                role="menuitem"
                                                className="px-3 py-2 rounded hover:bg-slate-100 aria-[current=true]:bg-pink-50 aria-[current=true]:text-pink-700 text-sm cursor-pointer transition-colors"
                                            >
                                                Level 2 — Item Y
                                            </Item>
                                            <div className="pt-2 border-t border-slate-100">
                                                <Dialog.Close className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
                                                    Close Level 2
                                                </Dialog.Close>
                                            </div>
                                        </div>
                                    </Dialog.Content>
                                </Dialog>

                                <div className="pt-2 border-t border-slate-100">
                                    <Dialog.Close className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
                                        Close Level 1
                                    </Dialog.Close>
                                </div>
                            </div>
                        </Dialog.Content>
                    </Dialog>
                </section>

                {/* ─── Demo 3: Dialog with Actions ─── */}
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                        3. Confirmation Dialog
                    </h2>
                    <p className="text-xs text-slate-400 mb-4">
                        A confirmation pattern: title, description, and action buttons.
                    </p>

                    <Dialog>
                        <Dialog.Trigger>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                            >
                                Delete Item
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Content title="Are you sure?">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">
                                    This action cannot be undone. This will permanently delete the
                                    item from the system.
                                </p>
                                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                                    <Dialog.Close className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                                        Cancel
                                    </Dialog.Close>
                                    <Dialog.Close className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors">
                                        Delete
                                    </Dialog.Close>
                                </div>
                            </div>
                        </Dialog.Content>
                    </Dialog>
                </section>

                {/* ─── Code Example ─── */}
                <section className="bg-slate-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                        Usage — Zero useState
                    </h2>
                    <pre className="text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                        {`<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content title="Settings">
    <Item id="opt-1">Option A</Item>
    <Item id="opt-2">Option B</Item>
    <Dialog.Close>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog>`}
                    </pre>
                </section>
            </div>
        </div>
    );
}
