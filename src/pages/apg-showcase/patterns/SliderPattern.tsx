/**
 * APG Slider Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * W3C APG Example: Color picker with RGB sliders.
 *
 * Headless pattern:
 *   OS injects aria-valuenow, aria-valuemin, aria-valuemax, role=slider onto Item.
 *   Arrow keys adjust value via OS_VALUE_CHANGE. CSS reads data-focused.
 */

import { defineApp } from "@/os/defineApp";
import { OS_VALUE_CHANGE } from "@os/3-commands";
import { os } from "@os/kernel";
import clsx from "clsx";
import { useEffect } from "react";

// ─── Slider Data ───

interface SliderDef {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    initial: number;
    color: string;
    gradient: string;
}

const SLIDERS: SliderDef[] = [
    {
        id: "slider-red",
        label: "Red",
        min: 0,
        max: 255,
        step: 1,
        initial: 128,
        color: "text-red-600",
        gradient: "from-black to-red-500",
    },
    {
        id: "slider-green",
        label: "Green",
        min: 0,
        max: 255,
        step: 1,
        initial: 200,
        color: "text-green-600",
        gradient: "from-black to-green-500",
    },
    {
        id: "slider-blue",
        label: "Blue",
        min: 0,
        max: 255,
        step: 1,
        initial: 64,
        color: "text-blue-600",
        gradient: "from-black to-blue-500",
    },
];

// ─── App + Zone (defineApp pattern) ───

const SliderApp = defineApp<Record<string, never>>("apg-slider-app", {});

const sliderZone = SliderApp.createZone("apg-slider-zone");
const SliderUI = sliderZone.bind({
    role: "slider",
    options: {
        value: { mode: "continuous", min: 0, max: 255, step: 1, largeStep: 10 },
        navigate: { orientation: "vertical" },
    },
});

// ─── Slider Track (visual, non-interactive) ───

function SliderTrack({
    value,
    min,
    max,
    gradient,
}: {
    value: number;
    min: number;
    max: number;
    gradient: string;
}) {
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative h-3 rounded-full overflow-hidden bg-gray-200 flex-1">
            {/* Gradient track */}
            <div
                className={clsx("absolute inset-0 bg-gradient-to-r rounded-full", gradient)}
                style={{ opacity: 0.3 }}
            />
            {/* Filled portion */}
            <div
                className={clsx("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-75", gradient)}
                style={{ width: `${percent}%` }}
            />
            {/* Thumb */}
            <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md border-2 border-gray-300 transition-all duration-75"
                style={{ left: `calc(${percent}% - 10px)` }}
            />
        </div>
    );
}

// ─── Individual Slider Row ───

function SliderRow({ slider }: { slider: SliderDef }) {
    return (
        <SliderUI.Item
            id={slider.id}
            aria-label={slider.label}
            className={clsx(
                "group flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all",
                "data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:bg-indigo-50/50",
                "hover:bg-gray-50",
            )}
        >
            {({ valueNow }: { valueNow: number | undefined }) => {
                const value = valueNow ?? slider.initial;
                return (
                    <>
                        {/* Label */}
                        <span
                            className={clsx(
                                "text-sm font-semibold w-14 tabular-nums",
                                slider.color,
                            )}
                        >
                            {slider.label}
                        </span>

                        {/* Track */}
                        <SliderTrack
                            value={value}
                            min={slider.min}
                            max={slider.max}
                            gradient={slider.gradient}
                        />

                        {/* Value display */}
                        <span className="text-sm font-mono text-gray-700 w-10 text-right tabular-nums">
                            {value}
                        </span>
                    </>
                );
            }}
        </SliderUI.Item>
    );
}

// ─── Color Preview ───

function ColorPreview() {
    // Read value state from OS kernel (global state, not app-local)
    const values = os.useComputed((s) => {
        const z = s.os.focus.zones["apg-slider-zone"];
        return {
            r: z?.valueNow?.["slider-red"] ?? 128,
            g: z?.valueNow?.["slider-green"] ?? 200,
            b: z?.valueNow?.["slider-blue"] ?? 64,
        };
    });

    const hex = `#${values.r.toString(16).padStart(2, "0")}${values.g.toString(16).padStart(2, "0")}${values.b.toString(16).padStart(2, "0")}`;

    return (
        <div className="flex items-center gap-4">
            <div
                className="w-20 h-20 rounded-xl shadow-inner border border-gray-200 transition-colors duration-75"
                style={{ backgroundColor: hex }}
            />
            <div>
                <div className="text-xl font-mono font-bold text-gray-800 uppercase">
                    {hex}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    rgb({values.r}, {values.g}, {values.b})
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───

export function SliderPattern() {
    // Initialize slider values on mount
    useEffect(() => {
        for (const slider of SLIDERS) {
            os.dispatch(
                OS_VALUE_CHANGE({
                    action: "set",
                    value: slider.initial,
                    itemId: slider.id,
                    zoneId: "apg-slider-zone",
                }),
            );
        }
    }, []);

    return (
        <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-3">Slider — Color Picker</h3>
            <p className="text-sm text-gray-500 mb-4">
                W3C APG Slider Pattern: RGB color picker. <kbd>↑↓←→</kbd> adjust
                value by 1. <kbd>PgUp/PgDn</kbd> adjust by 10.{" "}
                <kbd>Home/End</kbd> jump to min/max.{" "}
                <a
                    href="https://www.w3.org/WAI/ARIA/apg/patterns/slider/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 underline"
                >
                    W3C APG Spec →
                </a>
            </p>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
                {/* Color preview */}
                <ColorPreview />

                {/* Sliders */}
                <SliderUI.Zone
                    className="flex flex-col gap-1"
                    aria-label="Color Viewer Sliders"
                >
                    {SLIDERS.map((slider) => (
                        <SliderRow key={slider.id} slider={slider} />
                    ))}
                </SliderUI.Zone>

                {/* Instructions */}
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 space-y-1">
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">↑↓←→</kbd> ±1 step</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">PgUp/PgDn</kbd> ±10 step</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">Home/End</kbd> min/max</div>
                </div>
            </div>
        </div>
    );
}
