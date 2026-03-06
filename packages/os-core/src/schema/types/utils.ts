/**
 * Shared utility types for os-core schema.
 */

/** Recursively make all properties optional */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
