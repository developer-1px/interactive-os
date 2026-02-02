import { useState, useEffect, useMemo, memo } from 'react';
import { Kbd } from './Kbd';
import { useTodoEngine } from '../lib/todo_engine';

import { evalContext } from '../lib/context';
import { getCanonicalKey } from '../lib/keybinding';
import type { HistoryEntry } from '../lib/types';
import { TextCursorInput, EyeOff, GitGraph } from 'lucide-react'; // Imports for flags

interface KeyLog {
    key: string;
    code: string;
    timestamp: number;
}

// --- Sub-Components ---

const KeyMonitor = memo(({ rawKeys }: { rawKeys: KeyLog[] }) => (
    <section className="px-3 py-2 border-b border-white/5 bg-black/10">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-pink-500 rounded-full animate-pulse" /> Raw Input
            </h3>
            <span className="text-[7px] font-bold text-slate-700 uppercase tracking-wide">Event Buffer</span>
        </div>
        <div className="flex gap-1.5 overflow-hidden h-10 items-center">
            {rawKeys.map((log, i) => (
                <Kbd
                    key={log.timestamp + i}
                    className={`flex-col !h-full !min-w-[50px] gap-0.5 transition-all duration-300 ${i === 0 ? 'border-pink-500/50 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'opacity-40 scale-95 border-transparent bg-transparent'}`}
                    variant="default"
                    size="sm"
                >
                    <span className={`text-[10px] font-black leading-none ${i === 0 ? 'text-pink-100' : 'text-slate-500'}`}>{log.key === ' ' ? 'SPC' : log.key.toUpperCase()}</span>
                    <span className="text-[7px] text-slate-600 font-bold leading-none">{log.code}</span>
                </Kbd>
            ))}
            {rawKeys.length === 0 && (
                <div className="text-[9px] text-slate-700 italic flex-1 flex items-center h-full pl-1">No active input</div>
            )}
        </div>
    </section>
));

const StateMonitor = memo(({ focusId, activeZone, physicalZone, isInputActive }: { focusId: any, activeZone: string, physicalZone: string, isInputActive: boolean }) => (
    <section className="px-3 py-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-indigo-500/40 rounded-full" /> Live Context
            </h3>
            {isInputActive && <span className="text-[7px] font-bold text-pink-500 px-1.5 py-0.5 bg-pink-500/10 rounded border border-pink-500/20">LOCKED</span>}
        </div>
        <div className="grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-2">
            <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">Focus ID</span>
            <div className="min-w-0">
                <span className="text-[10px] text-indigo-400 font-bold font-mono truncate block">{JSON.stringify(focusId)}</span>
            </div>

            <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">Virtual Zone</span>
            <div className="min-w-0">
                <span className="text-[10px] text-emerald-400 font-bold font-mono truncate block">{activeZone || 'NULL'}</span>
            </div>

            <span className="text-[9px] text-slate-500 font-bold text-right pt-[1px]">DOM Source</span>
            <div className="min-w-0">
                <span className={`text-[10px] font-bold font-mono truncate block ${physicalZone === 'NONE' ? 'text-slate-600 italic' : 'text-pink-400'}`}>
                    {physicalZone === 'NONE' ? `(Virtual: ${activeZone || 'NONE'})` : physicalZone}
                </span>
            </div>
        </div>
    </section>
));

