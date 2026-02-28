import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { TestBox } from "../../shared/TestLayout";

const items = [
    { id: "dis-1", label: "Enabled A", disabled: false },
    { id: "dis-2", label: "Disabled B", disabled: true },
    { id: "dis-3", label: "Disabled C", disabled: true },
    { id: "dis-4", label: "Enabled D", disabled: false },
    { id: "dis-5", label: "Enabled E", disabled: false },
];

export function DisabledTest() {
    const description = (
        <p>
            <strong>Disabled Items</strong> — arrow navigation skips disabled items
            per APG. Disabled items have <code>aria-disabled="true"</code> and cannot
            receive focus via arrow keys.
        </p>
    );

    return (
        <TestBox title="Disabled Items" spec="§3.2" description={description}>
            <Zone
                id="dis-skip"
                role="listbox"
                options={{ navigate: { orientation: "vertical" } }}
                className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
            >
                {items.map((item) => (
                    <Item
                        key={item.id}
                        id={item.id}
                        role="option"
                        disabled={item.disabled}
                        className={`px-3 py-1.5 rounded text-sm border border-transparent ${item.disabled
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "hover:bg-gray-100 aria-[current=true]:bg-amber-100 aria-[current=true]:text-amber-700 aria-[current=true]:border-amber-300"
                            }`}
                    >
                        {item.label}
                        {item.disabled && (
                            <span className="ml-2 text-[10px] text-gray-400">(disabled)</span>
                        )}
                    </Item>
                ))}
            </Zone>
        </TestBox>
    );
}
