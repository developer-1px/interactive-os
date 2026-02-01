import { useState, useEffect, useMemo, memo } from 'react';
import { useTodoEngine } from '../lib/todo_engine';
import { SIDEBAR_REGISTRY, TODO_LIST_REGISTRY, CONSTITUTION_REGISTRY } from '../lib/todo_commands';
import { evalContext } from '../lib/context';
import type { HistoryEntry } from '../lib/types';

interface KeyLog {
    key: string;
    code: string;
    timestamp: number;
}

// --- Sub-Components ---

const KeyMonitor = memo(({ rawKeys }: { rawKeys: KeyLog[] }) => (
    <section className="p-3 border-b border-white/5 bg-black/10">
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-pink-500 rounded-full animate-pulse" /> Raw Input
            </div>
            <span className="text-[7px] opacity-40">last 3 events</span>
        </h3>
        <div className="flex gap-1.5 overflow-hidden">
            {rawKeys.map((log, i) => (
                <div key={log.timestamp + i} className={`px-2 py-1.5 rounded-lg border bg-black/40 flex flex-col items-center min-w-[60px] transition-all duration-300 ${i === 0 ? 'border-pink-500/50 scale-105 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'border-white/5 opacity-40'}`}>
                    <span className="text-[10px] font-black text-white">{log.key === ' ' ? 'SPACE' : log.key.toUpperCase()}</span>
                    <span className="text-[7px] text-slate-600 font-bold">{log.code}</span>
                </div>
            ))}
            {rawKeys.length === 0 && (
                <div className="text-[9px] text-slate-700 italic flex-1 py-1">Awaiting interaction...</div>
            )}
        </div>
    </section>
));

const StateMonitor = memo(({ focusId, activeZone, physicalZone, isInputActive }: { focusId: any, activeZone: string, physicalZone: string, isInputActive: boolean }) => (
    <section className="p-3 border-b border-white/5">
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1 h-3 bg-indigo-500/40 rounded-full" /> Live State
        </h3>
        <div className="space-y-1.5 bg-black/20 p-2 rounded-xl border border-white/5">
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] text-slate-500">focusId</span>
                <span className="text-[10px] text-indigo-400 font-bold">{JSON.stringify(focusId)}</span>
            </div>
            <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5">
                <span className="text-[9px] text-slate-500 uppercase font-black">FocusZone ID</span>
                <span className="text-[10px] text-emerald-400 font-bold">{activeZone || 'NONE'}</span>
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] text-slate-500 uppercase font-black">DOM Focus ID</span>
                <span className={`text-[10px] font-bold ${physicalZone === 'NONE' ? 'text-slate-500 italic opacity-50' : 'text-pink-400'}`}>
                    {physicalZone === 'NONE' ? `(virtual: ${activeZone || 'NONE'})` : physicalZone}
                </span>
            </div>
            {isInputActive && (
                <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5">
                    <span className="text-[9px] text-pink-500 uppercase font-black">INPUT LOCK</span>
                    <span className="text-[10px] text-pink-400 font-bold">ACTIVE</span>
                </div>
            )}
        </div>
    </section>
));

