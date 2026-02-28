import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { TestBox } from "../../shared/TestLayout";

export function RadiogroupTest() {
    const description = (
        <p>
            <strong>Radiogroup</strong> — single selection where arrows move focus AND
            selection. Uses <code>aria-checked</code> instead of{" "}
            <code>aria-selected</code>.
        </p>
    );

    return (
        <TestBox title="Radiogroup" spec="§3.4" description={description}>
            <Zone
                id="rg-group"
                role="radiogroup"
                className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
            >
                {["Small", "Medium", "Large"].map((size) => (
                    <Item
                        key={size}
                        id={`rg-${size.toLowerCase()}`}
                        role="radio"
                        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 aria-[checked=true]:bg-teal-100 aria-[checked=true]:text-teal-700 text-sm border border-transparent aria-[checked=true]:border-teal-300"
                    >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex items-center justify-center aria-[checked=true]:border-teal-500">
                        </span>
                        {size}
                    </Item>
                ))}
            </Zone>
        </TestBox>
    );
}
