/**
 * ARIA Standard Showcase
 * Demonstrates standard ARIA patterns using FocusGroup facade.
 */

import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";

export function AriaShowcasePage() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ARIA Standard Showcase
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Standard ARIA widget patterns implemented with FocusGroup
                </p>
            </header>

            {/* Test Section */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Interaction Tests</h2>
                <div className="max-w-md">
                    <AriaInteractionTest />
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Tabs */}
                <AriaCard title="Tabs" ariaRole="tablist">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <FocusGroup
                            id="demo-tablist"
                            role="tablist"
                            navigate={{ orientation: 'horizontal' }}
                            aria-label="Account settings"
                            className="flex bg-gray-100 border-b border-gray-200"
                        >
                            <FocusItem id="tab-account" role="tab" aria-selected="true" aria-controls="panel-account" className="px-4 py-2 text-sm font-medium border-b-2 border-indigo-500 bg-white text-indigo-600">
                                Account
                            </FocusItem>
                            <FocusItem id="tab-security" role="tab" aria-selected="false" aria-controls="panel-security" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
                                Security
                            </FocusItem>
                            <FocusItem id="tab-billing" role="tab" aria-selected="false" aria-controls="panel-billing" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
                                Billing
                            </FocusItem>
                        </FocusGroup>
                        <div id="panel-account" role="tabpanel" aria-labelledby="tab-account" className="p-4 text-sm text-gray-600">
                            Account panel content...
                        </div>
                    </div>
                </AriaCard>

                {/* 2. Menu */}
                <AriaCard title="Menu" ariaRole="menu">
                    <FocusGroup
                        id="demo-menu"
                        role="menu"
                        navigate={{ orientation: 'vertical', loop: true }}
                        tab={{ behavior: 'trap' }}
                        aria-label="File actions"
                        className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                    >
                        <FocusItem id="menu-new" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=true]:bg-indigo-50">New File</FocusItem>
                        <FocusItem id="menu-open" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=true]:bg-indigo-50">Open...</FocusItem>
                        <div role="separator" className="my-1 border-t border-gray-200" />
                        <FocusItem id="menu-save" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=true]:bg-indigo-50">Save</FocusItem>
                        <FocusItem id="menu-saveas" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=true]:bg-indigo-50">Save As...</FocusItem>
                    </FocusGroup>
                </AriaCard>

                {/* 3. Listbox */}
                <AriaCard title="Listbox" ariaRole="listbox">
                    <FocusGroup
                        id="demo-listbox"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single' }}
                        aria-label="Select a user"
                        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto"
                    >
                        {['Wade Cooper', 'Arlene Mccoy', 'Devon Webb', 'Tom Cook', 'Tanya Fox'].map((name, i) => (
                            <FocusItem key={name} id={`user-${i}`} role="option" className="px-4 py-2.5 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50 aria-[current=true]:text-indigo-700">
                                {name}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 4. Radiogroup */}
                <AriaCard title="Radio Group" ariaRole="radiogroup">
                    <FocusGroup
                        id="demo-radiogroup"
                        role="radiogroup"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single', followFocus: true, disallowEmpty: true }}
                        aria-labelledby="radio-label"
                        className="space-y-2"
                    >
                        <div id="radio-label" className="text-xs font-semibold text-gray-500 mb-2">Notification Preference</div>
                        {[
                            { id: 'all', label: 'All notifications' },
                            { id: 'mentions', label: 'Mentions only' },
                            { id: 'none', label: 'None' },
                        ].map((opt, i) => (
                            <FocusItem key={opt.id} id={`radio-${opt.id}`} role="radio" aria-checked={i === 0} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 aria-[current=true]:ring-2 ring-indigo-300">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 0 ? 'border-indigo-500' : 'border-gray-300'}`}>
                                    {i === 0 && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                </div>
                                <span className="text-sm">{opt.label}</span>
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 5. Toolbar */}
                <AriaCard title="Toolbar" ariaRole="toolbar">
                    <FocusGroup
                        id="demo-toolbar"
                        role="toolbar"
                        navigate={{ orientation: 'horizontal' }}
                        aria-label="Text formatting"
                        className="flex gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200"
                    >
                        {[
                            { id: 'bold', label: 'B', title: 'Bold' },
                            { id: 'italic', label: 'I', title: 'Italic' },
                            { id: 'underline', label: 'U', title: 'Underline' },
                            { id: 'strike', label: 'S', title: 'Strikethrough' },
                        ].map(btn => (
                            <FocusItem key={btn.id} id={`tool-${btn.id}`} role="button" aria-label={btn.title} className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold text-gray-600 hover:bg-gray-200 aria-[current=true]:bg-indigo-100">
                                {btn.label}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 6. Grid */}
                <AriaCard title="Grid" ariaRole="grid">
                    <FocusGroup
                        id="demo-grid"
                        role="grid"
                        navigate={{ orientation: 'both' }}
                        select={{ mode: 'multiple', range: true }}
                        aria-label="Calendar"
                        className="grid grid-cols-4 gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <FocusItem key={i} id={`cell-${i}`} role="gridcell" aria-colindex={(i % 4) + 1} aria-rowindex={Math.floor(i / 4) + 1} className="aspect-square flex items-center justify-center rounded text-xs bg-white hover:bg-gray-50 aria-[current=true]:bg-indigo-100">
                                {i + 1}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 7. Tree */}
                <AriaCard title="Tree" ariaRole="tree">
                    <FocusGroup
                        id="demo-tree"
                        role="tree"
                        navigate={{ orientation: 'vertical' }}
                        aria-label="File explorer"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                    >
                        <FocusItem id="tree-src" role="treeitem" aria-expanded="true" aria-level={1} className="px-2 py-1 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50 rounded">📁 src</FocusItem>
                        <FocusItem id="tree-components" role="treeitem" aria-level={2} className="pl-6 px-2 py-1 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50 rounded">📁 components</FocusItem>
                        <FocusItem id="tree-app" role="treeitem" aria-level={2} className="pl-6 px-2 py-1 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50 rounded">📄 App.tsx</FocusItem>
                        <FocusItem id="tree-index" role="treeitem" aria-level={2} className="pl-6 px-2 py-1 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50 rounded">📄 index.tsx</FocusItem>
                    </FocusGroup>
                </AriaCard>

                {/* 8. Menubar */}
                <AriaCard title="Menubar" ariaRole="menubar">
                    <FocusGroup
                        id="demo-menubar"
                        role="menubar"
                        navigate={{ orientation: 'horizontal' }}
                        aria-label="Application menu"
                        className="flex bg-gray-800 text-white rounded-lg"
                    >
                        {['File', 'Edit', 'View', 'Help'].map(item => (
                            <FocusItem key={item} id={`menubar-${item.toLowerCase()}`} role="menuitem" aria-haspopup="menu" className="px-4 py-2 text-sm hover:bg-gray-700 aria-[current=true]:bg-gray-600 rounded-lg">
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 9. Combobox */}
                <AriaCard title="Combobox" ariaRole="combobox">
                    <div className="relative">
                        <input
                            type="text"
                            role="combobox"
                            aria-expanded="true"
                            aria-controls="combo-listbox"
                            aria-autocomplete="list"
                            aria-activedescendant="combo-opt-1"
                            placeholder="Search..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                        />
                        <FocusGroup
                            id="combo-listbox"
                            role="listbox"
                            navigate={{ orientation: 'vertical' }}
                            aria-label="Suggestions"
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                        >
                            {['Apple', 'Banana', 'Cherry', 'Date'].map((fruit, i) => (
                                <FocusItem key={fruit} id={`combo-opt-${i}`} role="option" className="px-3 py-2 text-sm hover:bg-gray-50 aria-[current=true]:bg-indigo-50">
                                    {fruit}
                                </FocusItem>
                            ))}
                        </FocusGroup>
                    </div>
                </AriaCard>
            </div>
        </div>
    );
}

function AriaCard({ title, ariaRole, children }: { title: string; ariaRole: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-700">{title}</h3>
                <code className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">role="{ariaRole}"</code>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
}

export default AriaShowcasePage;
