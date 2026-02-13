import { Link, useLocation } from "@tanstack/react-router";
import {
  Accessibility,
  Book,
  Cpu,
  FolderOpen,
  Layout,
  MousePointer2,
  Package,
  Settings,
  User,
} from "lucide-react";
import { useEffect } from "react";
import { useDocsNotification } from "@/docs-viewer/useDocsNotification";

export function GlobalNav() {
  const location = useLocation();
  const { hasNewDocs, clearNotification } = useDocsNotification();
  const isOnDocs = location.pathname.startsWith("/docs");

  // Clear notification when visiting docs
  useEffect(() => {
    if (isOnDocs && hasNewDocs) {
      clearNotification();
    }
  }, [isOnDocs, hasNewDocs, clearNotification]);

  const navItems = [
    { id: "todo", icon: Package, path: "/", label: "Todo" },
    { id: "builder", icon: Layout, path: "/builder", label: "Web Builder" },
    {
      id: "focus-playground",
      icon: MousePointer2,
      path: "/playground/focus",
      label: "Focus Playground",
    },
    {
      id: "aria-playground",
      icon: Accessibility,
      path: "/playground/aria",
      label: "ARIA Playground",
    },
    {
      id: "kernel-playground",
      icon: Cpu,
      path: "/playground/kernel",
      label: "Kernel Playground",
    },
    {
      id: "projects",
      icon: FolderOpen,
      path: "/playground/projects",
      label: "Projects",
    },
  ];

  const bottomItems = [
    { id: "docs", icon: Book, path: "/docs", label: "Documentation" },
    { id: "settings", icon: Settings, path: "/settings", label: "Settings" },
    { id: "user", icon: User, path: "/profile", label: "Profile" },
  ];

  const commonClass =
    "relative w-8 h-8 flex items-center justify-center transition-all duration-200 rounded-lg";
  const inactiveClass =
    "text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200";
  const activeClass =
    "text-indigo-600 bg-white shadow-md ring-1 ring-indigo-100 z-10";

  return (
    <div className="w-10 h-screen flex flex-col items-center py-3 bg-[#F8FAFC] border-r border-slate-200 z-50 flex-shrink-0">
      {/* Top Navigation */}
      <nav className="flex flex-col gap-3 w-full items-center px-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={commonClass}
            inactiveProps={{ className: inactiveClass }}
            activeProps={{ className: activeClass }}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform duration-200"
                />
                {isActive && (
                  <div className="absolute inset-0 rounded-lg ring-2 ring-indigo-500/10 pointer-events-none" />
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 w-full items-center mb-4 px-2">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={commonClass}
            inactiveProps={{ className: inactiveClass }}
            activeProps={{ className: activeClass }}
            tabIndex={-1}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {/* Red dot for new docs */}
                {item.id === "docs" && hasNewDocs && !isOnDocs && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#F8FAFC] animate-pulse" />
                )}
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
