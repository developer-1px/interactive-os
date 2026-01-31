import { useReducer, useRef, useLayoutEffect, useMemo } from 'react'
import { ContextProvider, useContextService, evalContext } from './lib/context'
import { useKeybindingRegistry } from './lib/keybinding'
import type { KeybindingItem } from './lib/keybinding'
import { CommandContext, Action, Field } from './lib/primitives'
import type { BaseCommand } from './lib/primitives'

// --- 1. Business Types ---
type FocusTarget = 'DRAFT' | number | null;
interface Todo { id: number; text: string; completed: boolean }

type TodoCommand =
  | { type: 'PATCH'; payload: Partial<AppState> }
  | { type: 'ADD_TODO'; payload: { id: number } }
  | { type: 'TOGGLE_TODO'; payload?: { id: number } }
  | { type: 'DELETE_TODO'; payload?: { id: number } }
  | { type: 'MOVE_FOCUS'; payload: { direction: 'UP' | 'DOWN' } }
  | { type: 'SET_FOCUS'; payload: { id: FocusTarget } }

interface HistoryEntry {
  command: TodoCommand;
  resultingState: { todos: Todo[]; draft: string; focusId: FocusTarget; };
}

interface AppState {
  todos: Todo[];
  draft: string;
  focusId: FocusTarget;
  history: HistoryEntry[]
}

// --- 2. Static Configuration (VSCode Style) ---
const KEYBINDINGS: KeybindingItem[] = [
  { key: 'ArrowDown', command: 'MOVE_FOCUS', args: { direction: 'DOWN' }, when: 'hasTodos' },
  { key: 'ArrowUp', command: 'MOVE_FOCUS', args: { direction: 'UP' }, when: 'hasTodos' },
  { key: ' ', command: 'TOGGLE_TODO', when: 'listFocus' },
  { key: 'Delete', command: 'DELETE_TODO', when: 'listFocus' },
  { key: 'Backspace', command: 'DELETE_TODO', when: 'listFocus' }
];

// --- 3. Todo Engine ---
function todoReducer(state: AppState, command: TodoCommand): AppState {
  if (command.type === 'SET_FOCUS' && state.focusId === command.payload.id) return state;

  let newState: AppState;
  switch (command.type) {
    case 'PATCH':
      newState = { ...state, ...command.payload }; break;

    case 'ADD_TODO':
      if (!state.draft.trim()) return state
      const newTodo = { id: command.payload.id, text: state.draft.trim(), completed: false }
      newState = { ...state, todos: [...state.todos, newTodo], draft: '' }; break;

    case 'TOGGLE_TODO': {
      const targetId = command.payload?.id ?? (typeof state.focusId === 'number' ? state.focusId : null);
      if (targetId === null) return state;
      newState = { ...state, todos: state.todos.map(t => t.id === targetId ? { ...t, completed: !t.completed } : t) };
      break;
    }

    case 'DELETE_TODO': {
      const targetId = command.payload?.id ?? (typeof state.focusId === 'number' ? state.focusId : null);
      if (targetId === null) return state;
      const remaining = state.todos.filter(t => t.id !== targetId)
      const idx = state.todos.findIndex(t => t.id === targetId)
      let nextFocus: FocusTarget = state.focusId
      if (state.focusId === targetId) {
        nextFocus = remaining[idx]?.id || remaining[idx - 1]?.id || 'DRAFT'
      }
      newState = { ...state, todos: remaining, focusId: nextFocus }; break;
    }

    case 'SET_FOCUS':
      newState = { ...state, focusId: command.payload.id }; break;

    case 'MOVE_FOCUS': {
      const focusIndex = state.focusId === 'DRAFT' ? -1 : state.todos.findIndex(t => t.id === state.focusId)
      let nextFocus: FocusTarget = state.focusId
      if (command.payload.direction === 'DOWN') {
        if (focusIndex < state.todos.length - 1) nextFocus = state.todos[focusIndex + 1].id
      } else {
        if (focusIndex > -1) nextFocus = focusIndex === 0 ? 'DRAFT' : state.todos[focusIndex - 1].id
      }
      newState = { ...state, focusId: nextFocus }; break;
    }
    default: return state;
  }

  const historyEntry: HistoryEntry = {
    command,
    resultingState: { todos: newState.todos, draft: newState.draft, focusId: newState.focusId }
  }
  return { ...newState, history: [...state.history, historyEntry] }
}

// --- 4. Context Syncer ---
const ContextSyncer = ({ state }: { state: AppState }) => {
  const { updateContext } = useContextService();
  useLayoutEffect(() => {
    updateContext({
      hasTodos: state.todos.length > 0,
      listFocus: typeof state.focusId === 'number',
      isInputFocused: state.focusId === 'DRAFT',
      focusId: state.focusId
    });
  }, [state.todos.length, state.focusId, updateContext]);
  return null;
}

