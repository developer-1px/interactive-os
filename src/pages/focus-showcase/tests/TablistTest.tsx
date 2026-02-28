import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { TestBox } from "../../shared/TestLayout";

const tabs = [
    { id: "tl-tab-1", label: "Details", panelId: "tl-panel-1" },
    { id: "tl-tab-2", label: "Reviews", panelId: "tl-panel-2" },
    { id: "tl-tab-3", label: "Settings", panelId: "tl-panel-3" },
];

export function TablistTest() {
    const description = (
        <p>
            <strong>Tablist</strong> — horizontal tabs with automatic activation.
            Arrow keys move between tabs, selection follows focus.
        </p>
    );

    return (
        <TestBox title="Tablist" spec="§3.6" description={description}>
            <Zone
                id="tl-tabs"
                role="tablist"
                className="flex bg-gray-100 p-1 rounded-lg gap-1"
            >
                {tabs.map((tab) => (
                    <Item
                        key={tab.id}
                        id={tab.id}
                        role="tab"
                        className="flex-1 text-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors aria-[selected=true]:bg-white aria-[selected=true]:shadow-sm aria-[selected=true]:text-gray-900 text-gray-500 hover:text-gray-700"
                    >
                        {tab.label}
                    </Item>
                ))}
            </Zone>
        </TestBox>
    );
}
