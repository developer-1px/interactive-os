import { NavLink } from "react-router-dom";
import {
  Layout,
  Search,
  Settings,
  User,
  Package,
  Book,
  Beaker,
} from "lucide-react";

export function GlobalNav() {
  const navItems = [
    { id: "todo", icon: Layout, path: "/", label: "Todo" },
    { id: "search", icon: Search, path: "/search", label: "Search" },
    { id: "docs", icon: Book, path: "/docs", label: "Documentation" },
    { id: "showcase", icon: Package, path: "/showcase", label: "Showcase" },
    {
      id: "experiment",
      icon: Beaker,
      path: "/experiment",
      label: "Separation Lab",
    },
  ];

  const bottomItems = [
    { id: "settings", icon: Settings, path: "/settings", label: "Settings" },
    { id: "user", icon: User, path: "/profile", label: "Profile" },
  ];

  return (
    <div className="w-10 h-screen flex flex-col items-center py-3 bg-[#F8FAFC] border-r border-slate-200 z-50 flex-shrink-0">
      {/* Top Navigation */}
      <nav className="flex flex-col gap-2.5 w-full items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
                            relative w-8 h-8 flex items-center justify-center text-slate-400 transition-all duration-200 rounded-lg
                            hover:text-slate-600 hover:bg-slate-100
                            ${isActive ? "text-indigo-600 bg-indigo-50" : ""}
                        `}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Bar - keeping it minimal or removing it for a button-like feel */}
                {/* Note: I'm removing the side bar indicator in favor of the button background style check above for compactness, 
                    but if we want the bar, we can keep it inside or outside. Let's try the button style first as it's cleaner at this size. */}
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2.5 w-full items-center mb-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
                            relative w-8 h-8 flex items-center justify-center text-slate-400 transition-all duration-200 rounded-lg
                            hover:text-slate-600 hover:bg-slate-100
                            ${isActive ? "text-indigo-600 bg-indigo-50" : ""}
                        `}
            tabIndex={-1}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
