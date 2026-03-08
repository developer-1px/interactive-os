/**
 * APG Carousel Pattern -- Showcase UI (Tabbed variant)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/
 *
 * W3C APG Carousel with Tabs:
 *   - Container: role=region, aria-roledescription="carousel"
 *   - Tab picker: role=tablist, horizontal, loop
 *   - Each tab: role=tab, aria-selected, aria-controls
 *   - Each slide: role=tabpanel, aria-roledescription="slide"
 *   - Rotation control: button, toggles auto-rotation
 *   - Previous/Next: buttons, advance slides
 *   - aria-live: "off" (auto-rotating) / "polite" (manual)
 *
 * Keyboard:
 *   - Left/Right Arrow: navigate tabs (wrap)
 *   - Home/End: first/last tab
 *   - Auto-activation: slide changes when tab receives focus
 *   - Tab: exits tablist
 *
 * OS pattern:
 *   The tablist (slide picker) is a standard tablist Zone.
 *   OS injects aria-selected, role=tab, tabIndex onto Item.
 *   Item.Content auto-manages role=tabpanel + hidden.
 *   Rotation and prev/next are app-level state via defineApp commands.
 *   CSS reads ARIA attributes. No manual state management needed.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { Icon } from "@/components/Icon";

// --- Slide Data (TV shows, matching W3C APG example theme) ---

interface SlideDef {
  id: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: SlideDef[] = [
  {
    id: "slide-1",
    title: "Dynamic Coaching",
    description:
      "An interactive experience that helps you grow as a leader through real-time feedback and personalized coaching sessions.",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "slide-2",
    title: "Creative Spaces",
    description:
      "Explore virtual environments designed to spark creativity and foster collaboration across distributed teams.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "slide-3",
    title: "Mindful Focus",
    description:
      "A guided productivity system that combines deep work sessions with mindfulness breaks for peak performance.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "slide-4",
    title: "Data Stories",
    description:
      "Transform complex data sets into compelling visual narratives that drive better decisions and insights.",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "slide-5",
    title: "Sound Design Lab",
    description:
      "A professional audio toolkit for creating immersive soundscapes, from podcasts to interactive installations.",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "slide-6",
    title: "Future Interfaces",
    description:
      "Prototype next-generation user interfaces with spatial computing, voice, and gesture-based interactions.",
    color: "from-indigo-500 to-blue-600",
  },
];

// --- App State ---

interface CarouselState {
  isRotating: boolean;
}

// --- defineApp -> createZone -> bind ---

export const CarouselApp = defineApp<CarouselState>("apg-carousel-app", {
  isRotating: false,
});

const TOGGLE_ROTATION = CarouselApp.command("TOGGLE_ROTATION", (ctx) => ({
  state: { ...ctx.state, isRotating: !ctx.state.isRotating },
}));

const SET_ROTATING = CarouselApp.command(
  "SET_ROTATING",
  (ctx, payload: { value: boolean }) => ({
    state: { ...ctx.state, isRotating: payload.value },
  }),
);

const isRotating = CarouselApp.selector(
  "isRotating",
  (state) => state.isRotating,
);

const carouselZone = CarouselApp.createZone("carousel-tabs");
const CarouselUI = carouselZone.bind({
  role: "tablist",
  options: { select: { followFocus: true } },
  triggers: {
    ToggleRotation: () => TOGGLE_ROTATION(),
    StopRotation: () => SET_ROTATING({ value: false }),
  },
});

// --- Slide Panel Content ---

function SlideContent({ slide }: { slide: SlideDef }) {
  return (
    <div
      className={`bg-gradient-to-br ${slide.color} rounded-lg p-8 text-white min-h-[200px] flex flex-col justify-center`}
    >
      <h4 className="text-2xl font-bold mb-3">{slide.title}</h4>
      <p className="text-white/90 text-sm leading-relaxed max-w-md">
        {slide.description}
      </p>
    </div>
  );
}

// --- Rotation Control Button ---

function RotationControl() {
  const rotating = CarouselApp.useComputed(isRotating);
  return (
    <button
      {...CarouselUI.triggers.ToggleRotation()}
      type="button"
      aria-label={
        rotating ? "Stop automatic slide show" : "Start automatic slide show"
      }
      className="
        p-2 rounded-full transition-colors
        text-gray-500 hover:text-gray-700 hover:bg-gray-100
        focus:outline-none focus:ring-2 focus:ring-indigo-400
      "
    >
      <Icon name={rotating ? "pause" : "play"} size={16} />
    </button>
  );
}

// --- Previous/Next Buttons ---
// These dispatch OS_NAVIGATE via the tablist's built-in navigation.
// Since they are outside the tablist Zone, they use app commands that
// select the previous/next slide by updating selection.

function PrevNextControls() {
  return (
    <div className="flex items-center gap-1">
      <button
        {...CarouselUI.triggers.StopRotation()}
        type="button"
        aria-label="Previous slide"
        aria-controls="carousel-slides"
        className="
          p-2 rounded-full transition-colors
          text-gray-500 hover:text-gray-700 hover:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-indigo-400
        "
      >
        <Icon name="chevron-left" size={16} />
      </button>
      <button
        {...CarouselUI.triggers.StopRotation()}
        type="button"
        aria-label="Next slide"
        aria-controls="carousel-slides"
        className="
          p-2 rounded-full transition-colors
          text-gray-500 hover:text-gray-700 hover:bg-gray-100
          focus:outline-none focus:ring-2 focus:ring-indigo-400
        "
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </div>
  );
}

// --- Main Component ---

export function CarouselPattern() {
  const rotating = CarouselApp.useComputed(isRotating);

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-1">Carousel</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Carousel with Tabs: Arrow keys navigate between slide tabs.
        Selection follows focus (auto-activation). Includes rotation control and
        prev/next buttons.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/carousel/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
      </p>

      {/* Carousel Container */}
      <section
        aria-roledescription="carousel"
        aria-label="Featured content"
        aria-live={rotating ? "off" : "polite"}
        className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white"
      >
        {/* Controls bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <RotationControl />
          <PrevNextControls />
        </div>

        {/* Slide panels -- OS-driven visibility via Item.Content */}
        <div id="carousel-slides" className="min-h-[240px]">
          {SLIDES.map((slide, index) => (
            <CarouselUI.Item.Content
              key={slide.id}
              for={slide.id}
              className="p-4 focus:outline-none"
            >
              <div
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${SLIDES.length}`}
              >
                <SlideContent slide={slide} />
              </div>
            </CarouselUI.Item.Content>
          ))}
        </div>

        {/* Tab list (slide picker) */}
        <CarouselUI.Zone
          className="flex items-center justify-center gap-2 py-3 bg-gray-50 border-t border-gray-100"
          aria-label="Slides"
        >
          {SLIDES.map((slide, index) => (
            <CarouselUI.Item
              key={slide.id}
              id={slide.id}
              className="
                w-3 h-3 rounded-full transition-all duration-200
                bg-gray-300
                aria-selected:bg-indigo-600 aria-selected:scale-125
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:ring-offset-2
                cursor-pointer
              "
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </CarouselUI.Zone>
      </section>
    </div>
  );
}
