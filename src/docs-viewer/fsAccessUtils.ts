import { buildDocTree, type DocItem, flattenTree } from "./docsUtils";

// ─── File System Access API (experimental, Chrome/Edge only) ───
declare global {
    interface Window {
        showDirectoryPicker?(options?: {
            mode?: "read" | "readwrite";
        }): Promise<FileSystemDirectoryHandle>;
    }
}

/**
 * Read all .md files recursively from a FileSystemDirectoryHandle.
 * Returns a map of { relativePath (without .md) → content }.
 */
async function readMdFiles(
    dirHandle: FileSystemDirectoryHandle,
    prefix = "",
): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for await (const [name, handle] of dirHandle.entries()) {
        const path = prefix ? `${prefix}/${name}` : name;

        if (handle.kind === "directory") {
            const subResults = await readMdFiles(
                handle as FileSystemDirectoryHandle,
                path,
            );
            for (const [k, v] of subResults) {
                results.set(k, v);
            }
        } else if (handle.kind === "file" && name.endsWith(".md")) {
            const file = await (handle as FileSystemFileHandle).getFile();
            const text = await file.text();
            const pathWithoutExt = path.replace(/\.md$/, "");
            results.set(pathWithoutExt, text);
        }
    }

    return results;
}

/** Result of opening an external folder */
export interface ExternalFolderSource {
    name: string;
    files: Map<string, string>;
    tree: DocItem[];
    allFiles: DocItem[];
}

/**
 * Open a directory picker dialog and read all .md files.
 * Returns null if the user cancels.
 */
export async function openExternalFolder(): Promise<ExternalFolderSource | null> {
    // Check API support
    if (!("showDirectoryPicker" in window)) {
        alert(
            "이 브라우저는 File System Access API를 지원하지 않습니다.\nChrome 또는 Edge를 사용해주세요.",
        );
        return null;
    }

    try {
        const dirHandle = await window.showDirectoryPicker!({
            mode: "read",
        });

        const files = await readMdFiles(dirHandle);

        if (files.size === 0) {
            alert("선택한 폴더에 .md 파일이 없습니다.");
            return null;
        }

        // Build tree from file paths (reuse existing buildDocTree)
        // We need to transform paths to look like the glob format buildDocTree expects
        const fakePaths = Array.from(files.keys()).map((p) => `../../ext/${p}.md`);
        const tree = buildDocTree(fakePaths, "../../ext/");
        const allFiles = flattenTree(tree);

        return {
            name: dirHandle.name,
            files,
            tree,
            allFiles,
        };
    } catch (err: unknown) {
        // User cancelled the picker
        if (err instanceof DOMException && err.name === "AbortError") {
            return null;
        }
        throw err;
    }
}
