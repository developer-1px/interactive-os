import { Zone, Item, Trigger } from '../lib/primitives';
import { useTodoEngine } from '../lib/todo_engine';
import { SIDEBAR_REGISTRY, SelectCategory } from '../lib/todo_commands';
import { Inbox, Briefcase, User, Layout, MoveUp, MoveDown, CornerDownLeft, ArrowRight } from 'lucide-react';

export function Sidebar() {
    const { state } = useTodoEngine();



    const getIcon = (id: string) => {
        switch (id) {
            case 'cat_inbox': return <Inbox size={18} />;
            case 'cat_work': return <Briefcase size={18} />;
            case 'cat_personal': return <User size={18} />;
            default: return <Inbox size={18} />;
        }
    };

    return (
        <Zone id="sidebar" area="nav" registry={SIDEBAR_REGISTRY} defaultFocusId={state.selectedCategoryId || state.categories[0]?.id}>
            <div className="w-72 flex flex-col h-full bg-[#0F1117] border-r border-white/5 relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="p-8 pb-4 z-10">
                    <h1 className="font-bold text-white text-xl tracking-tight flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Layout size={16} className="text-white" />
                        </div>
                        <span className="opacity-90">Interactive</span>
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar z-10 space-y-1">
                    <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-4 mb-2">Space</div>
                    {state.categories.map(cat => (
                        <Item
                            key={cat.id}
                            id={cat.id}
                            className={`group relative px-4 py-2 rounded-xl text-sm font-medium outline-none cursor-pointer transition-all duration-300 overflow-hidden
                                hover:bg-white/[0.02]
                                data-[active=true]:bg-white/[0.03] data-[active=true]:shadow-[0_4px_20px_rgba(0,0,0,0.2)] data-[active=true]:translate-x-1
                                focus:bg-white/[0.03] focus:translate-x-1
                                before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:bg-indigo-500 before:rounded-r-full before:opacity-0 data-[active=true]:before:opacity-100 focus:before:opacity-100 before:transition-opacity
                            `}
                        >
                            <Trigger command={SelectCategory({ id: cat.id })} asChild>
                                <div className="flex items-center gap-3 w-full h-full">
                                    <span className={`transition-colors duration-300 ${state.selectedCategoryId === cat.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                        {getIcon(cat.id)}
                                    </span>
                                    <span className={`transition-colors duration-300 ${state.selectedCategoryId === cat.id ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        {cat.text}
                                    </span>

                                    {/* Selection Indicator */}
                                    {state.selectedCategoryId === cat.id && (
                                        <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                                    )}
                                </div>
                            </Trigger>
                        </Item>
                    ))}
                </div>

                <div className="p-6 mt-auto border-t border-white/5 bg-black/20 z-10">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guide</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1 py-0.5 rounded flex"><MoveUp size={10} /></span>
                            <span className="bg-white/10 px-1 py-0.5 rounded flex"><MoveDown size={10} /></span>
                            <span>Nav</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1 py-0.5 rounded flex"><CornerDownLeft size={10} /></span>
                            <span>Select</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1 py-0.5 rounded flex"><ArrowRight size={10} /></span>
                            <span>Focus List</span>
                        </div>
                    </div>
                </div>
            </div>
        </Zone>
    );
}
