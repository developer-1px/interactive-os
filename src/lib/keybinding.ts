
export interface KeybindingItem {
    key: string;
    command: string;
    args?: any;
    when?: string;
    preventDefault?: boolean;
    allowInInput?: boolean;
}


