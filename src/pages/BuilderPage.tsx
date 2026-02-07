import { OS } from "@os/features/AntigravityOS";
import {
    NCPHeroBlock,
    NCPNewsBlock,
    NCPServicesBlock,
    EditorToolbar,
} from "./builder";

/**
 * BuilderPage
 * 
 * Visual CMS / Web Builder 데모 - Light Theme
 */
export default function BuilderPage() {
    return (
        <div className="flex-1 h-full flex flex-col bg-slate-100 overflow-hidden">
            {/* Editor Toolbar */}
            <EditorToolbar />

            {/* Canvas Area */}
            <OS.Zone
                id="builder-canvas"
                role="listbox"
                options={{ tab: { behavior: 'escape' }, navigate: { seamless: true } }}
                className="flex-1 overflow-y-auto custom-scrollbar"
            >
                {/* Page Being Edited */}
                <div className="max-w-5xl mx-auto my-6">
                    <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-white min-h-screen">
                        <NCPHeroBlock />
                        <NCPNewsBlock />
                        <NCPServicesBlock />
                    </div>
                </div>
            </OS.Zone>
        </div>
    );
}
