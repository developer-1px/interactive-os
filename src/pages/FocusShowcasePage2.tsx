import { useState } from "react";
import { Zone } from "@os/app/export/primitives/Zone.tsx";
import { Item } from "@os/app/export/primitives/Item.tsx";
import { Field } from "@os/app/export/primitives/Field.tsx";
import { Trigger } from "@os/app/export/primitives/Trigger.tsx";
import {
    LayoutGrid,
    Wifi,
    Thermometer,
    Lightbulb,
    Lock,
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    User,
    Mail,
    MapPin,
    Save,
    RotateCcw
} from "lucide-react";
import type { BaseCommand } from "@os/entities/BaseCommand";

export default function FocusShowcasePage2() {
    return (
        <div className="flex-1 h-full bg-slate-50 text-slate-800 overflow-y-auto custom-scrollbar font-sans selection:bg-indigo-500/20">
            <div className="max-w-5xl mx-auto px-8 py-12 space-y-16">

                {/* Header */}
                <header className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold tracking-wider mb-2 uppercase">
                        <LayoutGrid size={12} />
                        Real-World Primitives
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Focus Showcase II
                    </h1>
                    <p className="text-slate-500 leading-relaxed text-xl">
                        A gallery of real-world interaction patterns using the Antigravity focus primitives: Zone, Item, Trigger, and Field.
                    </p>
                </header>

                {/* Sample 1: Smart Home Dashboard (Zone + Items) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            1. Smart Home Dashboard
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">Zone + Item</span>
                        </h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <p className="text-slate-500 max-w-2xl">
                        A grid-based control panel. Each tile is an <code>Item</code> inside a <code>Zone</code> configured with <code>direction="grid"</code>.
                        Navigation tracks spatial position naturally.
                    </p>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-3xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Living Room</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <Zone
                            id="smart-home-grid"
                            direction="grid"
                            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                        >
                            <SmartDeviceCard
                                id="device-light-1"
                                icon={<Lightbulb size={24} />}
                                label="Main Lights"
                                value="80%"
                                active={true}
                                color="amber"
                            />
                            <SmartDeviceCard
                                id="device-thermostat"
                                icon={<Thermometer size={24} />}
                                label="Thermostat"
                                value="22°C"
                                active={true}
                                color="rose"
                            />
                            <SmartDeviceCard
                                id="device-lock"
                                icon={<Lock size={24} />}
                                label="Front Door"
                                value="Locked"
                                active={true}
                                color="emerald"
                            />
                            <SmartDeviceCard
                                id="device-wifi"
                                icon={<Wifi size={24} />}
                                label="Guest Wi-Fi"
                                value="On"
                                active={true}
                                color="blue"
                            />
                            <SmartDeviceCard
                                id="device-light-2"
                                icon={<Lightbulb size={24} />}
                                label="Mood Light"
                                value="Off"
                                active={false}
                                color="purple"
                            />
                            <SmartDeviceCard
                                id="device-cam"
                                icon={<div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current" /></div>}
                                label="Entrance Cam"
                                value="Active"
                                active={true}
                                color="slate"
                            />
                        </Zone>
                    </div>
                </section>

                {/* Sample 2: Text Editor Toolbar (Zone + Triggers) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            2. Action Toolbar
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">Zone + Trigger</span>
                        </h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <p className="text-slate-500 max-w-2xl">
                        A sophisticated toolbar using <code>Trigger</code> for immediate command dispatch.
                        The zone uses <code>edge="loop"</code> for efficient cycling. Triggers handle clicks and Enter keys automatically.
                    </p>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-slate-100/50 max-w-2xl">
                        <Zone
                            id="editor-section"
                            tab="flow"
                            className="space-y-6"
                        >
                            <Zone
                                id="editor-toolbar"
                                role="toolbar"
                                direction="h"
                                edge="loop"
                                className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-xl"
                            >
                                <ToolbarTrigger id="cmd-bold" icon={<Bold size={18} />} label="Bold" command={{ type: "FORMAT_BOLD", payload: {} }} />
                                <ToolbarTrigger id="cmd-italic" icon={<Italic size={18} />} label="Italic" command={{ type: "FORMAT_ITALIC", payload: {} }} />
                                <ToolbarTrigger id="cmd-underline" icon={<Underline size={18} />} label="Underline" command={{ type: "FORMAT_UNDERLINE", payload: {} }} />

                                <div className="w-px h-6 bg-slate-300 mx-1" />

                                <ToolbarTrigger id="cmd-left" icon={<AlignLeft size={18} />} label="Align Left" command={{ type: "ALIGN_LEFT", payload: {} }} />
                                <ToolbarTrigger id="cmd-center" icon={<AlignCenter size={18} />} label="Align Center" command={{ type: "ALIGN_CENTER", payload: {} }} />
                                <ToolbarTrigger id="cmd-right" icon={<AlignRight size={18} />} label="Align Right" command={{ type: "ALIGN_RIGHT", payload: {} }} />
                            </Zone>

                            <Field
                                name="editor-content"
                                mode="immediate"
                                multiline
                                value="The quick brown fox jumps over the lazy dog. Click or use keyboard on the toolbar above to trigger commands."
                                placeholder="Start typing here..."
                                className="p-6 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-sm font-serif leading-relaxed min-h-[120px] outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 data-[focused=true]:border-indigo-300 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-100"
                            />
                        </Zone>
                    </div>
                </section>

                {/* Sample 3: User Profile Settings (Zone + Fields) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            3. Profile Settings
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2">Zone + Field</span>
                        </h2>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <p className="text-slate-500 max-w-2xl">
                        A form using <code>Field</code> primitives in <code>deferred</code> mode.
                        This demonstrates the "Enter to Edit" pattern, keeping focus navigation fast and preventing accidental typing.
                    </p>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-xl overflow-hidden">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
                                    <p className="text-sm text-slate-500">Update your personal information</p>
                                </div>
                            </div>
                        </div>

                        <Zone
                            id="profile-form"
                            role="form"
                            direction="v"
                            tab="flow"
                            className="p-8 space-y-6"
                        >
                            <FormField
                                id="field-name"
                                label="Full Name"
                                icon={<User size={16} />}
                                placeholder="Your name"
                                defaultValue="Alex Chen"
                            />
                            <FormField
                                id="field-email"
                                label="Email Address"
                                icon={<Mail size={16} />}
                                placeholder="name@example.com"
                                defaultValue="alex@antigravity.dev"
                            />
                            <FormField
                                id="field-location"
                                label="Location"
                                icon={<MapPin size={16} />}
                                placeholder="City, Country"
                                defaultValue="San Francisco, CA"
                            />

                            <div className="pt-4 flex gap-3">
                                <Trigger
                                    id="btn-save"
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 outline-none transition-all"
                                    command={{ type: "SAVE_PROFILE", payload: {} }}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Save size={16} /> Save Changes
                                    </div>
                                </Trigger>
                                <Trigger
                                    id="btn-reset"
                                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 outline-none transition-all"
                                    command={{ type: "RESET_PROFILE", payload: {} }}
                                >
                                    <RotateCcw size={16} />
                                </Trigger>
                            </div>
                        </Zone>
                    </div>
                </section>

                <footer className="text-center text-slate-400 text-xs py-12">
                    <p>Focus Primitives Demonstration • v2.0</p>
                </footer>

            </div>
        </div>
    );
}

// --- Subcomponents ---

function SmartDeviceCard({ id, icon, label, value, active, color }: {
    id: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    active: boolean;
    color: "amber" | "rose" | "emerald" | "blue" | "purple" | "slate";
}) {
    const colorStyles = {
        amber: "text-amber-600 bg-amber-50 group-data-[focused=true]:bg-amber-600 group-data-[focused=true]:text-white",
        rose: "text-rose-600 bg-rose-50 group-data-[focused=true]:bg-rose-600 group-data-[focused=true]:text-white",
        emerald: "text-emerald-600 bg-emerald-50 group-data-[focused=true]:bg-emerald-600 group-data-[focused=true]:text-white",
        blue: "text-blue-600 bg-blue-50 group-data-[focused=true]:bg-blue-600 group-data-[focused=true]:text-white",
        purple: "text-purple-600 bg-purple-50 group-data-[focused=true]:bg-purple-600 group-data-[focused=true]:text-white",
        slate: "text-slate-600 bg-slate-100 group-data-[focused=true]:bg-slate-600 group-data-[focused=true]:text-white",
    };

    return (
        <Item id={id}>
            {({ isFocused }) => (
                <div
                    data-focused={isFocused}
                    className={`
                        group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 min-h-[140px]
                        ${isFocused
                            ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-xl scale-[1.02] z-10"
                            : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                        }
                    `}
                >
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-colors
                        ${colorStyles[color]}
                    `}>
                        {icon}
                    </div>
                    <div className="mt-auto">
                        <div className="text-[13px] font-semibold text-slate-700">{label}</div>
                        <div className={`text-xs font-medium ${active ? 'text-slate-500' : 'text-slate-300'}`}>
                            {value}
                        </div>
                    </div>
                    {/* Active Indicator Dot */}
                    {active && (
                        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                </div>
            )}
        </Item>
    );
}

function ToolbarTrigger({ id, icon, label, command }: { id: string; icon: React.ReactNode; label: string; command: BaseCommand }) {
    return (
        <Trigger
            id={id}
            command={command}
            className="group relative p-2 rounded-lg text-slate-500 hover:text-slate-900 outline-none transition-all data-[focused=true]:bg-white data-[focused=true]:text-indigo-600 data-[focused=true]:shadow-md data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500"
        >
            {icon}
            <span className="sr-only">{label}</span>
        </Trigger>
    );
}

function FormField({ id, label, icon, placeholder, defaultValue }: { id: string; label: string; icon: React.ReactNode; placeholder: string; defaultValue: string }) {
    const [val] = useState(defaultValue);

    return (
        <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {icon} {label}
            </div>
            <Field
                name={id}
                mode="immediate"
                value={val}
                placeholder={placeholder}
                className="
                    w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all
                    bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400
                    data-[focused=true]:border-indigo-500 data-[focused=true]:bg-white data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-100
                "
            />
        </div>
    );
}

