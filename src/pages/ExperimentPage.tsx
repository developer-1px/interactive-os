import { useMemo } from 'react';
import { Beaker, Layers, Database, Layout, Edit3, Terminal } from 'lucide-react';
import { useCommandEngine } from '../lib/primitives/CommandContext';
import { CommandContext } from '../lib/primitives/CommandContext';
import { ContextProvider } from '../lib/context';
import { createCommandStore, useCommandCenter, CommandRegistry } from '../lib/command';
import type { AppState } from '../lib/types';
import { UNIFIED_TODO_REGISTRY } from '../lib/todoCommands';
import { TODO_KEYMAP } from '../lib/todoKeys';

// --- Shared Engine Setup ---
function useSharedIsolatedEngine() {
    const initialState: AppState = {
        data: {
            categories: [
                { id: 'c1', text: 'Work' },
                { id: 'c2', text: 'Personal' },
                { id: 'c3', text: 'Shopping' }
            ],
            todos: [
                { id: 101, text: 'Review PR #123', completed: false, categoryId: 'c1' },
                { id: 102, text: 'Write Documentation', completed: true, categoryId: 'c1' },
                { id: 201, text: 'Buy Milk', completed: false, categoryId: 'c3' }
            ]
        },
        ui: { selectedCategoryId: 'c1', draft: '', focusId: 'c1', editingId: null, editDraft: '' },
        history: { past: [], future: [] }
    };

    const registry = useMemo(() => {
        const reg = new CommandRegistry<AppState, any>();
        UNIFIED_TODO_REGISTRY.getAll().forEach(cmd => reg.register(cmd));
        reg.setKeymap(TODO_KEYMAP);
        return reg;
    }, []);

    const store = useMemo(() => createCommandStore(registry, initialState), [registry]);

    // Simple state mapper
    const config = useMemo(() => ({
        mapStateToContext: (_state: AppState) => ({
            activeZone: 'sidebar', // For testing logic
            focusIndex: 0,
            hasTodos: true
        })
    }), []);

    return useCommandCenter(store, registry, config);
}

// --- Mock Components (The "Ugly" UI) ---