// --- 5. Main Component ---
function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, { todos: [], draft: '', focusId: 'DRAFT', history: [] })
  const refs = useRef<Record<string | number, HTMLElement | null>>({})
  const { context } = useContextService();

  // Wire up Registry
  useKeybindingRegistry(dispatch as (cmd: BaseCommand) => void, KEYBINDINGS);

  // Inspector Optimization: Pre-compile/Memoize matchers for UI visualization
  const activeKeybindingMap = useMemo(() => {
    const res = new Map<string, boolean>();
    KEYBINDINGS.forEach(kb => {
      res.set(kb.key, evalContext(kb.when, context));
    });
    return res;
  }, [context]);

  useLayoutEffect(() => {
    const targetId = state.focusId ?? 'DRAFT'
    const targetEl = refs.current[targetId]
    if (targetEl && document.activeElement !== targetEl) {
      targetEl.focus()
    }
  }, [state.focusId])

  return (
    <CommandContext.Provider value={dispatch}>
      <ContextSyncer state={state} />

      <div className="min-h-screen w-screen bg-slate-950 flex flex-col lg:flex-row items-center justify-center p-4 gap-6 font-sans text-slate-200 overflow-x-hidden">

        <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col h-[700px] overflow-hidden">
          <div className="p-10 pb-6 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">
              Context<br /><span className="text-indigo-500">Driven</span>
            </h1>
          </div>

          <div className="px-8 pb-6">
            <Field<TodoCommand> value={state.draft} name="draft" commitCommand={{ type: 'ADD_TODO', payload: { id: Date.now() } }} asChild>
              <input ref={el => { refs.current['DRAFT'] = el; }} type="text" placeholder="Entry Buffer..." className={`w-full bg-slate-800/50 border-2 rounded-2xl px-5 py-4 focus:outline-none transition-all ${state.focusId === 'DRAFT' ? 'border-indigo-500 shadow-lg' : 'border-slate-800'}`} />
            </Field>
          </div>

          <div className="flex-1 overflow-auto px-6 pb-6 custom-scrollbar outline-none">
            {state.todos.map((todo) => (
              <div
                key={todo.id}
                ref={el => { refs.current[todo.id] = el; }}
                tabIndex={0}
                onFocus={() => { if (state.focusId !== todo.id) dispatch({ type: 'SET_FOCUS', payload: { id: todo.id } }) }}
                className={`flex items-center p-4 mb-2 rounded-2xl border transition-all outline-none cursor-pointer ${state.focusId === todo.id
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)] translate-x-1'
                  : 'bg-slate-800/10 border-white/[0.02]'
                  }`}
              >
                <div className="flex items-center justify-center mr-4">
                  <Action<TodoCommand> command={{ type: 'TOGGLE_TODO', payload: { id: todo.id } }} asChild>
                    <button className={`w-6 h-6 rounded-lg transition-all flex items-center justify-center ${todo.completed ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  </Action>
                </div>
                <span className={`flex-1 font-medium ${todo.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{todo.text}</span>
                <Action<TodoCommand> command={{ type: 'DELETE_TODO', payload: { id: todo.id } }} asChild>
                  <button className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </Action>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Inspector */}
        <div className="w-full max-w-xl h-[700px] bg-slate-900/50 rounded-[2.5rem] border border-white/5 flex flex-col p-8 shadow-2xl backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Input Stream + Active Keybinds</h2>
            <div className="flex gap-2">
              {KEYBINDINGS.map((kb) => {
                const isActive = activeKeybindingMap.get(kb.key);
                return (
                  <div key={kb.key} className={`px-2 py-1 rounded text-[8px] font-mono border transition-all ${isActive ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-700 opacity-30'
                    }`}>
                    {kb.key === ' ' ? 'SPACE' : kb.key.toUpperCase()}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
            {[...state.history].reverse().map((entry, i) => (
              <div key={i} className="flex gap-4 p-4 bg-black/40 rounded-3xl border border-white/[0.03] font-mono text-[9px]">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center text-indigo-400 border-b border-white/5 pb-2">
                    <span className="opacity-40 font-bold">#{(state.history.length - i).toString().padStart(3, '0')}</span>
                    <span className="font-black tracking-widest uppercase text-[10px]">{entry.command.type}</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-600 uppercase mb-1 font-bold tracking-tighter opacity-50">Payload</p>
                      <pre className="text-slate-400 overflow-hidden leading-tight">{JSON.stringify('payload' in entry.command ? entry.command.payload : {}, null, 1)}</pre>
                    </div>
                    <div>
                      <p className="text-pink-500/50 uppercase mb-1 font-bold tracking-tighter">Resulting Context (ID)</p>
                      <pre className="text-slate-500 overflow-hidden leading-tight">
                        focusId: {JSON.stringify(entry.resultingState.focusId)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CommandContext.Provider>
  )
}

export default function App() {
  return (
    <ContextProvider>
      <TodoApp />
    </ContextProvider>
  )
}
