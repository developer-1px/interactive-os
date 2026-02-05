# Focus Pipeline Invariants (불변의 법칙)

## Part 1: Browser Layer (불변)

### Event 순서
```
Keyboard:  keydown → keyup
Mouse:     pointerdown → focus → pointerup → click
Focus:     blur(old) → focusout(old) → focus(new) → focusin(new)
```

### Focus Model
```
document.activeElement = 항상 1개
tabIndex: >=0 (Tab 순서), -1 (Tab 불가, focus() 가능)
Arrow Keys: 브라우저 기본 동작 없음 (앱이 구현)
```

---

## Part 2: App Layer Pipeline (불변)

```
INTERCEPT → PARSE → RESOLVE → COMMIT → PROJECT
```

---

## Part 3: Phase & Spec Definition

```typescript
interface FocusGroupProps {
  // === Identity & Role ===
  id?: string;
  role?: string; // Preset used

  // === Phase 2: PARSE (Input Interpretation) ===
  parse?: {
    triggers: {
      select?: string[];    // e.g. ['Space']
      activate?: string[];  // e.g. ['Enter']
    };
  };

  // === Phase 3: RESOLVE (Logic Calculation) ===
  navigate?: {
    orientation: 'horizontal' | 'vertical' | 'both';
    loop: boolean;
    seamless: boolean;       // Cross-zone
    typeahead?: boolean | { debounceMs: number, matchMode: 'startswith' };
    entry?: 'first' | 'last' | 'restore' | 'selected';
    recovery?: 'next' | 'prev' | 'nearest';
    skipDisabled?: boolean;
    
    // Boundary Events
    onReachStart?: () => void;
    onReachEnd?: () => void;
  };

  tab?: {
    behavior: 'trap' | 'escape' | 'flow';
    restoreFocus: boolean;
  };

  select?: {
    mode: 'none' | 'single' | 'multiple';
    followFocus: boolean;          // Auto-select on focus
    disallowEmpty: boolean;        // Mandatory selection
    range: boolean;                // Shift+Click range
    toggle: boolean;               // Ctrl+Click toggle
    clickBehavior: 'replace' | 'toggle' | 'keep';
    allowDisabled: boolean;
  };

  activate?: {
    mode: 'manual' | 'automatic' | 'hover';
    delay?: number;
    dblClick?: boolean;
  };

  dismiss?: {
    escape: 'close' | 'deselect' | 'blur' | 'none';
    outsideClick: 'close' | 'deselect' | 'none';
  };

  // === Phase 5: PROJECT (Rendering & DOM) ===
  project?: {
    virtualFocus: boolean;        // aria-activedescendant
    selectedAttr: 'aria-selected' | 'aria-checked' | 'aria-pressed' | 'data-selected';
    autoFocus: boolean | number;  // Mount auto-focus
  };

  // === State Control (System ↔ App Bridge) ===
  state?: {
    value?: string | string[];             // Controlled Selection
    defaultValue?: string | string[];      // Uncontrolled Selection
    onValueChange?: (value: any) => void;
    
    focusedValue?: string;                 // Controlled Focus
    onFocusChange?: (value: string) => void;
  };
}
```

---

## Part 4: Role Presets (Configured per Pipeline Group)

```typescript
const PRESETS = {
  toolbar: { 
    navigate: { orientation: 'horizontal', loop: false },
    tab: { behavior: 'escape', restoreFocus: false },
    select: { mode: 'none' },
    activate: { mode: 'manual' }
  },
  
  menu: { 
    navigate: { orientation: 'vertical', loop: true, typeahead: true },
    tab: { behavior: 'escape' },
    select: { mode: 'none' },
    activate: { mode: 'manual' }
  },
  
  tablist: { 
    navigate: { orientation: 'horizontal', loop: true },
    tab: { behavior: 'escape', restoreFocus: true },
    select: { mode: 'single', followFocus: false },
    activate: { mode: 'manual' }
  },
  
  radiogroup: { 
    navigate: { orientation: 'vertical', loop: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single', followFocus: true, disallowEmpty: true },
    activate: { mode: 'automatic' }
  },
  
  listbox: { 
    navigate: { orientation: 'vertical', loop: false, typeahead: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single', range: true },
    activate: { mode: 'manual' }
  },
  
  grid: { 
    navigate: { orientation: 'both', loop: false, seamless: true },
    tab: { behavior: 'escape' },
    select: { mode: 'single' }
  },
};
```

---

*Reference: Focus Pipeline Invariants v1.3 (2026-02-05) - Pipeline Grouped Architecture*
