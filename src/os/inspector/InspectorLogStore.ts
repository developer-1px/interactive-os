/**
 * InspectorLogStore - Transaction-based Event Stream
 *
 * 하나의 입력 = 하나의 Transaction = 하나의 스냅샷.
 * 시간여행 디버깅과 LLM 분석을 위한 구조.
 */

import type { Transaction } from "@os/schema";
import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════

interface TransactionLogState {
  /** 시간순 (oldest → newest) */
  transactions: Transaction[];
  nextId: number;
  pageNumber: number;

  /** 새 트랜잭션 추가 시 증가 — EventStream auto-scroll trigger */
  scrollTrigger: number;

  // Actions
  add: (txn: Omit<Transaction, "id" | "timestamp">) => void;
  clear: () => void;
}

const MAX_TRANSACTIONS = 200;
const PAGE_SIZE = 100;

export const useTransactionLogStore = create<TransactionLogState>((set) => ({
  transactions: [],
  nextId: 1,
  pageNumber: 1,
  scrollTrigger: 0,

  add: (txn) =>
    set((state) => {
      const newTxn: Transaction = {
        ...txn,
        id: state.nextId,
        timestamp: Date.now(),
      };

      let transactions = [...state.transactions, newTxn];
      let pageNumber = state.pageNumber;

      // Page rotation: when exceeding PAGE_SIZE, start new page
      if (transactions.length > MAX_TRANSACTIONS) {
        transactions = transactions.slice(-PAGE_SIZE);
        pageNumber++;
      }

      return {
        transactions,
        nextId: state.nextId + 1,
        pageNumber,
        scrollTrigger: state.scrollTrigger + 1,
      };
    }),

  clear: () =>
    set({
      transactions: [],
      nextId: 1,
      pageNumber: 1,
      scrollTrigger: 0,
    }),
}));

// ═══════════════════════════════════════════════════════════════════
// Static API — 비-React 컨텍스트에서 사용
// ═══════════════════════════════════════════════════════════════════

export const TransactionLog = {
  add: (txn: Omit<Transaction, "id" | "timestamp">) =>
    useTransactionLogStore.getState().add(txn),
  clear: () => useTransactionLogStore.getState().clear(),
  getAll: () => useTransactionLogStore.getState().transactions,
};

// ═══════════════════════════════════════════════════════════════════
// Legacy Compat — 기존 InspectorLog.log() 호출자를 위한 no-op
// 완전 마이그레이션 후 제거
// ═══════════════════════════════════════════════════════════════════

/** @deprecated Use TransactionLog.add() instead */
export type LogType = "INPUT" | "COMMAND" | "STATE" | "EFFECT";

/** @deprecated Use Transaction instead */
export interface LogEntry {
  id: number;
  type: LogType;
  title: string;
  details?: any;
  timestamp: number;
  icon?: string;
  inputSource?: "keyboard" | "mouse";
  source?: string;
}

/** @deprecated — Individual log calls will be removed. Use TransactionLog. */
export const InspectorLog = {
  log: (_entry: Omit<LogEntry, "id" | "timestamp">) => {
    // no-op: individual logs are replaced by transactions
  },
  clear: () => TransactionLog.clear(),
};

/** @deprecated Use useTransactionLogStore instead */
export const useInspectorLogStore = {
  getState: () => ({
    logs: [] as LogEntry[],
    clear: TransactionLog.clear,
    addLog: (_entry: any) => {},
  }),
};