const CommandRow = memo(({ cmd, isDisabled, isBlockedByInput, activeKeybindingMap, isLastExecuted, trigger }: {
    cmd: any,
    isDisabled: boolean,
    isBlockedByInput: boolean,
    activeKeybindingMap: Map<string, boolean>,
    isLastExecuted: boolean,
    trigger: number
}) => {
    // We use the 'trigger' (history count) as a key suffix ONLY when this command is active.
    // This forces React to remount the style-carrying div on every execution, 
    // guaranteeing the CSS animation plays from 0% every time.
    const animationKey = isLastExecuted ? `active-${trigger}` : 'static';

    return (
        <div
            key={animationKey}
            className={`group flex items-center justify-between px-2 py-1 rounded border transition-colors duration-200 
                ${isLastExecuted ? 'animate-flash-command bg-indigo-500/80 border-indigo-400' : (!isDisabled ? 'bg-white/[0.03] border-white/5' : 'bg-transparent border-transparent opacity-40 grayscale')}
            `}
        >
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isLastExecuted ? 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]' : (!isDisabled ? 'bg-indigo-500' : 'bg-slate-700')}`} />
                <span className={`text-[9px] font-bold font-mono truncate flex-shrink-0 w-[100px] transition-colors ${isLastExecuted ? 'text-white' : (isBlockedByInput ? 'text-slate-500 line-through' : 'text-indigo-300')}`}>{cmd.id}</span>
                <span className={`text-[9px] font-medium truncate tracking-tight transition-all duration-200 ${isLastExecuted ? 'text-indigo-100 opacity-100' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>{cmd.label}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Flags */}
                <div className={`flex items-center gap-1 transition-opacity ${isLastExecuted ? 'opacity-90 text-indigo-100' : 'opacity-60'}`}>
                    {cmd.when && (
                        <div title={`Condition: ${cmd.when}`} className={`${isLastExecuted ? 'text-indigo-200' : 'text-slate-500 hover:text-indigo-400'} transition-colors`}>
                            <GitGraph size={9} />
                        </div>
                    )}
                    {cmd.allowInInput && (
                        <div title="Input Safe (Executable in input fields)" className={isLastExecuted ? 'text-pink-300' : 'text-pink-500'}>
                            <TextCursorInput size={9} />
                        </div>
                    )}
                    {cmd.log === false && (
                        <div title="No Log (Hidden from history)" className={isLastExecuted ? 'text-indigo-300' : 'text-slate-600'}>
                            <EyeOff size={9} />
                        </div>
                    )}
                </div>

                {/* Keys */}
                <div className="flex items-center gap-1 min-w-[30px] justify-end ml-1">
                    {cmd.kb.map((key: string) => (
                        <Kbd
                            key={key}
                            size="xs"
                            variant={activeKeybindingMap.get(key) && !isDisabled ? 'active' : 'ghost'}
                            className={!isDisabled && !activeKeybindingMap.get(key) ? (isLastExecuted ? 'text-white border-white/20 bg-indigo-400/50' : 'text-slate-500 scale-90 border-white/5 bg-black/20') : 'scale-90'}
                        >
                            {key === ' ' ? 'SPC' : key.toUpperCase()}
                        </Kbd>
                    ))}
                </div>
            </div>
        </div>
    );
});

import type { MenuItem } from '../lib/todo_menus';
import { SIDEBAR_MENU, TODOLIST_MENU, GLOBAL_MENU } from '../lib/todo_menus';
import { UNIFIED_TODO_REGISTRY } from '../lib/todo_commands';

const RegistryMonitor = memo(({ ctx, activeKeybindingMap, isInputActive, lastCommandId, historyCount }: {
    ctx: any,
    activeKeybindingMap: Map<string, boolean>,
    isInputActive: boolean,
    lastCommandId: string | null,
    historyCount: number
}) => {
    const currentCommands = useMemo(() => {
        const zone = ctx.activeZone;
        const menu = zone === 'sidebar' ? SIDEBAR_MENU : (zone === 'todoList' ? TODOLIST_MENU : GLOBAL_MENU);

        return menu.map((item: MenuItem) => {
            const cmd = UNIFIED_TODO_REGISTRY.get(item.command);
            if (!cmd) return null;

            return {
                id: cmd.id,
                label: cmd.label || cmd.id,
                // We don't have keybindings in Command anymore (moved to external keymap)
                // We could lookup from keybinding map if we wanted to show them?
                // Inspector's Kbd component uses `cmd.kb` which was inferred before.
                // Now we need to efficiently find keys for this command.
                // But wait, `CommandDefinition` doesn't have `kb` in the new `todo_commands.ts`?
                // The old code assumed `cmd.kb` existed or was injected.
                // The `getKeybindings()` method returned bindings. 
                // We should probably inject keys here.
                kb: [], // Placeholder for now, or we lookup from a global map.
                enabled: item.when ? evalContext(item.when, ctx) : true,
                allowInInput: cmd.allowInInput,
                log: cmd.log,
                when: item.when // Show the Menu's condition
            };
        }).filter(Boolean);
    }, [ctx]); // Intentionally using the stable 'ctx' passed from parent

    return (
        <section className="px-3 py-2 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 bg-emerald-500/40 rounded-full" /> Command Registry (via Menu)
                </h3>
                <span className="text-[7px] font-bold text-slate-600 uppercase tracking-tight px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                    {ctx.activeZone || 'GLOBAL'}
                </span>
            </div>
            <div className="flex flex-col gap-px">
                {currentCommands.map((cmd: any) => {
                    const isBlockedByInput = isInputActive && !cmd.allowInInput;
                    const isDisabled = !cmd.enabled || isBlockedByInput;

                    return (
                        <CommandRow
                            key={cmd.id}
                            cmd={cmd}
                            isDisabled={isDisabled}
                            isBlockedByInput={isBlockedByInput}
                            activeKeybindingMap={activeKeybindingMap}
                            isLastExecuted={cmd.id === lastCommandId}
                            trigger={historyCount}
                        />
                    );
                })}
            </div>
        </section>
    );
});

const EventStream = memo(({ history }: { history: HistoryEntry[] }) => {
    const recentHistory = useMemo(() => [...history].reverse().slice(0, 10), [history]);

    return (
        <section className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 bg-pink-500/40 rounded-full" /> Event Stream (Past)
                </h3>
            </div>
            <div className="space-y-1 relative">
                {/* Timeline Line */}
                <div className="absolute left-[3.5px] top-1 bottom-1 w-[1px] bg-white/5" />

                {recentHistory.map((entry, i) => (
                    <div key={i} className="group relative pl-3.5">
                        {/* Timeline Dot */}
                        <div className="absolute left-[1px] top-[5px] w-[5px] h-[5px] rounded-full bg-slate-800 border border-slate-700 group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-colors z-10" />

                        <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tight">{entry.command.type}</span>
                            <span className="text-[8px] text-slate-700 font-mono">#{history.length - i}</span>
                        </div>
                        <div className="text-[8px] text-slate-500 pl-1 border-l-2 border-transparent group-hover:border-white/10 transition-all truncate font-mono">
                            {JSON.stringify('payload' in entry.command ? entry.command.payload : {})}
                            <span className="mx-1 text-slate-700">→</span>
                            <span className="text-emerald-500/60">{String(entry.resultingState.focusId)}</span>
                        </div>
                    </div>
                ))}
                {recentHistory.length === 0 && (
                    <div className="text-[9px] text-slate-700 italic py-8 text-center border border-dashed border-white/5 rounded-lg bg-white/[0.01]">Waiting for events...</div>
                )}
            </div>
        </section>
    );
});


const StateTreeViewer = memo(({ state }: { state: any }) => (
    <div className="h-full flex flex-col bg-black/20">
        <div className="px-3 py-2 border-b border-white/5 bg-white/[0.01] sticky top-0 z-10 backdrop-blur-md flex items-center justify-between h-[37px]">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-blue-500/40 rounded-full" /> Data State
            </h3>
        </div>
        <div className="flex-1 overflow-auto p-3 custom-scrollbar">
            <pre className="text-[9px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(state, null, 2)}
            </pre>
        </div>
    </div>
));

// --- Main Component ---

export function CommandInspector() {
    const { state, activeKeybindingMap, ctx } = useTodoEngine();
    const [rawKeys, setRawKeys] = useState<KeyLog[]>([]);
    const [physicalZone, setPhysicalZone] = useState<string | null>('NONE');
    const [isInputActive, setIsInputActive] = useState(false);

    // Optimize Context for Registry:
    // We strip out volatile fields that don't affect command availability (like editDraft/draft text)
    // to prevent RegistryMonitor from re-rendering on every keystroke.
    // Optimize Context for Registry:
    // We strip out volatile fields that don't affect command availability (like editDraft/draft text)
    // to prevent RegistryMonitor from re-rendering on every keystroke.
    const registryContext = useMemo(() => {
        const { editDraft, draft, ...stablePart } = ctx as any;
        return stablePart;
    }, [ctx]);

    const historyCount = state.history.past.length;
    const lastEntry = historyCount > 0 ? state.history.past[historyCount - 1] : null;
    const lastCommandId = lastEntry ? lastEntry.command.type : null;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setRawKeys(prev => [{
                key: getCanonicalKey(e),
                code: e.code,
                timestamp: Date.now()
            }, ...prev].slice(0, 3));
        };
        const trackFocus = () => {
            const el = document.activeElement;
            const zone = el ? el.closest('[data-zone-id]') : null;
            setPhysicalZone(zone ? zone.getAttribute('data-zone-id') : 'NONE');

            // Detect native input focus
            if (el && (
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.getAttribute('contenteditable') === 'true'
            )) {
                setIsInputActive(true);
            } else {
                setIsInputActive(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', trackFocus);
        document.addEventListener('focusout', trackFocus); // Also track blur/focusout

        // Initial check
        trackFocus();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', trackFocus);
            document.removeEventListener('focusout', trackFocus);
        };
    }, []);

    return (
        <div className="w-[640px] h-screen bg-slate-900/90 border-l border-white/10 flex flex-col shadow-[[-20px_0_50px_rgba(0,0,0,0.3)]] backdrop-blur-3xl overflow-hidden font-mono select-none flex-shrink-0 z-50 transition-all duration-300">
            {/* Header */}
            <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-colors duration-300 ${isInputActive ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'bg-indigo-500'}`} />
                    <span className="text-[10px] font-black tracking-tighter text-white uppercase opacity-80">
                        {isInputActive ? 'Input Mode' : 'System Inspector'}
                    </span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] text-indigo-400 font-bold uppercase">v2.4-atomic</div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Input & Logic */}
                <div className="w-1/2 flex flex-col overflow-auto custom-scrollbar border-r border-white/10">
                    <KeyMonitor rawKeys={rawKeys} />
                    <StateMonitor
                        focusId={state.ui.focusId}
                        activeZone={(ctx as any).activeZone}
                        physicalZone={physicalZone || 'NONE'}
                        isInputActive={isInputActive}
                    />
                    <RegistryMonitor
                        ctx={registryContext}
                        activeKeybindingMap={activeKeybindingMap}
                        isInputActive={isInputActive}
                        lastCommandId={lastCommandId}
                        historyCount={historyCount}
                    />
                    <EventStream history={state.history.past} />
                </div>

                {/* Right Column: State Tree */}
                <div className="w-1/2 flex flex-col overflow-hidden">
                    <StateTreeViewer state={state.data} />
                </div>
            </div>

            {/* Sticky Footer Status */}
            <div className="p-2 border-t border-white/5 bg-black/40 flex items-center justify-between px-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest">Buffer Status</span>
                        <span className="text-[9px] text-emerald-500 font-bold">READY_STREAM</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[7px] text-slate-600 uppercase font-black block">Memory Usage</span>
                    <span className="text-[9px] text-slate-400 font-bold tabular-nums">OPTIMIZED</span>
                </div>
            </div>
        </div>
    );
}
