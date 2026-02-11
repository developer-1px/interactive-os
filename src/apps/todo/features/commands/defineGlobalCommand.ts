/**
 * Todo Command Helpers — re-export todoSlice.group.defineCommand
 * for convenient command definition.
 */
import { todoSlice } from "@apps/todo/app";

export const { group: todoGroup } = todoSlice;
