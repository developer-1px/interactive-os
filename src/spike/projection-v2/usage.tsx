/**
 * Projection Next API v2 — Usage Verification
 *
 * 이 파일이 tsc를 통과하면, 합의된 API가 TypeScript에서 실현 가능함을 증명한다.
 * 런타임 실행은 필요 없다 — 타입 레벨 검증만이 목적.
 *
 * Source: /discussion 합의 + docs/0-inbox/38-[explain]projection-next-api-v2.md
 */

import type { ReactNode } from "react";
import { createStubApp } from "./stub";

// ═══════════════════════════════════════════════════════════════
// 1. Entity interface — SSOT
// ═══════════════════════════════════════════════════════════════

interface Todo {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
  readonly dueDate: string;
}

interface FileNode {
  readonly id: string;
  readonly name: string;
  readonly size: string;
  readonly modified: string;
}

// ═══════════════════════════════════════════════════════════════
// 2. App + Command 선언
// ═══════════════════════════════════════════════════════════════

interface TodoState {
  todos: Record<string, Todo>;
  todoOrder: string[];
}

const TodoApp = createStubApp<TodoState>("todo", {
  todos: {},
  todoOrder: [],
});

const deleteTodo = TodoApp.command("deleteTodo", (state, _id) => state);
const toggleTodo = TodoApp.command("toggleTodo", (state, _id) => state);

// ═══════════════════════════════════════════════════════════════
// 3. createZone 선언
// ═══════════════════════════════════════════════════════════════

const TodoList = TodoApp.createZone("list", {
  role: "listbox",
  entity: undefined as unknown as Todo, // phantom type marker
  commands: { deleteTodo, toggleTodo },
});

// ═══════════════════════════════════════════════════════════════
// 4. Usage — TodoList (Listbox, flat)
// ═══════════════════════════════════════════════════════════════

function TodoListView(): ReactNode {
  return (
    <ul className="divide-y max-w-md">
      <TodoList.Zone>
        {(zone) => (
          <zone.Items>
            {(item) => (
              <li className="flex items-center gap-2 p-3">
                {/* ✅ item.fieldName = 데이터 (entity에서 추론) */}
                {/* item.text: string ✓ */}
                {/* item.completed: boolean ✓ */}
                {/* item.dueDate: string ✓ */}

                {/* ✅ item.Field.fieldName = asChild wrapper */}
                <item.Field.completed>
                  <input type="checkbox" checked={item.completed} readOnly />
                </item.Field.completed>

                <item.Field.text>
                  <span className="flex-1">{item.text}</span>
                </item.Field.text>

                {/* ✅ 읽기 전용 — 순수 데이터, wrapper 불필요 */}
                <span className="text-sm text-gray-400">{item.dueDate}</span>

                {/* ✅ zone.Trigger — cmd는 등록된 commands만 */}
                <zone.Trigger onPress={(cmd) => cmd.toggleTodo(item.id)}>
                  <button type="button">✓</button>
                </zone.Trigger>

                <zone.Trigger onPress={(cmd) => cmd.deleteTodo(item.id)}>
                  <button type="button" className="text-red-500">
                    ×
                  </button>
                </zone.Trigger>
              </li>
            )}
          </zone.Items>
        )}
      </TodoList.Zone>
    </ul>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. Usage — FileTree (Treegrid, nested + recursive)
// ═══════════════════════════════════════════════════════════════

const FileApp = createStubApp<{ files: Record<string, FileNode> }>("files", {
  files: {},
});

const deleteFile = FileApp.command("deleteFile", (state, _id) => state);
const renameFile = FileApp.command("renameFile", (state, _id) => state);

const FileTree = FileApp.createZone("files", {
  role: "treegrid",
  entity: undefined as unknown as FileNode, // phantom type marker
  commands: { deleteFile, renameFile },
});

function FileTreeView(): ReactNode {
  return (
    <div className="file-tree">
      <FileTree.Zone>
        {(zone) => (
          <zone.Items>
            {(item) => (
              <div className="flex items-center gap-2">
                {/* ✅ item.fieldName = 데이터 */}
                <span>{item.name}</span>
                <span className="text-sm">{item.size}</span>
                <span className="text-xs text-gray-400">{item.modified}</span>

                {/* ✅ zone.Trigger — cmd에 deleteFile, renameFile만 */}
                <zone.Trigger onPress={(cmd) => cmd.deleteFile(item.id)}>
                  <button type="button">×</button>
                </zone.Trigger>

                <zone.Trigger onPress={(cmd) => cmd.renameFile(item.id)}>
                  <button type="button">✎</button>
                </zone.Trigger>

                {/* ✅ item.Children — 재귀, 같은 item 타입 */}
                <item.Children>
                  {(child) => (
                    <div className="pl-4 flex items-center gap-2">
                      {/* child.name: string ✓ (같은 FileNode 타입) */}
                      <span>{child.name}</span>
                      <span className="text-sm">{child.size}</span>

                      <zone.Trigger onPress={(cmd) => cmd.deleteFile(child.id)}>
                        <button type="button">×</button>
                      </zone.Trigger>

                      {/* ✅ 재귀 가능 — child.Children 동일 시그니처 */}
                      <child.Children>
                        {(grandchild) => (
                          <div className="pl-8">
                            <span>{grandchild.name}</span>
                          </div>
                        )}
                      </child.Children>
                    </div>
                  )}
                </item.Children>
              </div>
            )}
          </zone.Items>
        )}
      </FileTree.Zone>
    </div>
  );
}

// Prevent tree-shaking
export { TodoListView, FileTreeView };
