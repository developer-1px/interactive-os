import { useTodoEngine } from '../lib/todo_engine';
import { SIDEBAR_REGISTRY } from '../lib/todo_commands';

export function Sidebar() {
    const { state, Action, Option, dispatch, FocusZone } = useTodoEngine();

    return (
        <FocusZone
            id="sidebar"
            defaultFocusId={state.selectedCategoryId}
            registry={SIDEBAR_REGISTRY}
        >
            <aside className="w-80 bg-slate-900/50 border-r border-white/5 flex flex-col p-8 transition-all h-full">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white text-xs font-bold">AG</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Antigravity</h2>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase opacity-40 ml-1">Universal OS v2.0</p>
                </div>

                <nav className="space-y-2">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-4 px-2">Navigation</p>
                    {state.categories.map((cat) => (
                        <Option
                            key={cat.id}
                            id={cat.id}
                            active={state.focusId === cat.id}
                            asChild
                        >
                            <Action command={{ type: 'SELECT_CATEGORY', payload: { id: cat.id } }} asChild>
                                <div
                                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer transition-all border ${state.selectedCategoryId === cat.id
                                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_10px_20px_rgba(99,102,241,0.2)]'
                                        : state.focusId === cat.id
                                            ? 'bg-white/5 border-white/10 text-slate-200 -translate-y-0.5'
                                            : 'border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className="font-bold tracking-tight">{cat.text}</span>
                                    {state.selectedCategoryId === cat.id && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </div>
                            </Action>
                        </Option>
                    ))}
                </nav>
            </aside>
        </FocusZone>
    );
}
