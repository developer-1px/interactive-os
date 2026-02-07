export interface KeyModifiers {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export interface Expectations {
    focused(): Promise<void>;
    toHaveAttr(attr: string, value: string): Promise<void>;
    toNotHaveAttr(attr: string, value: string): Promise<void>;
    toExist(): Promise<void>;
    toNotExist(): Promise<void>;
}

export interface TestActions {
    click(selector: string): Promise<void>;
    press(key: string, modifiers?: KeyModifiers): Promise<void>;
    wait(ms: number): Promise<void>;
    /** Find element by verify visible text. Returns a unique selector for the element. */
    getByText(text: string): Promise<string>;

    /** Find element by ARIA role and optional name. Returns a unique selector. */
    getByRole(role: string, name?: string): Promise<string>;

    expect(selector: string): Expectations;
}
