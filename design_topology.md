# Design: Generic Zone Topology

> [!NOTE]
> **Goal**: Remove hardcoded "Left/Right" logic from Middleware. Make Zone Navigation generic.

## 1. The Concept: `TopologyRegistry`
Just like `focusRegistry` resolves "Item ID inside Zone", `topologyRegistry` resolves "Neighbor Zone ID".

### Type Definition
```typescript
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface ZoneTopology {
  // Static Neighbors
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  
  // Dynamic Resolution (Optional)
  resolve?: (dir: Direction, state: AppState) => string | null;
}
```

## 2. Implementation Plan

### A. Create `src/lib/logic/topology.ts`
```typescript
class TopologyRegistry {
  private topology: Record<string, ZoneTopology> = {};
  
  register(zoneId: string, config: ZoneTopology) {
    this.topology[zoneId] = config;
  }
  
  getNeighbor(currentZone: string, dir: Direction, state: AppState): string | null {
    const config = this.topology[currentZone];
    if (!config) {
       // Check for dynamic wildcard handlers (e.g. board_col_*)?
       // For now, let's keep the user's hardcoded logic but encapsulated in a custom Resolver strategy.
       return null;
    }
    
    // 1. Dynamic Resolver (Priority)
    if (config.resolve) {
      const result = config.resolve(dir, state);
      if (result) return result;
    }
    
    // 2. Static Map
    return config[dir.toLowerCase()] || null;
  }
}
export const topologyRegistry = new TopologyRegistry();
```

### B. Register Topologies in `todoEngine.tsx`
```typescript
topologyRegistry.register("sidebar", {
  right: "listView" // Default
});

// Dynamic Topology for Board Columns is tricky because they are dynamic IDs.
// We need a "Pattern Matcher" or the resolve function handles it.
```

### C. Regex / Dynamic Zone Registration
Since `board_col_${id}` is dynamic, we can't register every single one easily.
**Better Approach**: The `resolve` function in a "Global Topology" or a fallback?

Or, we register a **"Board Topology Strategy"**?
Actually, `boardView` is a View Mode, but the Zones are `board_col_X`.

**Refined Strategy**:
Let's keep it simple. We register a generic `resolve` function for the app that handles the specific topology rules. Use `topologyRegistry.setGlobalResolver(fn)`.

```typescript
// In todoTopology.ts
export const todoTopologyResolver = (currentZone: string, dir: Direction, state: AppState) => {
   // 1. Board Logic
   if (currentZone.startsWith("board_col_")) {
       // ... existing Logic ...
   }
   
   // 2. Sidebar Logic
   if (currentZone === "sidebar" && dir === "RIGHT") {
       return state.ui.viewMode === "board" 
         ? `board_col_${state.data.categoryOrder[0]}` 
         : "listView";
   }
   
   return null;
}
```

## 3. Middleware Update
Refactor `navigationMiddleware.ts` to call:
```typescript
const nextZone = topologyRegistry.getNeighbor(activeZoneId, effect.direction, rawNewState);
```
