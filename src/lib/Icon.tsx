/**
 * Centralized Icon Component
 * 
 * Usage: <Icon name="folder" size={16} />
 * 
 * This component provides a unified interface for using Lucide icons,
 * eliminating naming conflicts from direct imports.
 */

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
    // File/Folder icons
    Folder,
    FolderOpen,
    File,
    FileText,
    FileCode,
    FileCog,
    FileImage,

    // Navigation
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ArrowRight,
    ArrowLeft,
    ArrowUp,
    ArrowDown,

    // Actions
    Plus,
    Minus,
    X,
    Check,
    Trash2,
    Pencil,
    Copy,
    Clipboard,

    // UI
    Search,
    Settings,
    Menu,
    MoreHorizontal,
    MoreVertical,
    Grip,
    GripVertical,

    // Media
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX,

    // Status
    AlertCircle,
    AlertTriangle,
    Info,
    HelpCircle,
    CheckCircle,
    XCircle,
    Loader2,

    // Common
    User,
    Users,
    Mail,
    Calendar,
    Clock,
    Star,
    Heart,
    Bookmark,
    Tag,
    Link,
    ExternalLink,

    // Layout
    Home,
    List,
    Grid,
    Columns,
    Rows,
    LayoutGrid,
    LayoutList,

    // Editing
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,

    // Misc
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Zap,
    Wand2,
    BarChart3,
    Database,
    Server,
    Box,
    Layers,
    Globe,
    Brain,
    Cpu,
    Monitor,
    Smartphone,
    MousePointer2,
    Hand,
    Square,
    Undo2,
    Redo2,
    CornerDownLeft,

    type LucideIcon,
} from "lucide-react";

/**
 * Icon name registry
 * Add new icons here as needed
 */
const icons = {
    // File/Folder
    folder: Folder,
    "folder-open": FolderOpen,
    file: File,
    "file-text": FileText,
    "file-code": FileCode,
    "file-cog": FileCog,
    "file-image": FileImage,

    // Navigation
    "chevron-right": ChevronRight,
    "chevron-down": ChevronDown,
    "chevron-up": ChevronUp,
    "chevron-left": ChevronLeft,
    "arrow-right": ArrowRight,
    "arrow-left": ArrowLeft,
    "arrow-up": ArrowUp,
    "arrow-down": ArrowDown,

    // Actions
    plus: Plus,
    minus: Minus,
    x: X,
    check: Check,
    trash: Trash2,
    pencil: Pencil,
    copy: Copy,
    clipboard: Clipboard,

    // UI
    search: Search,
    settings: Settings,
    menu: Menu,
    "more-horizontal": MoreHorizontal,
    "more-vertical": MoreVertical,
    grip: Grip,
    "grip-vertical": GripVertical,

    // Media
    play: Play,
    pause: Pause,
    "skip-forward": SkipForward,
    "skip-back": SkipBack,
    volume: Volume2,
    "volume-muted": VolumeX,

    // Status
    "alert-circle": AlertCircle,
    "alert-triangle": AlertTriangle,
    info: Info,
    help: HelpCircle,
    "check-circle": CheckCircle,
    "x-circle": XCircle,
    loader: Loader2,

    // Common
    user: User,
    users: Users,
    mail: Mail,
    calendar: Calendar,
    clock: Clock,
    star: Star,
    heart: Heart,
    bookmark: Bookmark,
    tag: Tag,
    link: Link,
    "external-link": ExternalLink,

    // Layout
    home: Home,
    list: List,
    grid: Grid,
    columns: Columns,
    rows: Rows,
    "layout-grid": LayoutGrid,
    "layout-list": LayoutList,

    // Editing
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strikethrough: Strikethrough,
    "align-left": AlignLeft,
    "align-center": AlignCenter,
    "align-right": AlignRight,
    "align-justify": AlignJustify,

    // Misc
    eye: Eye,
    "eye-off": EyeOff,
    lock: Lock,
    unlock: Unlock,
    zap: Zap,
    wand: Wand2,
    "bar-chart": BarChart3,
    database: Database,
    server: Server,
    box: Box,
    layers: Layers,
    globe: Globe,
    brain: Brain,
    cpu: Cpu,
    monitor: Monitor,
    smartphone: Smartphone,
    cursor: MousePointer2,
    hand: Hand,
    square: Square,
    undo: Undo2,
    redo: Redo2,
    enter: CornerDownLeft,
} as const;

export type IconName = keyof typeof icons;

export interface IconProps extends Omit<ComponentPropsWithoutRef<"svg">, "ref"> {
    /** Icon name from the registry */
    name: IconName;
    /** Icon size in pixels (default: 16) */
    size?: number;
    /** Stroke width (default: 2) */
    strokeWidth?: number;
}

/**
 * Centralized Icon component that renders Lucide icons by name.
 * Avoids import naming conflicts by providing a unified interface.
 * 
 * @example
 * <Icon name="folder" size={16} />
 * <Icon name="file-text" size={20} className="text-gray-500" />
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ name, size = 16, strokeWidth = 2, className, ...props }, ref) => {
        const IconComponent = icons[name] as LucideIcon;

        if (!IconComponent) {
            console.warn(`Icon "${name}" not found in registry`);
            return null;
        }

        return (
            <IconComponent
                ref={ref}
                size={size}
                strokeWidth={strokeWidth}
                className={className}
                {...props}
            />
        );
    }
);

Icon.displayName = "Icon";

export default Icon;
