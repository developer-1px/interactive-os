/**
 * InspectorLogStore - Transaction-based Event Stream
 *
 * 하나의 입력 = 하나의 Transaction = 하나의 스냅샷.
 * 시간여행 디버깅과 LLM 분석을 위한 구조.
 */

import type { Transaction } from "@os/schema";
import { useSyncExternalStore } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface TransactionLogState {
  /** 시간순 (oldest → newest) */
  transactions: Transaction[];
  nextId: number;
  pageNumber: number;

  /** 새 트랜잭션 추가 시 증가 — EventStream auto-scroll trigger */
  scrollTrigger: number;
}

const MAX_TRANSACTIONS = 200;
const PAGE_SIZE = 100;

// ═══════════════════════════════════════════════════════════════════
// Vanilla Store
// ═══════════════════════════════════════════════════════════════════

let state: TransactionLogState = {
  transactions: [],
  nextId: 1,
  pageNumber: 1,
  scrollTrigger: 0,
};

const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot() {
  return state;
}

function add(txn: Omit<Transaction, "id" | "timestamp">) {
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

  state = {
    transactions,
    nextId: state.nextId + 1,
    pageNumber,
    scrollTrigger: state.scrollTrigger + 1,
  };
  emit();
}

function clear() {
  state = {
    transactions: [],
    nextId: 1,
    pageNumber: 1,
    scrollTrigger: 0,
  };
  emit();
}

// ═══════════════════════════════════════════════════════════════════
// React Hook
// ═══════════════════════════════════════════════════════════════════

export function useTransactionLogStore<T>(
  selector: (s: TransactionLogState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getSnapshot()),
  );
}

// ═══════════════════════════════════════════════════════════════════
// Static API — 비-React 컨텍스트에서 사용
// ═══════════════════════════════════════════════════════════════════

export const TransactionLog = {
  add: (txn: Omit<Transaction, "id" | "timestamp">) => add(txn),
  clear: () => clear(),
  getAll: () => getSnapshot().transactions,
};
