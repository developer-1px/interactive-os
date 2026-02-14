/**
 * defineApp v5 — PoC for finalized entity model
 *
 * Entity Tree:
 *   App (= parent Scope)
 *     ├── State
 *     ├── Selector[]       (state → T)
 *     ├── Condition[]      (state → boolean, branded)
 *     ├── Command[]        (type + handler + when?)
 *     └── Zone[]           (= child Scope)
 *           ├── role
 *           ├── Commands[]  (zone-scoped)
 *           ├── Keybinding[] (key → command, when?)
 *           ├── Bindings    (event → command)
 *           └── UI          (Zone, Item, Field components)
 *
 * Key decisions (W1-W29):
 *   - App owns Commands. Zone is a child scope. Kernel bubbles.
 *   - when = dispatch guard (kernel blocks). NOT routing-only.
 *   - Condition = named boolean predicate. Separate from Selector.
 *   - No combinators (not/and). All conditions are named selectors.
 *   - Boilerplate cost = 0 (LLM writes code). Optimize for observability.
 */

// ═══════════════════════════════════════════════════════════════════
// Branded types
// ═══════════════════════════════════════════════════════════════════

const __commandBrand = Symbol("command");
const __conditionBrand = Symbol("condition");
const __selectorBrand = Symbol("selector");

/** Branded command object */
type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly [__commandBrand]: true;
};

/** Factory that creates typed commands */
type CommandFactory<Type extends string = string, Payload = void> = {
  (
    ...args: [Payload] extends [undefined]
      ? []
      : undefined extends Payload
        ? [payload?: Payload]
        : [payload: Payload]
  ): Command<Type, Payload>;
  readonly commandType: Type;
};

/** Branded Condition — named boolean predicate */
type Condition<S> = {
  readonly name: string;
  readonly evaluate: (state: S) => boolean;
  readonly [__conditionBrand]: true;
};

/** Branded Selector — named data derivation */
type Selector<S, T> = {
  readonly name: string;
  readonly select: (state: S) => T;
  readonly [__selectorBrand]: true;
};

// ═══════════════════════════════════════════════════════════════════
// Handler types
// ═══════════════════════════════════════════════════════════════════

type CommandContext<S> = { readonly state: S };

type HandlerResult<S> = {
  state: S;
  dispatch?: Command | Command[];
} | void;

type FlatHandler<S, P> = (
  ctx: CommandContext<S>,
  payload: P,
) => HandlerResult<S>;

// ═══════════════════════════════════════════════════════════════════
// Zone bindings & keybindings
// ═══════════════════════════════════════════════════════════════════

interface ZoneBindings {
  role: string;
  onCheck?: CommandFactory<any, any>;
  onAction?: CommandFactory<any, any>;
  onDelete?: CommandFactory<any, any>;
  onCopy?: CommandFactory<any, any>;
  onCut?: CommandFactory<any, any>;
  onPaste?: CommandFactory<any, any>;
  onMoveUp?: CommandFactory<any, any>;
  onMoveDown?: CommandFactory<any, any>;
  onUndo?: CommandFactory<any, any>;
  onRedo?: CommandFactory<any, any>;
}

interface FieldBindings {
  onChange?: CommandFactory<any, any>;
  onSubmit?: CommandFactory<any, any>;
  onCancel?: CommandFactory<any, any>;
}

interface KeybindingEntry<S> {
  key: string;
  command: CommandFactory<any, any>;
  when?: Condition<S>;
}

// ═══════════════════════════════════════════════════════════════════
// React component stubs
// ═══════════════════════════════════════════════════════════════════

type FC<P = object> = (props: P) => any;

interface BoundComponents<S> {
  Zone: FC<{ id?: string; className?: string; children?: any }>;
  Item: FC<{ id: string; className?: string; children?: any }>;
  Field: FC<{ name: string; value?: string; className?: string }>;
  /** Declarative show/hide wrapper */
  When: FC<{ condition: Condition<S>; children?: any }>;
}

// ═══════════════════════════════════════════════════════════════════
// ZoneHandle — returned by createZone
// ═══════════════════════════════════════════════════════════════════

interface ZoneHandle<S> {
  /** Define a zone-scoped command */
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;

  /** Create a nested child-scoped Zone */
  createZone(name: string): ZoneHandle<S>;

  /** Bind commands to zone events + keybindings → returns React components */
  bind(
    config: ZoneBindings & {
      field?: FieldBindings;
      keybindings?: KeybindingEntry<S>[];
    },
  ): BoundComponents<S>;
}

// ═══════════════════════════════════════════════════════════════════
// TestInstance
// ═══════════════════════════════════════════════════════════════════

interface TestInstance<S> {
  readonly state: S;
  dispatch<T extends string, P>(command: Command<T, P>): boolean; // false if when blocked
  reset(): void;
  /** Evaluate a condition against current state */
  evaluate(condition: Condition<S>): boolean;
  /** Read a selector against current state */
  select<T>(selector: Selector<S, T>): T;
}

// ═══════════════════════════════════════════════════════════════════
// AppHandle — returned by defineApp
// ═══════════════════════════════════════════════════════════════════

interface AppHandle<S> {
  /** Define a named boolean condition (for when guards) */
  condition(name: string, predicate: (state: S) => boolean): Condition<S>;

  /** Define a named selector (for data derivation) */
  selector<T>(name: string, select: (state: S) => T): Selector<S, T>;

