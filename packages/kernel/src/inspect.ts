/**
 * inspect — Transaction log, Inspector API, and state diff.
 *
 * Records every dispatch as a Transaction with scope information.
 * Provides time-travel and inspection capabilities.
 */
export type { StateDiff, Transaction } from "./core/transaction.ts";
export {
  clearTransactions,
  getLastTransaction,
  getTransactions,
  recordTransaction,
  travelTo,
} from "./core/transaction.ts";
