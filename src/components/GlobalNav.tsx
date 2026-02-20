import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { useDocsNotification } from "@/docs-viewer/useDocsNotification";
import { useNavRoutes } from "./useNavRoutes";

export function GlobalNav() {
  const location = useLocation();
  const { hasNewDocs, clearNotification } = useDocsNotification();
  const isOnDocs = location.pathname.startsWith("/docs");

  // Auto-generated nav items from route tree
  const { topItems, bottomItems } = useNavRoutes();

  // Clear notification when visiting docs
  useEffect(() => {
    if (isOnDocs && hasNewDocs) {
      clearNotification();
    }
  }, [isOnDocs, hasNewDocs, clearNotification]);

  const commonClass =
    "nav-item relative w-8 h-8 flex items-center justify-center transition-all duration-200 rounded-lg";
  const inactiveClass =
    "text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-200";
  const activeClass =
    "text-indigo-600 bg-white shadow-md ring-1 ring-indigo-100 z-10";

  return (
    <div className="w-10 h-screen flex flex-col items-center py-3 bg-[#F8FAFC] border-r border-slate-200 z-50 flex-shrink-0">
      {/* Top Navigation */}
      <nav className="flex flex-col gap-3 w-full items-center px-2">
        {topItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={commonClass}
            inactiveProps={{ className: inactiveClass }}
            activeProps={{ className: activeClass }}
            data-tooltip={item.label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
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

      {/* Bottom Navigation */}
      <div className="flex flex-col gap-3 w-full items-center mb-4 px-2">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={commonClass}
            inactiveProps={{ className: inactiveClass }}
            activeProps={{ className: activeClass }}
            tabIndex={-1}
            data-tooltip={item.label}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.icon}
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {/* Red dot for new docs */}
                {item.path === "/docs" && hasNewDocs && !isOnDocs && (
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