  /** Define an app-scoped command (e.g., UNDO, REDO) */
  command<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    options?: { when?: Condition<S> },
  ): CommandFactory<T, P>;

  /** Create a child-scoped Zone */
  createZone(name: string): ZoneHandle<S>;

  /** React hook — re-renders on selector change */
  useComputed<T>(selector: Selector<S, T>): T;

  /** React hook — re-renders on condition change */
  useCondition(condition: Condition<S>): boolean;

  /** Read current state (infra/DevTools only — app code should use selectors) */
  getState(): S;

  /** Create isolated test instance */
  create(overrides?: Partial<S>): TestInstance<S>;

  /** List all registered conditions (for DevTools) */
  conditions(): readonly Condition<S>[];

  /** List all registered selectors (for DevTools) */
  selectors(): readonly Selector<S, unknown>[];
}

// ═══════════════════════════════════════════════════════════════════
// defineApp — implementation
// ═══════════════════════════════════════════════════════════════════

export function defineApp<S>(
  appId: string,
  initialState: S,
  options?: {
    history?: boolean;
    persistence?: { key: string; debounceMs?: number };
  },
): AppHandle<S> {
  const currentState = { ...initialState };

  // Registries
  const conditionRegistry: Condition<S>[] = [];
  const conditionNames = new Set<string>();
  const selectorRegistry: Selector<S, unknown>[] = [];
  const selectorNames = new Set<string>();
  const handlerRegistry = new Map<
    string,
    { handler: FlatHandler<S, any>; when?: Condition<S> }
  >();

  // ── condition ──

  function defineCondition(
    name: string,
    predicate: (state: S) => boolean,
  ): Condition<S> {
    if (conditionNames.has(name)) {
      throw new Error(
        `[defineApp:${appId}] Condition "${name}" already defined`,
      );
    }
    conditionNames.add(name);
    const cond = {
      name,
      evaluate: predicate,
      [__conditionBrand]: true as const,
    } as unknown as Condition<S>;
    conditionRegistry.push(cond);
    return cond;
  }

  // ── selector ──

  function defineSelector<T>(
    name: string,
    select: (state: S) => T,
  ): Selector<S, T> {
    if (selectorNames.has(name)) {
      throw new Error(
        `[defineApp:${appId}] Selector "${name}" already defined`,
      );
    }
    selectorNames.add(name);
    const sel = {
      name,
      select,
      [__selectorBrand]: true as const,
    } as unknown as Selector<S, T>;
    selectorRegistry.push(sel as Selector<S, unknown>);
    return sel;
  }

  // ── command (shared logic for app + zone) ──

  function defineCommand<T extends string, P = void>(
    type: T,
    handler: FlatHandler<S, P>,
    opts?: { when?: Condition<S> },
  ): CommandFactory<T, P> {
    handlerRegistry.set(type, { handler, when: opts?.when });

    const factory = ((...args: any[]) => ({
      type,
      payload: args[0],
      [__commandBrand]: true,
    })) as unknown as CommandFactory<T, P>;

    Object.defineProperty(factory, "commandType", {
      value: type,
      enumerable: true,
    });
    return factory;
  }

  // ── createZone ──

  function createZone(_name: string): ZoneHandle<S> {
    // Production: kernel.group({ scope: defineScope(`${appId}:${_name}`) })

    const zone: ZoneHandle<S> = {
      command<T extends string, P = void>(
        type: T,
        handler: FlatHandler<S, P>,
        opts?: { when?: Condition<S> },
      ): CommandFactory<T, P> {
        return defineCommand(type, handler, opts);
      },

      createZone(childName: string): ZoneHandle<S> {
        return createZone(`${_name}:${childName}`);
      },

      bind(
        _config: ZoneBindings & {
          field?: FieldBindings;
          keybindings?: KeybindingEntry<S>[];
        },
      ): BoundComponents<S> {
        return {
          Zone: (_props: any) => null,
          Item: (_props: any) => null,
          Field: (_props: any) => null,
          When: (_props: any) => null,
        };
      },
    };

    return zone;
  }

  // ── create (test instance) ──

  function create(overrides?: Partial<S>): TestInstance<S> {
    let testState = overrides
      ? { ...initialState, ...overrides }
      : { ...initialState };

    return {
      get state() {
        return testState;
      },

      dispatch<T extends string, P>(command: Command<T, P>): boolean {
        const entry = handlerRegistry.get(command.type);
        if (!entry) return false;

        // when guard — dispatch guard (kernel level)
        if (entry.when && !entry.when.evaluate(testState)) {
          return false;
        }

        const result = entry.handler({ state: testState }, command.payload);
        if (result?.state) {
          testState = result.state;
        }

        // dispatch chain — process chained commands
        if (result?.dispatch) {
          const cmds = Array.isArray(result.dispatch)
            ? result.dispatch
            : [result.dispatch];
          for (const cmd of cmds) {
            this.dispatch(cmd);
          }
        }

        return true;
      },

      reset() {
        testState = overrides
          ? { ...initialState, ...overrides }
          : { ...initialState };
      },

      evaluate(condition: Condition<S>): boolean {
        return condition.evaluate(testState);
      },

      select<T>(selector: Selector<S, T>): T {
        return selector.select(testState);
      },
    };
  }

  return {
    condition: defineCondition,
    selector: defineSelector,
    command: defineCommand,
    createZone,

    useComputed<T>(selector: Selector<S, T>): T {
      return selector.select(currentState);
    },

    useCondition(condition: Condition<S>): boolean {
      return condition.evaluate(currentState);
    },

    getState(): S {
      return currentState;
    },

    create,

    conditions() {
      return conditionRegistry;
    },

    selectors() {
      return selectorRegistry;
    },
  };
}
