import { Field } from "@os/6-components/field/Field";
import { Item } from "@os/6-components/primitives/Item";

import { Trigger } from "@os/6-components/primitives/Trigger";
import { Zone } from "@os/6-components/primitives/Zone";
import {
    FileCode,
    Filter,
    Globe,
    MoreHorizontal,
    Search,
    X,
} from "lucide-react";
import { useState } from "react";

interface PageData {
    id: string;
    name: string;
    path: string;
    updatedAt: Date;
    status: "published" | "draft" | "archived";
    author: string;
}

const MOCK_PAGES: PageData[] = [
    {
        id: "page-1",
        name: "Landing Page",
        path: "/",
        updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        status: "published",
        author: "User",
    },
    {
        id: "page-2",
        name: "About Us",
        path: "/about",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        status: "published",
        author: "User",
    },
    {
        id: "page-3",
        name: "Privacy Policy",
        path: "/privacy",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        status: "draft",
        author: "Admin",
    },
    {
        id: "page-4",
        name: "Contact",
        path: "/contact",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
        status: "archived",
        author: "User",
    },
    {
        id: "page-5",
        name: "Blog List",
        path: "/blog",
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12), // 12 days ago
        status: "published",
        author: "Editor",
    },
];

export default function BuilderListPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<
        "all" | "published" | "draft" | "archived"
    >("all");

    const filteredPages = MOCK_PAGES.filter((page) => {
        const query = searchQuery?.toLowerCase() || "";
        const matchesSearch =
            (page.name?.toLowerCase().includes(query) ?? false) ||
            (page.path?.toLowerCase().includes(query) ?? false);
        const matchesFilter =
            activeFilter === "all" || page.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: PageData["status"]) => {
        switch (status) {
            case "published":
                return "bg-green-100 text-green-700 border-green-200";
            case "draft":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "archived":
                return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const handleRowClick = (pageId: string) => {
        // Ideally this would navigate to the builder with this ID
        console.log("Navigating to builder for:", pageId);
        // For demo purposes, we can just alert or log
        // router.navigate({ to: '/_minimal/builder', search: { pageId } })
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                        Pages
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your website structure and content.
                    </p>
                </div>
                <button
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-slate-900 outline-none"
                    tabIndex={0} // Make focusable if outside Zone, but usually button is naturally focusable
                >
                    + New Page
                </button>
            </div>

            {/* Toolbar: Search & Filter */}
            <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center gap-4">
                {/* Search Bar */}
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white border border-transparent focus-within:border-blue-500/50 transition-all cursor-text group">
                    <Search
                        size={16}
                        className="text-slate-400 group-focus-within:text-blue-500 transition-colors"
                    />
                    <Field
                        value={searchQuery}
                        name="page-search"
                        placeholder="Search pages..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
                        onChange={(_: unknown, val: string) => setSearchQuery(val)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Filter Trigger */}
                <Trigger
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${activeFilter !== "all"
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    onClick={() => {
                        // Cycle filters for demo: All -> Published -> Draft -> Archived -> All
                        const next =
                            activeFilter === "all"
                                ? "published"
                                : activeFilter === "published"
                                    ? "draft"
                                    : activeFilter === "draft"
                                        ? "archived"
                                        : "all";
                        setActiveFilter(next);
                    }}
                >
                    <Filter size={16} />
                    <span>
                        {activeFilter === "all"
                            ? "Filter"
                            : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                    </span>
                </Trigger>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                <Zone
                    id="builder-page-list"
                    className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                    options={{
                        navigate: { orientation: "vertical" }, // Vertical list navigation
                        project: { autoFocus: true },
                    }}
                >
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-4 pl-2">Name</div>
                        <div className="col-span-3">Path</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Last Modified</div>
                        <div className="col-span-1 text-right pr-2">Actions</div>
                    </div>

                    {/* Table Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredPages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Search size={32} className="mb-2 opacity-50" />
                                <p>No pages found</p>
                            </div>
                        ) : (
                            filteredPages.map((page) => (
                                <Item key={page.id} id={page.id} asChild>
                                    <button
                                        className="w-full grid grid-cols-12 gap-4 px-6 py-4 items-center text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 transition-colors group data-[focused]:bg-blue-50 data-[focused]:ring-1 data-[focused]:ring-blue-500"
                                        onClick={() => handleRowClick(page.id)}
                                    >
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-focus:bg-blue-100 group-focus:text-blue-600 group-data-[focused]:bg-blue-100 group-data-[focused]:text-blue-600 transition-colors">
                                                <FileCode size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900 group-focus:text-blue-900 group-data-[focused]:text-blue-900">
                                                    {page.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded w-fit group-focus:bg-blue-100/50 group-data-[focused]:bg-blue-100/50">
                                                <Globe size={12} className="text-slate-400" />
                                                {page.path}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                    page.status
                                                )}`}
                                            >
                                                {page.status}
                                            </span>
                                        </div>

                                        <div className="col-span-2 text-sm text-slate-500">
                                            {/* Simple relative time format */}
                                            {new Intl.RelativeTimeFormat("en", {
                                                style: "short",
                                            }).format(
                                                -Math.round(
                                                    (Date.now() - page.updatedAt.getTime()) / (1000 * 60 * 60)
                                                ),
                                                "hour"
                                            )}
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            <div className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors group-focus:text-blue-500 group-data-[focused]:text-blue-500">
                                                <MoreHorizontal size={16} />
                                            </div>
                                        </div>
                                    </button>
                                </Item>

                            ))
                        )}
                    </div>
                </Zone>
            </div >
        </div >
    );
}
