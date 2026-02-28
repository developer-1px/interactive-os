/**
 * AccordionPattern — DOM rendering + interaction test
 *
 * This test renders the ACTUAL AccordionPattern component
 * and verifies that DOM attributes and interactions work end-to-end.
 * The headless tests verify OS state; this verifies the DOM projection.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { produce } from "immer";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { KeyboardListener } from "@/os/1-listeners/keyboard/KeyboardListener";
import { PointerListener } from "@/os/1-listeners/pointer/PointerListener";
import { OS_FOCUS } from "@/os/3-commands/focus";
import { os } from "@/os/kernel";
import { AccordionPattern } from "../../patterns/AccordionPattern";

describe("AccordionPattern (DOM Rendering)", () => {
    beforeEach(() => {
        os.setState((state) =>
            produce(state, (draft) => {
                draft.os.focus.zones = {};
                draft.os.focus.activeZoneId = null;
            }),
        );
    });

    // ═══════════════════════════════════════════════════
    // Basic rendering
    // ═══════════════════════════════════════════════════

    it("renders all 3 accordion headers", () => {
        render(<AccordionPattern />);

        expect(screen.getByText("Personal Information")).toBeTruthy();
        expect(screen.getByText("Billing Address")).toBeTruthy();
        expect(screen.getByText("Shipping Address")).toBeTruthy();
    });

    it("headers have role=button from OS computeItem", () => {
        render(<AccordionPattern />);

        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("all headers have aria-expanded=false initially", () => {
        render(<AccordionPattern />);

        const el = document.getElementById("acc-personal");
        expect(el).toBeTruthy();
        expect(el!.getAttribute("aria-expanded")).toBe("false");
    });

    // ═══════════════════════════════════════════════════
    // Keyboard: Enter toggles expand
    // ═══════════════════════════════════════════════════

    it("Enter on focused header: aria-expanded becomes true", async () => {
        const user = userEvent.setup();

        render(
            <>
                <KeyboardListener />
                <AccordionPattern />
            </>,
        );

        // Focus the first header
        const el = document.getElementById("acc-personal")!;
        el.focus();
        os.dispatch(OS_FOCUS({ zoneId: "apg-accordion", itemId: "acc-personal" }));
        await new Promise((r) => setTimeout(r, 50));

        // Press Enter
        await user.keyboard("{Enter}");
        await new Promise((r) => setTimeout(r, 100));

        expect(el.getAttribute("aria-expanded")).toBe("true");
    });

    it("Enter again: aria-expanded becomes false (toggle)", async () => {
        const user = userEvent.setup();

        render(
            <>
                <KeyboardListener />
                <AccordionPattern />
            </>,
        );

        const el = document.getElementById("acc-personal")!;
        el.focus();
        os.dispatch(OS_FOCUS({ zoneId: "apg-accordion", itemId: "acc-personal" }));
        await new Promise((r) => setTimeout(r, 50));

        // Expand
        await user.keyboard("{Enter}");
        await new Promise((r) => setTimeout(r, 100));
        expect(el.getAttribute("aria-expanded")).toBe("true");

        // Collapse
        await user.keyboard("{Enter}");
        await new Promise((r) => setTimeout(r, 100));
        expect(el.getAttribute("aria-expanded")).toBe("false");
    });

    // ═══════════════════════════════════════════════════
    // Keyboard: Space toggles expand
    // ═══════════════════════════════════════════════════

    it("Space on focused header: aria-expanded becomes true", async () => {
        const user = userEvent.setup();

        render(
            <>
                <KeyboardListener />
                <AccordionPattern />
            </>,
        );

        const el = document.getElementById("acc-personal")!;
        el.focus();
        os.dispatch(OS_FOCUS({ zoneId: "apg-accordion", itemId: "acc-personal" }));
        await new Promise((r) => setTimeout(r, 50));

        await user.keyboard(" ");
        await new Promise((r) => setTimeout(r, 100));

        expect(el.getAttribute("aria-expanded")).toBe("true");
    });

    // ═══════════════════════════════════════════════════
    // Panel visibility (CSS-driven via aria-expanded)
    // ═══════════════════════════════════════════════════

    it("panel region is not visible when collapsed", () => {
        render(<AccordionPattern />);

        const panel = document.getElementById("panel-acc-personal");
        expect(panel).toBeTruthy();
        // Panel exists but should be hidden by CSS (hidden class)
        expect(panel!.classList.contains("hidden") || panel!.closest("[aria-expanded='false']")).toBeTruthy();
    });

    it("panel region has role=region and aria-labelledby", () => {
        render(<AccordionPattern />);

        const panel = document.getElementById("panel-acc-personal");
        expect(panel).toBeTruthy();
        expect(panel!.getAttribute("role")).toBe("region");
        expect(panel!.getAttribute("aria-labelledby")).toBe("acc-personal");
    });

    // ═══════════════════════════════════════════════════
    // Click: toggles expand
    // ═══════════════════════════════════════════════════

    it("click on header: focuses and expands", async () => {
        render(
            <>
                <KeyboardListener />
                <PointerListener />
                <AccordionPattern />
            </>,
        );

        const el = document.getElementById("acc-personal")!;

        // Simulate full pointer sequence (pointerdown + pointerup)
        await act(async () => {
            fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
            fireEvent.pointerUp(el, { clientX: 100, clientY: 100 });
            await new Promise((r) => setTimeout(r, 100));
        });

        // Should be focused
        expect(el.getAttribute("data-focused")).toBe("true");

        // Should be expanded (activate on click)
        expect(el.getAttribute("aria-expanded")).toBe("true");
    });

    it("click on already-expanded header: collapses it", async () => {
        render(
            <>
                <KeyboardListener />
                <PointerListener />
                <AccordionPattern />
            </>,
        );

        const el = document.getElementById("acc-personal")!;

        // First click — expand
        await act(async () => {
            fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
            fireEvent.pointerUp(el, { clientX: 100, clientY: 100 });
            await new Promise((r) => setTimeout(r, 100));
        });
        expect(el.getAttribute("aria-expanded")).toBe("true");

        // Second click — collapse
        await act(async () => {
            fireEvent.pointerDown(el, { clientX: 100, clientY: 100 });
            fireEvent.pointerUp(el, { clientX: 100, clientY: 100 });
            await new Promise((r) => setTimeout(r, 100));
        });
        expect(el.getAttribute("aria-expanded")).toBe("false");
    });

    it("click on a DIFFERENT header: focuses AND expands it", async () => {
        render(
            <>
                <KeyboardListener />
                <PointerListener />
                <AccordionPattern />
            </>,
        );

        const personal = document.getElementById("acc-personal")!;
        const billing = document.getElementById("acc-billing")!;

        // Click personal first
        await act(async () => {
            fireEvent.pointerDown(personal, { clientX: 100, clientY: 100 });
            fireEvent.pointerUp(personal, { clientX: 100, clientY: 100 });
            await new Promise((r) => setTimeout(r, 100));
        });
        expect(personal.getAttribute("aria-expanded")).toBe("true");

        // Now click billing (NEW, unfocused header) — should ALSO expand
        await act(async () => {
            fireEvent.pointerDown(billing, { clientX: 200, clientY: 200 });
            fireEvent.pointerUp(billing, { clientX: 200, clientY: 200 });
            await new Promise((r) => setTimeout(r, 100));
        });

        expect(billing.getAttribute("data-focused")).toBe("true");
        // THIS is the key test: does clicking a NEW header expand it?
        expect(billing.getAttribute("aria-expanded")).toBe("true");
    });

    // ═══════════════════════════════════════════════════
    // Arrow navigation
    // ═══════════════════════════════════════════════════

    it("ArrowDown moves focus to next header without expanding", async () => {
        const user = userEvent.setup();

        render(
            <>
                <KeyboardListener />
                <AccordionPattern />
            </>,
        );

        const personal = document.getElementById("acc-personal")!;
        const billing = document.getElementById("acc-billing")!;

        personal.focus();
        os.dispatch(OS_FOCUS({ zoneId: "apg-accordion", itemId: "acc-personal" }));
        await new Promise((r) => setTimeout(r, 50));

        await user.keyboard("{ArrowDown}");
        await new Promise((r) => setTimeout(r, 100));

        // Focus moved
        expect(billing.getAttribute("data-focused")).toBe("true");
        // Should NOT have expanded personal
        expect(personal.getAttribute("aria-expanded")).toBe("false");
        // Should NOT have expanded billing
        expect(billing.getAttribute("aria-expanded")).toBe("false");
    });
});
