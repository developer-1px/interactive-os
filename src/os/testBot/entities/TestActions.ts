export interface KeyModifiers {
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  meta?: boolean;
}

/** Semantic query for element lookup */
export interface ElementQuery {
  text?: string;
  role?: string;
  name?: string;
}

/** Target can be a CSS selector string or a semantic query object */
export type Selector = string | ElementQuery;

export interface Expectations {
  focused(): Promise<void>;
  toHaveAttr(attr: string, value: string): Promise<void>;
  toNotHaveAttr(attr: string, value: string): Promise<void>;
  toExist(): Promise<void>;
  toNotExist(): Promise<void>;
  toHaveValue(value: string): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toBeVisible(): Promise<void>;
  toBeDisabled(): Promise<void>;
  toHaveCount(n: number): Promise<void>;
}

export interface TestActions {
  /** Click an element by CSS selector or semantic query */
  click(target: Selector): Promise<void>;
  press(key: string, modifiers?: KeyModifiers): Promise<void>;
  /** Type text character-by-character into the focused element */
  type(text: string): Promise<void>;
  wait(ms: number): Promise<void>;
  /** Find element by visible text content. Returns a unique CSS selector. */
  getByText(text: string): Promise<string>;
  /** Find element by ARIA role (supports implicit roles). Returns a unique CSS selector. */
  getByRole(role: string, name?: string): Promise<string>;
  /** Find all elements matching text. Returns array of CSS selectors. */
  getAllByText(text: string): Promise<string[]>;

  expect(selector: string): Expectations;
}