const RegistryMonitor = memo(({ ctx, activeKeybindingMap, isInputActive }: { ctx: any, activeKeybindingMap: Map<string, boolean>, isInputActive: boolean }) => {
    const currentCommands = useMemo(() => {
        const zone = ctx.activeZone;
        const reg = zone === 'sidebar' ? SIDEBAR_REGISTRY : (zone === 'todoList' ? TODO_LIST_REGISTRY : CONSTITUTION_REGISTRY);
        return reg.getAll().map(cmd => ({
            id: cmd.id,
            label: cmd.label || cmd.id,
            kb: cmd.kb || [],
            enabled: cmd.when ? evalContext(cmd.when, ctx) : true,
            allowInInput: cmd.allowInInput,
            log: cmd.log
        }));
    }, [ctx]); // Intentionally using the stable 'ctx' passed from parent

    return (
        <section className="p-3 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-1 h-3 bg-emerald-500/40 rounded-full" /> Registry
                </div>
                <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tight">
                    {ctx.activeZone || 'CONSTITUTION'}
                </span>
            </h3>
            <div className="grid gap-1">
                {currentCommands.map(cmd => {
                    const isBlockedByInput = isInputActive && !cmd.allowInInput;
                    const isDisabled = !cmd.enabled || isBlockedByInput;

                    return (
                        <div key={cmd.id} className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${!isDisabled ? 'bg-white/[0.03] border-white/5' : 'bg-black/20 border-transparent opacity-30 grayscale'}`}>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[8px] font-black truncate leading-none ${isBlockedByInput ? 'text-pink-500/50 line-through' : 'text-indigo-500'}`}>{cmd.id}</span>
                                    {/* Property Badges */}
                                    <div className="flex gap-0.5">
                                        {(cmd as any).allowInInput && (
                                            <span className="text-[6px] px-1 bg-pink-500/20 text-pink-400 border border-pink-500/20 rounded font-bold uppercase" title="Executable in Input Fields">INPUT_SAFE</span>
                                        )}
                                        {(cmd as any).log === false && (
                                            <span className="text-[6px] px-1 bg-slate-500/20 text-slate-500 border border-slate-500/20 rounded font-bold uppercase" title="Logging Suppressed">NO_LOG</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-300 font-medium truncate uppercase tracking-tighter">{cmd.label || cmd.id}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2">
                                {cmd.kb.map(key => (
                                    <kbd key={key} className={`min-w-[18px] h-4 flex items-center justify-center px-1 rounded bg-black/40 border text-[8px] font-black ${activeKeybindingMap.get(key) && !isDisabled ? 'border-indigo-500 text-indigo-400 bg-indigo-500/20 shadow-[0_0_5px_rgba(99,102,241,0.3)]' : 'border-white/10 text-slate-600'}`}>
                                        {key === ' ' ? 'SPC' : key.toUpperCase()}
                                    </kbd>
                                ))}
                                <div className={`w-1 h-1 rounded-full ${!isDisabled ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
});

const EventStream = memo(({ history }: { history: HistoryEntry[] }) => {
    const recentHistory = useMemo(() => [...history].reverse().slice(0, 10), [history]);

    return (
        <section className="p-3">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-3 bg-pink-500/40 rounded-full" /> Event Stream
            </h3>
            <div className="space-y-2">
                {recentHistory.map((entry, i) => (
                    <div key={i} className="group relative pl-3 border-l border-white/10 hover:border-indigo-500/40 transition-colors">
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">{entry.command.type}</span>
                            <span className="text-[8px] text-slate-600 font-bold italic">#{history.length - i}</span>
                        </div>
                        <div className="bg-black/30 p-1.5 rounded-md border border-white/[0.02] text-[8px] leading-tight break-all">
                            <span className="text-slate-500">payload:</span> <span className="text-slate-400">{JSON.stringify('payload' in entry.command ? entry.command.payload : {})}</span>
                        </div>
                        <div className="mt-1 flex gap-2 overflow-hidden">
                            <span className="text-[8px] text-slate-600 whitespace-nowrap">→ focus: {JSON.stringify(entry.resultingState.focusId)}</span>
                        </div>
                    </div>
                ))}
                {recentHistory.length === 0 && (
                    <div className="text-[9px] text-slate-700 italic text-center py-4 border border-dashed border-white/5 rounded-xl">Waiting for telemetry...</div>
                )}
            </div>
        </section>
    );
});

// --- Main Component ---

export function CommandInspector() {
    const { state, activeKeybindingMap, ctx } = useTodoEngine();
    const [rawKeys, setRawKeys] = useState<KeyLog[]>([]);
    const [physicalZone, setPhysicalZone] = useState<string | null>('NONE');
    const [isInputActive, setIsInputActive] = useState(false);

    // Optimize Context for Registry:
    // We strip out volatile fields that don't affect command availability (like editDraft/draft text)
    // to prevent RegistryMonitor from re-rendering on every keystroke.
    const registryContext = useMemo(() => {
        const { editDraft, draft, ...stablePart } = ctx as any;
        return stablePart;
    }, [ctx]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setRawKeys(prev => [{
                key: e.key,
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
        <div className="w-[320px] h-screen bg-slate-900/90 border-l border-white/10 flex flex-col shadow-[[-20px_0_50px_rgba(0,0,0,0.3)]] backdrop-blur-3xl overflow-hidden font-mono select-none flex-shrink-0 z-50">
            {/* Header */}
            <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-colors duration-300 ${isInputActive ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]' : 'bg-indigo-500'}`} />
                    <span className="text-[10px] font-black tracking-tighter text-white uppercase opacity-80">
                        {isInputActive ? 'Input Mode' : 'System Inspector'}
                    </span>
                </div>
                <div className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] text-indigo-400 font-bold uppercase">v2.4-atomic</div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <KeyMonitor rawKeys={rawKeys} />
                <StateMonitor
                    focusId={state.focusId}
                    activeZone={(ctx as any).activeZone}
                    physicalZone={physicalZone || 'NONE'}
                    isInputActive={isInputActive}
                />
                <RegistryMonitor
                    ctx={registryContext}
                    activeKeybindingMap={activeKeybindingMap}
                    isInputActive={isInputActive}
                />
                <EventStream history={state.history} />
            </div>

            {/* Sticky Footer Status */}
            <div className="p-2 border-t border-white/5 bg-black/40 flex items-center justify-between px-3">
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
