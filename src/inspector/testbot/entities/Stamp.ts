export interface Stamp {
  id: string;
  type: "pass" | "fail";
  el: Element; // Direct ref for fast getBoundingClientRect()
  selector: string; // Fallback if el detaches from DOM
  x: number;
  y: number;
  rotation: number; // Random tilt for natural stamp look
  createdAt: number;
}
