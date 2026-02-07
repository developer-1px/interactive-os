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
    expect(selector: string): Expectations;
}
