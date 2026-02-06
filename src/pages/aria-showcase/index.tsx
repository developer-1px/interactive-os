/**
 * ARIA Standard Showcase
 * Demonstrates standard ARIA patterns using FocusGroup facade.
 */

import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { AriaInteractionTest } from "./tests/AriaInteractionTest";
import { useFocusExpansion } from "@os/features/focus/hooks/useFocusExpansion";
import { useState } from "react";
import { Icon } from "@/lib/Icon";

export function AriaShowcasePage() {
    // State management for interactive examples
    const [selectedTab, setSelectedTab] = useState('tab-account');
    const [menuChecked, setMenuChecked] = useState<Record<string, boolean>>({ 'menu-ruler': true });
    const [pressedTools, setPressedTools] = useState<Record<string, boolean>>({ 'bold': true });
    // expandedTreeNodes removed - now using store-driven expansion
    const [isComboOpen, setIsComboOpen] = useState(true);
    const [isComboInvalid, setIsComboInvalid] = useState(false);
    const [radioValue, setRadioValue] = useState('all');
    const [gridSelection, setGridSelection] = useState<Record<string, boolean>>({});

    const toggleTool = (id: string) => {
        setPressedTools(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // toggleTreeNode removed - now using store-driven expansion

    const toggleGridCell = (id: string) => {
        setGridSelection(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <header className="mb-8">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ARIA Standard Showcase
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Standard ARIA widget patterns implemented with FocusGroup. now with interactive states.
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
                {/* 
                    ARIA States: 
                    - aria-selected: Visual indication of active tab
                    - aria-disabled: Visual indication of disabled tab
                */}
                <AriaCard title="Tabs" ariaRole="tablist">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <FocusGroup
                            id="demo-tablist"
                            role="tablist"
                            navigate={{ orientation: 'horizontal' }}
                            aria-label="Account settings"
                            className="flex bg-gray-100 border-b border-gray-200"
                        >
                            <FocusItem
                                id="tab-account"
                                role="tab"
                                as="button"
                                aria-selected={selectedTab === 'tab-account'}
                                aria-controls="panel-account"
                                onClick={() => setSelectedTab('tab-account')}
                                className="
                                    px-4 py-2 text-sm font-medium border-b-2 
                                    aria-selected:border-indigo-500 aria-selected:bg-white aria-selected:text-indigo-600
                                    aria-[selected=false]:border-transparent aria-[selected=false]:text-gray-500 aria-[selected=false]:hover:text-gray-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset
                                "
                            >
                                Account
                            </FocusItem>
                            <FocusItem
                                id="tab-security"
                                role="tab"
                                as="button"
                                aria-selected={selectedTab === 'tab-security'}
                                aria-controls="panel-security"
                                onClick={() => setSelectedTab('tab-security')}
                                className="
                                    px-4 py-2 text-sm font-medium border-b-2 
                                    aria-selected:border-indigo-500 aria-selected:bg-white aria-selected:text-indigo-600
                                    aria-[selected=false]:border-transparent aria-[selected=false]:text-gray-500 aria-[selected=false]:hover:text-gray-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset
                                "
                            >
                                Security
                            </FocusItem>
                            <FocusItem
                                id="tab-disabled"
                                role="tab"
                                aria-selected="false"
                                aria-disabled="true"
                                className="
                                    px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed
                                    aria-disabled:opacity-50
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-gray-200 data-[focused=true]:ring-inset
                                "
                            >
                                Disabled
                            </FocusItem>
                        </FocusGroup>
                        <div id="panel-account" role="tabpanel" aria-labelledby="tab-account" className="p-4 text-sm text-gray-600 h-24">
                            {selectedTab === 'tab-account' ? 'Account settings panel...' : selectedTab === 'tab-security' ? 'Security settings panel...' : 'Content hidden'}
                        </div>
                    </div>
                </AriaCard>

                {/* 2. Menu */}
                {/* 
                    ARIA States:
                    - aria-checked: Checkbox menu items
                    - aria-disabled: Disabled menu items
                */}
                <AriaCard title="Menu" ariaRole="menu">
                    <FocusGroup
                        id="demo-menu"
                        role="menu"
                        navigate={{ orientation: 'vertical', loop: true }}
                        tab={{ behavior: 'trap' }}
                        aria-label="File actions"
                        className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                    >
                        <FocusItem id="menu-new" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none">New File</FocusItem>
                        <FocusItem id="menu-open" role="menuitem" className="px-4 py-2 text-sm hover:bg-gray-100 data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none">Open...</FocusItem>

                        <div role="separator" className="my-1 border-t border-gray-200" />

                        <FocusItem
                            id="menu-ruler"
                            role="menuitemcheckbox"
                            as="button"
                            aria-checked={menuChecked['menu-ruler']}
                            onClick={() => setMenuChecked(p => ({ ...p, 'menu-ruler': !p['menu-ruler'] }))}
                            className="
                                w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 
                                data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
                                cursor-pointer
                            "
                        >
                            <span>Show Ruler</span>
                            {menuChecked['menu-ruler'] && <span className="text-indigo-600 font-bold">✓</span>}
                        </FocusItem>
                        <FocusItem
                            id="menu-grid"
                            role="menuitemcheckbox"
                            as="button"
                            aria-checked={menuChecked['menu-grid']}
                            onClick={() => setMenuChecked(p => ({ ...p, 'menu-grid': !p['menu-grid'] }))}
                            className="
                                w-full px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 
                                data-[focused=true]:bg-indigo-50 data-[focused=true]:outline-none
                                cursor-pointer
                            "
                        >
                            <span>Show Grid</span>
                            {menuChecked['menu-grid'] && <span className="text-indigo-600 font-bold">✓</span>}
                        </FocusItem>

                        <div role="separator" className="my-1 border-t border-gray-200" />

                        <FocusItem
                            id="menu-disabled"
                            role="menuitem"
                            aria-disabled="true"
                            className="px-4 py-2 text-sm text-gray-300 aria-disabled:cursor-not-allowed data-[focused=true]:bg-gray-50 data-[focused=true]:outline-none"
                        >
                            Unavailable
                        </FocusItem>
                    </FocusGroup>
                </AriaCard>

                {/* 3. Listbox */}
                {/* 
                    ARIA States:
                    - aria-selected: Handled natively by focus in single select usually, but can also be distinct.
                    Here we use focus as selection for simple lists, but let's add multi-select visual later if needed.
                */}
                <AriaCard title="Listbox" ariaRole="listbox">
                    <FocusGroup
                        id="demo-listbox"
                        role="listbox"
                        navigate={{ orientation: 'vertical' }}
                        select={{ mode: 'single', followFocus: true }}
                        aria-label="Select a user"
                        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto"
                    >
                        {['Wade Cooper', 'Arlene Mccoy', 'Devon Webb', 'Tom Cook', 'Tanya Fox'].map((name, i) => (
                            <FocusItem
                                key={name}
                                id={`user-${i}`}
                                role="option"
                                className="
                                    px-4 py-2.5 text-sm 
                                    hover:bg-gray-50 
                                    aria-[selected=true]:bg-indigo-50 aria-[selected=true]:text-indigo-700
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300 data-[focused=true]:ring-inset data-[focused=true]:z-10
                                "
                            >
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
                        ].map((opt) => (
                            <FocusItem
                                key={opt.id}
                                id={`radio-${opt.id}`}
                                role="radio"
                                aria-checked={radioValue === opt.id}
                                onFocus={() => setRadioValue(opt.id)}
                                className="
                                    group flex items-center gap-3 p-2 rounded-lg 
                                    hover:bg-gray-50 
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300
                                    aria-checked:bg-indigo-50
                                "
                            >
                                <div className="
                                    w-4 h-4 rounded-full border-2 flex items-center justify-center 
                                    border-gray-300 group-aria-checked:border-indigo-500
                                ">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-0 group-aria-checked:opacity-100" />
                                </div>
                                <span className="text-sm group-aria-checked:font-medium group-aria-checked:text-indigo-700">{opt.label}</span>
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 5. Toolbar */}
                {/* 
                    ARIA States:
                    - aria-pressed: Toggle button state
                */}
                <AriaCard title="Toolbar" ariaRole="toolbar">
                    <FocusGroup
                        id="demo-toolbar"
                        role="toolbar"
                        navigate={{ orientation: 'horizontal' }}
                        aria-label="Text formatting"
                        className="flex gap-1 p-2 bg-gray-100 rounded-lg border border-gray-200"
                    >
                        {[
                            { id: 'bold', label: 'B', title: 'Bold, togglable' },
                            { id: 'italic', label: 'I', title: 'Italic, togglable' },
                            { id: 'underline', label: 'U', title: 'Underline, togglable' },
                            { id: 'strike', label: 'S', title: 'Strikethrough, togglable' },
                        ].map(btn => (
                            <FocusItem
                                key={btn.id}
                                id={`tool-${btn.id}`}
                                role="button"
                                as="button"
                                aria-label={btn.title}
                                aria-pressed={!!pressedTools[btn.id]}
                                onClick={() => toggleTool(btn.id)}
                                className="
                                    w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all
                                    text-gray-600 hover:bg-gray-200 
                                    aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:shadow-inner
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-1
                                "
                            >
                                {btn.label}
                            </FocusItem>
                        ))}
                        <div className="w-px bg-gray-300 mx-1" />
                        <FocusItem
                            id="tool-disabled"
                            role="button"
                            aria-disabled="true"
                            className="
                                w-8 h-8 flex items-center justify-center rounded text-sm text-gray-400 cursor-not-allowed
                                aria-disabled:opacity-50
                                data-[focused=true]:ring-2 data-[focused=true]:ring-gray-300
                            "
                        >
                            D
                        </FocusItem>
                    </FocusGroup>
                </AriaCard>

                {/* 6. Grid */}
                {/* 
                    ARIA States:
                    - aria-selected: Cell selection
                */}
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
                            <FocusItem
                                key={i}
                                id={`cell-${i}`}
                                role="gridcell"
                                aria-colindex={(i % 4) + 1}
                                aria-rowindex={Math.floor(i / 4) + 1}
                                aria-selected={!!gridSelection[`cell-${i}`]}
                                onClick={() => toggleGridCell(`cell-${i}`)}
                                className="
                                    aspect-square flex items-center justify-center rounded text-xs transition-colors
                                    bg-white hover:bg-gray-50 
                                    aria-selected:bg-indigo-600 aria-selected:text-white
                                    data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-inset data-[focused=true]:z-10
                                "
                            >
                                {i + 1}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 7. Tree */}
                {/* 
                    ARIA States:
                    - aria-expanded: Expand/collapse nodes (store-driven)
                */}
                <AriaCard title="Tree (Store-Driven)" ariaRole="tree">
                    <FocusGroup
                        id="demo-tree"
                        role="tree"
                        navigate={{ orientation: 'vertical' }}
                        aria-label="File explorer"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                    >
                        <TreeContent />
                    </FocusGroup>
                </AriaCard>

                {/* 8. Menubar */}
                <AriaCard title="Menubar" ariaRole="menubar">
                    <FocusGroup
                        id="demo-menubar"
                        role="menubar"
                        navigate={{ orientation: 'horizontal' }}
                        aria-label="Application menu"
                        className="flex bg-gray-800 text-white rounded-lg overflow-hidden"
                    >
                        {['File', 'Edit', 'View', 'Help'].map(item => (
                            <FocusItem
                                key={item}
                                id={`menubar-${item.toLowerCase()}`}
                                role="menuitem"
                                aria-haspopup="menu"
                                className="
                                    px-4 py-2 text-sm 
                                    hover:bg-gray-700 
                                    data-[focused=true]:bg-indigo-600 data-[focused=true]:font-bold
                                "
                            >
                                {item}
                            </FocusItem>
                        ))}
                    </FocusGroup>
                </AriaCard>

                {/* 9. Combobox */}
                {/* 
                    ARIA States:
                    - aria-expanded: Controls visibility of listbox
                    - aria-invalid: Error state
                */}
                <AriaCard title="Combobox" ariaRole="combobox">
                    <div className="relative">
                        <FocusItem
                            id="combo-trigger"
                            role="combobox"
                            aria-expanded={isComboOpen}
                            aria-invalid={isComboInvalid}
                            aria-controls="combo-listbox"
                            aria-autocomplete="list"
                            onClick={() => setIsComboOpen(!isComboOpen)}
                            className={`
                                w-full px-3 py-2.5 border rounded-lg text-sm bg-white cursor-pointer
                                flex items-center gap-2 transition-all
                                ${isComboInvalid
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:border-gray-300'
                                }
                                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-200 data-[focused=true]:border-indigo-400
                                aria-[invalid=true]:data-[focused=true]:ring-red-200 aria-[invalid=true]:data-[focused=true]:border-red-400
                            `}
                        >
                            <Icon name="search" size={16} className={isComboInvalid ? 'text-red-400' : 'text-gray-400'} />
                            <span className="flex-1 text-left">
                                {isComboInvalid ? 'Invalid selection' : 'Select a fruit...'}
                            </span>
                            <Icon
                                name={isComboOpen ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                className={isComboInvalid ? 'text-red-400' : 'text-gray-400'}
                            />
                        </FocusItem>

                        <div className="flex items-center gap-2 mt-3">
                            <label className="text-xs text-gray-500 flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isComboInvalid}
                                    onChange={(e) => setIsComboInvalid(e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5"
                                />
                                <Icon name="alert-circle" size={12} className="text-gray-400" />
                                Toggle Invalid
                            </label>
                        </div>

                        {isComboOpen && (
                            <FocusGroup
                                id="combo-listbox"
                                role="listbox"
                                navigate={{ orientation: 'vertical' }}
                                aria-label="Suggestions"
                                className="absolute z-50 top-12 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-44 overflow-y-auto py-1"
                            >
                                {[
                                    { name: 'Apple', icon: '🍎' },
                                    { name: 'Banana', icon: '🍌' },
                                    { name: 'Cherry', icon: '🍒' },
                                    { name: 'Date', icon: '🌴' },
                                ].map((fruit, i) => (
                                    <FocusItem
                                        key={fruit.name}
                                        id={`combo-opt-${i}`}
                                        role="option"
                                        className="
                                            px-3 py-2 text-sm flex items-center gap-2
                                            hover:bg-gray-50 cursor-pointer
                                            data-[focused=true]:bg-indigo-50 data-[focused=true]:text-indigo-700
                                        "
                                    >
                                        <span className="text-base">{fruit.icon}</span>
                                        <span>{fruit.name}</span>
                                    </FocusItem>
                                ))}
                            </FocusGroup>
                        )}
                    </div>
                </AriaCard>

                {/* 10. Accordion */}
                <AriaCard title="Accordion" ariaRole="region">
                    <FocusGroup
                        id="demo-accordion"
                        role="region"
                        navigate={{ orientation: 'vertical' }}
                        aria-label="FAQ"
                        className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden"
                    >
                        <AccordionContent />
                    </FocusGroup>
                </AriaCard>
            </div>
        </div>
    );
}

function AriaCard({ title, ariaRole, children }: { title: string; ariaRole: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-700">{title}</h3>
                <code className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">role="{ariaRole}"</code>
            </div>
            <div className="p-4 flex-1">
                {children}
            </div>
        </div>
    );
}

function TreeContent() {
    const { isExpanded, toggleExpanded } = useFocusExpansion();

    return (
        <>
            <FocusItem
                id="tree-src"
                role="treeitem"
                aria-level={1}
                onClick={() => toggleExpanded('tree-src')}
                className="
                    group px-2 py-1 text-sm rounded flex items-center gap-2 cursor-pointer
                    hover:bg-gray-50
                    data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-300
                "
            >
                <Icon
                    name={isExpanded('tree-src') ? 'chevron-down' : 'chevron-right'}
                    size={12}
                    className="text-gray-400 flex-shrink-0"
                />
                <Icon name={isExpanded('tree-src') ? 'folder-open' : 'folder'} size={16} className="text-amber-500 flex-shrink-0" />
                <span>src</span>
            </FocusItem>

            {isExpanded('tree-src') && (
                <>
                    <FocusItem id="tree-components" role="treeitem" aria-level={2} className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2">
                        <span className="w-3 flex-shrink-0" />{/* chevron placeholder */}
                        <Icon name="folder" size={16} className="text-amber-500 flex-shrink-0" />
                        <span>components</span>
                    </FocusItem>
                    <FocusItem id="tree-app" role="treeitem" aria-level={2} className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2">
                        <span className="w-3 flex-shrink-0" />{/* chevron placeholder */}
                        <Icon name="file-code" size={16} className="text-blue-500 flex-shrink-0" />
                        <span>App.tsx</span>
                    </FocusItem>
                    <FocusItem id="tree-index" role="treeitem" aria-level={2} className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2">
                        <span className="w-3 flex-shrink-0" />{/* chevron placeholder */}
                        <Icon name="file-code" size={16} className="text-blue-500 flex-shrink-0" />
                        <span>index.tsx</span>
                    </FocusItem>
                </>
            )}

            <FocusItem
                id="tree-public"
                role="treeitem"
                aria-level={1}
                onClick={() => toggleExpanded('tree-public')}
                className="
                    group px-2 py-1 text-sm rounded flex items-center gap-2 cursor-pointer
                    hover:bg-gray-50
                    data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-1 data-[focused=true]:ring-indigo-300
                "
            >
                <Icon
                    name={isExpanded('tree-public') ? 'chevron-down' : 'chevron-right'}
                    size={12}
                    className="text-gray-400 flex-shrink-0"
                />
                <Icon name={isExpanded('tree-public') ? 'folder-open' : 'folder'} size={16} className="text-amber-500 flex-shrink-0" />
                <span>public</span>
            </FocusItem>

            {isExpanded('tree-public') && (
                <>
                    <FocusItem id="tree-favicon" role="treeitem" aria-level={2} className="ml-5 px-2 py-1 text-sm hover:bg-gray-50 data-[focused=true]:bg-indigo-50 rounded flex items-center gap-2">
                        <span className="w-3 flex-shrink-0" />{/* chevron placeholder */}
                        <Icon name="file-image" size={16} className="text-green-500 flex-shrink-0" />
                        <span>favicon.ico</span>
                    </FocusItem>
                </>
            )}
        </>
    );
}

function AccordionContent() {
    const { isExpanded, toggleExpanded } = useFocusExpansion();

    const items = [
        {
            id: 'acc-1-trigger',
            icon: 'help' as const,
            iconColor: 'text-indigo-500',
            question: 'What is FocusGroup?',
            answer: 'FocusGroup is a headless primitive for managing focus navigation, selection, and accessibility.',
        },
        {
            id: 'acc-2-trigger',
            icon: 'layers' as const,
            iconColor: 'text-emerald-500',
            question: 'How does it handle state?',
            answer: 'It uses Zustand stores scoped to each group to manage focus, selection, and now expansion states.',
        },
        {
            id: 'acc-3-trigger',
            icon: 'zap' as const,
            iconColor: 'text-amber-500',
            question: 'Is it performant?',
            answer: 'Yes! It uses fine-grained subscriptions and minimal re-renders through Zustand selectors.',
        },
    ];

    return (
        <div className="divide-y divide-gray-100">
            {items.map((item) => (
                <div key={item.id}>
                    <FocusItem
                        id={item.id}
                        as="button"
                        role="button"
                        aria-controls={`${item.id}-panel`}
                        onClick={() => toggleExpanded(item.id)}
                        className="
                            w-full px-4 py-3.5 flex items-center gap-3 text-left text-sm
                            hover:bg-gray-50 transition-colors
                            data-[focused=true]:bg-indigo-50 data-[focused=true]:ring-inset data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-300
                        "
                    >
                        <div className={`p-1.5 rounded-lg bg-gray-100 ${item.iconColor}`}>
                            <Icon name={item.icon} size={16} />
                        </div>
                        <span className="flex-1 font-medium text-gray-700">{item.question}</span>
                        <Icon
                            name={isExpanded(item.id) ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            className="text-gray-400 flex-shrink-0"
                        />
                    </FocusItem>
                    {isExpanded(item.id) && (
                        <div id={`${item.id}-panel`} className="px-4 py-3 pl-14 text-sm text-gray-600 bg-gray-50/50 border-l-2 border-indigo-200 ml-4">
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default AriaShowcasePage;
