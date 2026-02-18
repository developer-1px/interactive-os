/**
 * OS Sentinel Constants — Magic payload values for zone bindings.
 *
 * When a command payload contains OS_FOCUS, the OS runtime replaces it
 * with the currently focused item's ID at dispatch time.
 */

export const OS_FOCUS = "OS.FOCUS" as const;
export const OS_SELECTION = "OS.SELECTION" as const;
