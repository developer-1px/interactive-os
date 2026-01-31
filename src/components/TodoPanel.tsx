import { useTodoEngine } from '../lib/todo_engine';
import { TODO_LIST_REGISTRY } from '../lib/todo_commands';

export function TodoPanel() {
    const { state, Action, Field, Option, ctx, FocusZone } = useTodoEngine();
    const filteredTodos = (ctx.filteredTodos as unknown as any[]) || [];

    return (
        <FocusZone
            id="todoList"
            defaultFocusId="DRAFT"
            registry={TODO_LIST_REGISTRY}
        >
            <main className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-auto bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] h-full">
                <div className="bg-slate-900 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.4)] border border-white/[0.03] overflow-hidden max-w-md w-full h-[750px] flex flex-col transition-all duration-500 hover:border-white/5">

                    <div className="p-12 pb-8">
                        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none mb-1">
                            Atomic<br /><span className="text-indigo-500">Option</span>
                        </h1>
                        <p className="text-slate-500 text-[10px] font-black tracking-[0.2em] uppercase mt-3 opacity-40">System Node v2.0</p>
                    </div>

                    <div className="px-12 pb-8">
                        <Field
                            value={state.draft}
                            name="draft"
                            updateType="PATCH"
                            active={state.focusId === 'DRAFT'}
                            autoFocus
                            commitCommand={{ type: 'ADD_TODO' }}
                            asChild
                        >
                            <input type="text" placeholder="Entry Buffer..." className={`w-full bg-slate-800/20 border-2 rounded-2xl px-6 py-5 text-lg font-medium focus:outline-none transition-all ${state.focusId === 'DRAFT' ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.1)] bg-slate-800/40' : 'border-white/5'}`} />
                        </Field>
                    </div>

                    <div className="flex-1 overflow-auto px-10 pb-10 custom-scrollbar outline-none">
                        {filteredTodos.map((todo) => (
                            <Option
                                key={todo.id}
                                id={todo.id}
                                active={state.focusId === todo.id}
                                asChild
                            >
                                <div
                                    className={`flex items-center p-5 mb-3 rounded-[1.8rem] border transition-all duration-300 outline-none cursor-pointer group ${state.focusId === todo.id
                                        ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_10px_40px_rgba(0,0,0,0.3)] translate-x-1'
                                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center justify-center mr-5">
                                        <Action command={{ type: 'TOGGLE_TODO', payload: { id: todo.id } }} asChild>
                                            <button className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center border-2 ${todo.completed ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800 border-white/5 group-hover:border-white/20'}`}>
                                                {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                        </Action>
                                    </div>

                                    {state.editingId === todo.id ? (
                                        <Field
                                            value={state.editDraft}
                                            active={true}
                                            autoFocus={true}
                                            syncCommand={{ type: 'SYNC_EDIT_DRAFT', payload: { text: '' } }}
                                            asChild
                                        >
                                            <input
                                                type="text"
                                                className="flex-1 bg-indigo-500/20 border-none outline-none text-white font-bold px-0 py-0"
                                            />
                                        </Field>
                                    ) : (
                                        <span className={`flex-1 text-base font-bold transition-all ${todo.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{todo.text}</span>
                                    )}

                                    <Action command={{ type: 'DELETE_TODO', payload: { id: todo.id } }} asChild>
                                        <button className="p-2.5 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </Action>
                                </div>
                            </Option>
                        ))}
                        {filteredTodos.length === 0 && (
                            <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20 italic text-slate-500 text-sm">
                                No active tasks
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </FocusZone>
    );
}