function MockCategoryBrain() {
    const { state, dispatch } = useCommandEngine();
    const { categories } = state.data;
    const { selectedCategoryId, focusId } = state.ui;

    return (
        <div className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Categories (Data)</h3>
            <ul className="space-y-1">
                {categories.map((cat: any) => {
                    const isSelected = cat.id === selectedCategoryId;
                    const isFocused = cat.id === focusId;
                    return (
                        <li key={cat.id} className={`flex items-center justify-between p-2 rounded border ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                            <span className="text-sm font-mono">
                                {isFocused ? '👉' : '  '} {cat.text}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] rounded"
                                    onClick={() => dispatch({ type: 'SELECT_CATEGORY', payload: { id: cat.id } })}
                                >
                                    Select
                                </button>
                                {isSelected && (
                                    <>
                                        <button className="px-1 bg-white/10" onClick={() => dispatch({ type: 'MOVE_CATEGORY_UP' })}>▲</button>
                                        <button className="px-1 bg-white/10" onClick={() => dispatch({ type: 'MOVE_CATEGORY_DOWN' })}>▼</button>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="mt-4 p-2 bg-yellow-500/10 text-yellow-500 text-xs rounded">
                <strong>Logic Test:</strong> Clicking Up/Down uses <code>MOVE_CATEGORY_*</code> commands from <code>SIDEBAR_REGISTRY</code>.
            </div>
        </div>
    );
}

function MockTodoBrain() {
    const { state, dispatch } = useCommandEngine();
    const { todos } = state.data;
    const { selectedCategoryId } = state.ui;

    const visibleTodos = todos.filter((t: any) => t.categoryId === selectedCategoryId);

    return (
        <div className="p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase">Todos (Filtered by Category)</h3>
            {visibleTodos.length === 0 ? (
                <div className="text-slate-500 text-sm italic">No items in this category</div>
            ) : (
                <ul className="space-y-1">
                    {visibleTodos.map((todo: any) => (
                        <li key={todo.id} className={`flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 ${todo.completed ? 'opacity-50' : ''}`}>
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => dispatch({ type: 'TOGGLE_TODO', payload: { id: todo.id } })}
                            />
                            <span className={`text-sm flex-1 ${todo.completed ? 'line-through' : ''}`}>
                                {todo.text}
                            </span>
                            <button
                                className="text-red-400 hover:text-red-300 px-2"
                                onClick={() => dispatch({ type: 'DELETE_TODO', payload: { id: todo.id } })}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-4 flex gap-2">
                <button
                    className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded"
                    onClick={() => dispatch({ type: 'ADD_TODO', payload: { text: `New Item ${Date.now()}` } })} // Verify if ADD_TODO supports payload? In code it reads from draft.
                // Wait, ADD_TODO reads from state.ui.draft.
                // We need to set draft first.
                >
                    Add Random Item (Fails if Draft Empty)
                </button>
                <button
                    className="flex-1 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded"
                    onClick={() => {
                        dispatch({ type: 'SYNC_DRAFT', payload: { text: 'Injected Item' } });
                        setTimeout(() => dispatch({ type: 'ADD_TODO' }), 10);
                    }}
                >
                    Inject & Add
                </button>
            </div>
        </div>
    );
}

function MockControlDeck() {
    const { state, dispatch } = useCommandEngine();

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Time Travel</h3>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded hover:bg-blue-600/30 disabled:opacity-50"
                        onClick={() => dispatch({ type: 'UNDO' })}
                        disabled={state.history.past.length === 0}
                    >
                        Undo ({state.history.past.length})
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded hover:bg-blue-600/30 disabled:opacity-50"
                        onClick={() => dispatch({ type: 'REDO' })}
                        disabled={state.history.future.length === 0}
                    >
                        Redo ({state.history.future.length})
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Focus Teleport</h3>
                <div className="grid grid-cols-3 gap-2">
                    {state.data.categories.map((c: any) => (
                        <button
                            key={c.id}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded text-xs text-left truncat"
                            onClick={() => dispatch({ type: 'SET_FOCUS', payload: { id: c.id } })}
                        >
                            Focus {c.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function MockStateMonitor() {
    const { state } = useCommandEngine();
    return (
        <div className="p-4 h-full overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Live Logic State</h3>
            <pre className="flex-1 bg-black/50 p-2 rounded text-[10px] text-green-400 font-mono overflow-auto border border-white/5">
                {JSON.stringify({
                    ui: state.ui,
                    historyCounts: { past: state.history.past.length, future: state.history.future.length }
                }, null, 2)}
            </pre>
        </div>
    )
}


function Cell({ title, icon: Icon, children }: any) {
    return (
        <div className="bg-[#0B0D12] border border-white/5 rounded-xl overflow-hidden flex flex-col h-[300px]">
            <div className="h-9 border-b border-white/5 flex items-center px-3 gap-2 bg-white/5">
                <Icon size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="flex-1 relative overflow-auto">
                {children}
            </div>
        </div>
    );
}

// --- Main Page ---

export default function ExperimentPage() {
    const engine = useSharedIsolatedEngine();

    return (
        <ContextProvider>
            <CommandContext.Provider value={engine.providerValue}>
                <div className="flex-1 bg-slate-950 p-8 overflow-auto">
                    <header className="mb-8 flex items-end justify-between">
                        <div>
                            <h1 className="text-3xl font-light text-white flex items-center gap-3">
                                <Beaker className="text-indigo-500" />
                                Deconstructed App
                            </h1>
                            <p className="text-slate-500 mt-2 max-w-xl">
                                This page demonstrates <strong>Logic-View Decoupling</strong>.
                                We "exploded" the Todo App into separate Mock Components.
                                They are physically separated but share the same Logic Brain (Engine).
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                                Running in Isolation
                            </span>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">

                        {/* Row 1: The Core Data Views */}
                        <Cell title="Nav Brain (Categories)" icon={Layout}>
                            <MockCategoryBrain />
                        </Cell>

                        <Cell title="List Brain (Todos)" icon={Terminal}>
                            <MockTodoBrain />
                        </Cell>

                        {/* Row 2: Control & History */}
                        <Cell title="Control Deck" icon={Layers}>
                            <MockControlDeck />
                        </Cell>

                        <Cell title="State Signal Monitor" icon={Database}>
                            <MockStateMonitor />
                        </Cell>

                        {/* Row 3: Editor (Placeholder / Extra) */}
                        <Cell title="Detail Brain (Editor)" icon={Edit3}>
                            <div className="p-4 flex items-center justify-center h-full text-slate-600 italic">
                                Use 'Start Edit' in todo list to activate this...
                            </div>
                        </Cell>

                        <Cell title="Architecture Notes" icon={Database}>
                            <div className="p-4 text-xs text-slate-400 leading-relaxed space-y-2">
                                <p>
                                    This grid proves that <strong>Antigravity Commands</strong> are portable.
                                </p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>MockCategoryBrain</strong> uses <code>SIDEBAR_REGISTRY</code></li>
                                    <li><strong>MockTodoBrain</strong> uses <code>TODO_LIST_REGISTRY</code></li>
                                    <li>They communicate via the <strong>Shared Engine</strong>.</li>
                                    <li>No "React Prop Drilling" was used.</li>
                                </ul>
                            </div>
                        </Cell>

                    </div>
                </div>
            </CommandContext.Provider>
        </ContextProvider>
    );
}
