import { Zone } from "@os/6-components/primitives/Zone.tsx";
import { Item } from "@os/6-components/primitives/Item.tsx";
import { TestBox } from "../../shared/TestLayout";

const fruits = ["Apple", "Banana", "Cherry", "Date", "Elderberry"];

export function TypeaheadTest() {
    const description = (
        <p>
            <strong>Typeahead</strong> — typing a character jumps focus to the next
            matching item. APG requires this for listbox, tree, and menu roles.
        </p>
    );

    return (
        <TestBox title="Typeahead" spec="§3.2" description={description}>
            <Zone
                id="ta-list"
                role="listbox"
                options={{ navigate: { orientation: "vertical", typeahead: true } }}
                className="flex flex-col bg-gray-50 p-2 rounded border border-gray-200 gap-1"
            >
                {fruits.map((fruit) => (
                    <Item
                        key={fruit}
                        id={`ta-${fruit.toLowerCase()}`}
                        role="option"
                        className="px-3 py-1.5 rounded hover:bg-gray-100 aria-[current=true]:bg-violet-100 aria-[current=true]:text-violet-700 text-sm border border-transparent aria-[current=true]:border-violet-300"
                    >
                        {fruit}
                    </Item>
                ))}
            </Zone>
        </TestBox>
    );
}
