import { NavLink } from 'react-router-dom';
import { Layout, Search, Settings, User, Package, Book, Beaker } from 'lucide-react';

export function GlobalNav() {
    const navItems = [
        { id: 'todo', icon: Layout, path: '/', label: 'Todo' },
        { id: 'search', icon: Search, path: '/search', label: 'Search' },
        { id: 'docs', icon: Book, path: '/docs', label: 'Documentation' },
        { id: 'showcase', icon: Package, path: '/showcase', label: 'Showcase' },
        { id: 'experiment', icon: Beaker, path: '/experiment', label: 'Separation Lab' },
    ];

    const bottomItems = [
        { id: 'settings', icon: Settings, path: '/settings', label: 'Settings' },
        { id: 'user', icon: User, path: '/profile', label: 'Profile' },
    ];

    return (
        <div className="w-12 h-screen flex flex-col items-center py-4 bg-[#0B0D12] border-r border-white/5 z-50 flex-shrink-0">
            {/* Top Navigation */}
            <nav className="flex flex-col gap-4 w-full items-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `
                            relative w-12 h-12 flex items-center justify-center text-slate-500 transition-all duration-200
                            hover:text-slate-300
                            ${isActive ? 'text-indigo-400' : ''}
                        `}
                        title={item.label}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                                )}
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="flex-1" />

            {/* Bottom Actions */}
            <div className="flex flex-col gap-4 w-full items-center mb-2">
                {bottomItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `
                            relative w-12 h-12 flex items-center justify-center text-slate-500 transition-all duration-200
                            hover:text-slate-300
                            ${isActive ? 'text-indigo-400' : ''}
                        `}
                        title={item.label}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
                                )}
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
