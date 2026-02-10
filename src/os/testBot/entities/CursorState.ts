import type { BubbleVariant } from "./BotCursor";

export interface CursorBubble {
  id: string;
  label: string;
  variant: BubbleVariant;
  createdAt: number;
}

export interface CursorRipple {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface CursorState {
  visible: boolean;
  x: number;
  y: number;
  transitionMs: number;
  offScreen: boolean;
  offScreenRotation: number;
  bubbles: CursorBubble[];
  ripples: CursorRipple[];
  trackedEl: Element | null;
}

export function createInitialCursorState(): CursorState {
  return {
    visible: false,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    transitionMs: 300,
    offScreen: false,
    offScreenRotation: 0,
    bubbles: [],
    ripples: [],
    trackedEl: null,
  };
}
