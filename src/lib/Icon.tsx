/**
 * Centralized Icon Component
 *
 * Usage: <Icon name="folder" size={16} />
 *
 * This component provides a unified interface for using Lucide icons,
 * eliminating naming conflicts from direct imports.
 */

import {
  Activity,
  // Status
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  // Editing
  Bold,
  Bookmark,
  Box,
  Brain,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  // Navigation
  ChevronRight,
  ChevronUp,
  Clipboard,
  Clock,
  Columns,
  Copy,
  CornerDownLeft,
  Cpu,
  Database,
  ExternalLink,
  // Misc
  Eye,
  EyeOff,
  File,
  FileCode,
  FileCog,
  FileImage,
  FileText,
  // File/Folder icons
  Folder,
  FolderOpen,
  Globe,
  Grid,
  Grip,
  GripVertical,
  Hand,
  Heart,
  HelpCircle,
  // Layout
  Home,
  Info,
  Italic,
  Keyboard,
  Layers,
  LayoutGrid,
  LayoutList,
  Link,
  List,
  Loader2,
  Lock,
  type LucideIcon,
  Mail,
  Menu,
  Minus,
  Monitor,
  MoreHorizontal,
  MoreVertical,
  MousePointer2,
  Pause,
  Pencil,
  // Media
  Play,
  // Actions
  Plus,
  Redo2,
  Rows,
  // UI
  Search,
  Server,
  Settings,
  SkipBack,
  SkipForward,
  Smartphone,
  Square,
  Star,
  Strikethrough,
  Tag,
  Terminal,
  Trash2,
  Underline,
  Undo2,
  Unlock,
  // Common
  User,
  Users,
  Volume2,
  VolumeX,
  Wand2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

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
  monitor: Monitor,
  smartphone: Smartphone,
  cursor: MousePointer2,
  hand: Hand,
  square: Square,
  undo: Undo2,
  redo: Redo2,
  enter: CornerDownLeft,
  keyboard: Keyboard,
  terminal: Terminal,
  cpu: Cpu,
  activity: Activity,
} as const;

export type IconName = keyof typeof icons;

export interface IconProps
  extends Omit<ComponentPropsWithoutRef<"svg">, "ref"> {
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
  },
);

Icon.displayName = "Icon";

export default Icon;
