import { useState } from "react";
import {
  MockButton,
  MockInput,
  MockToggle,
} from "../components/mocks/MockInteraction";
import {
  MockBadge,
  MockIcon,
  MockShortcut,
  MockText,
} from "../components/mocks/MockPrimitives";
import {
  MockWindow,
  MockScrollArea,
  MockDivider,
} from "../components/mocks/MockStructure";
import {
  MockSpinner,
  MockToast,
  MockCursor,
} from "../components/mocks/MockFeedback";
import { Package, Bell, Layout } from "lucide-react";

export default function ShowcasePage() {
  const [loading, setLoading] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerLoad = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    }, 1500);
  };

  return (
    <div className="flex-1 h-full bg-[#090A0C] overflow-y-auto custom-scrollbar p-12 relative">
      {/* Background Ambient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Package size={24} className="text-white" />
          </div>
          <div>
            <MockText variant="h1">Component Showcase</MockText>
            <MockText variant="caption" className="mt-1">
              Interface OS Mock Component System
            </MockText>
          </div>
        </div>
        <div className="flex gap-2">
          <MockBadge label="v1.0.0" color="success" />
          <MockBadge label="Experimental" color="warning" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* Section 1: Primitives */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full" /> Primitives
          </h3>

          <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-8">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Typography
              </h4>
              <div className="space-y-2">
                <MockText variant="h1">Heading 1</MockText>
                <MockText variant="h2">Heading 2</MockText>
                <MockText variant="body">
                  Body text example with standard weights.
                </MockText>
                <MockText variant="caption">
                  Caption text for smaller details.
                </MockText>
              </div>
            </div>

            <MockDivider />

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                <MockBadge label="Neutral" color="neutral" />
                <MockBadge label="Success" color="success" />
                <MockBadge label="Warning" color="warning" />
                <MockBadge label="Error" color="error" />
                <MockBadge label="Info" color="info" />
              </div>
            </div>

            <MockDivider />

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Shortcuts
              </h4>
              <div className="space-y-2">
                <MockShortcut keys={["⌘", "K"]} />
                <MockShortcut keys={["Ctrl", "Shift", "P"]} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Interaction */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-pink-500 rounded-full" /> Interaction
          </h3>

          <div className="p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-8">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Inputs
              </h4>
              <div className="space-y-4">
                <MockInput placeholder="Standard Input..." />
                <MockInput label="With Label" placeholder="Enter value..." />
                <MockInput
                  label="Error State"
                  error
                  placeholder="Invalid input"
                  defaultValue="Wrong Value"
                />
                <MockToggle
                  label="Toggle Option"
                  checked={toggle}
                  onChange={setToggle}
                />
              </div>
            </div>

            <MockDivider />

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Buttons
              </h4>
              <div className="flex flex-wrap gap-3">
                <MockButton onClick={triggerLoad} loading={loading}>
                  Primary Action
                </MockButton>
                <MockButton intent="secondary" icon={<Layout size={14} />}>
                  Secondary
                </MockButton>
                <MockButton intent="danger" icon={<Bell size={14} />}>
                  Danger
                </MockButton>
                <MockButton intent="ghost">Ghost</MockButton>
                <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-md">
                  <MockSpinner size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: OS Structure */}
        <div className="space-y-6">
          <h3 className="text-xl font-light text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-cyan-500 rounded-full" /> OS Structure
          </h3>

          <div className="relative h-[400px]">
            <MockWindow
              title="Mock Window"
              width="100%"
              height={300}
              className="absolute top-0 left-0 z-10"
            >
              <div className="flex h-full">
                <div className="w-16 border-r border-white/5 bg-black/20 flex flex-col items-center py-4 gap-4">
                  <MockIcon name="Home" className="text-slate-500" />
                  <MockIcon name="Settings" className="text-slate-500" />
                </div>
                <div className="flex-1 p-4 bg-[#0F1115]">
                  <MockScrollArea>
                    <div className="space-y-4">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-12 rounded bg-white/5 w-full animate-pulse"
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                  </MockScrollArea>
                </div>
              </div>
            </MockWindow>

            {/* Overlays */}
            <MockCursor x={280} y={240} label="User A" color="#ec4899" />
            <MockCursor x={120} y={180} label="User B" color="#3b82f6" />
          </div>
        </div>
      </div>

      <MockToast
        message="Action completed successfully"
        type="success"
        visible={toastVisible}
      />
    </div>
  );
}
