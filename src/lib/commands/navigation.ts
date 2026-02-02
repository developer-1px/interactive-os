import { defineCommand } from "./factory";

export const NavigateUp = defineCommand({
    id: "NAVIGATE_UP",
    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "NAVIGATE", direction: "UP" }],
    }),
});

export const NavigateDown = defineCommand({
    id: "NAVIGATE_DOWN",
    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "NAVIGATE", direction: "DOWN" }],
    }),
});

export const NavigateLeft = defineCommand({
    id: "NAVIGATE_LEFT",
    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "NAVIGATE", direction: "LEFT" }],
    }),
});

export const NavigateRight = defineCommand({
    id: "NAVIGATE_RIGHT",
    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "NAVIGATE", direction: "RIGHT" }],
    }),
});
