/**
 * Folder-level Dependency Analyzer
 *
 * Analyzes import statements across the project and produces a folder-granularity
 * dependency report showing:
 * - Cohesion: what % of imports are from within vs outside each folder
 * - Folder-to-folder dependency matrix (not file-to-file)
 * - Layer violations: imports that go "upward" in the numbered layers
 * - Cross-cutting concerns: folders imported by many other folders
 *
 * Usage: npx tsx scripts/analyze-deps.ts
 */

import * as fs from "node:fs"
import * as path from "node:path"

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname!, "..")
const SRC = path.join(ROOT, "src")
const KERNEL = path.join(ROOT, "packages/kernel/src")

/** Path alias resolution */
const ALIASES: Record<string, string> = {
    "@kernel": path.join(ROOT, "packages/kernel/src"),
    "@inspector": path.join(ROOT, "src/inspector"),
    "@os": path.join(ROOT, "src/os-new"),
    "@apps": path.join(ROOT, "src/apps"),
    "@": path.join(ROOT, "src"),
}

/** Depth of folder grouping relative to src/ */
const GROUP_DEPTH = 2

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportEdge {
    fromFile: string
    toSpecifier: string
    resolvedTo: string
}

interface FolderStats {
    folder: string
    totalImports: number
    internalImports: number // imports from within the same folder group
    externalImports: number
    cohesion: number // internal / total
    importsFrom: Map<string, number> // folder -> count
    importedBy: Set<string> // which folders import this one
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAllTsFiles(dir: string): string[] {
    const results: string[] = []
    if (!fs.existsSync(dir)) return results
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git") continue
            results.push(...getAllTsFiles(fullPath))
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
            results.push(fullPath)
        }
    }
    return results
}

const IMPORT_RE = /(?:import|export)\s+(?:(?:type\s+)?(?:\{[^}]*\}|[^;'"]*)\s+from\s+)?['"]([^'"]+)['"]/g

function extractImports(filePath: string): string[] {
    const content = fs.readFileSync(filePath, "utf8")
    const imports: string[] = []
    let match: RegExpExecArray | null
    while ((match = IMPORT_RE.exec(content)) !== null) {
        const specifier = match[1]!
        // Skip node built-ins and external packages
        if (!specifier.startsWith(".") && !specifier.startsWith("@kernel") && !specifier.startsWith("@os") && !specifier.startsWith("@apps") && !specifier.startsWith("@inspector") && !specifier.startsWith("@/")) {
            continue
        }
        imports.push(specifier)
    }
    return imports
}

function resolveAlias(specifier: string): string | null {
    // Sort aliases by length descending so more specific aliases match first
    const sorted = Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length)
    for (const [alias, target] of sorted) {
        if (specifier === alias) return target
        if (specifier.startsWith(alias + "/")) {
            return path.join(target, specifier.slice(alias.length + 1))
        }
    }
    return null
}

function resolveImport(fromFile: string, specifier: string): string {
    const aliased = resolveAlias(specifier)
    if (aliased) return aliased

    // Relative import
    return path.resolve(path.dirname(fromFile), specifier)
}

/**
 * Get the "folder group" for a file path.
 * Groups at GROUP_DEPTH levels below known roots.
 *
 * e.g., src/os-new/6-components/Zone/Zone.tsx -> "os-new/6-components"
 *       src/apps/todo/commands/index.ts -> "apps/todo"
 *       packages/kernel/src/core/types.ts -> "kernel"
 */
function getFolderGroup(filePath: string): string {
    // Kernel special case
    if (filePath.startsWith(KERNEL)) {
        return "kernel"
    }

    if (filePath.startsWith(SRC)) {
        const rel = path.relative(SRC, filePath)
        const parts = rel.split(path.sep)
        // Take up to GROUP_DEPTH parts, but not the filename
        const groupParts = parts.slice(0, Math.min(GROUP_DEPTH, parts.length - 1))
        if (groupParts.length === 0) return "src(root)"
        return groupParts.join("/")
    }

    return "external"
}

// ─── Main Analysis ───────────────────────────────────────────────────────────

function analyze() {
    const allFiles = [...getAllTsFiles(SRC), ...getAllTsFiles(KERNEL)]
    const edges: ImportEdge[] = []

    // Collect all import edges
    for (const file of allFiles) {
        const imports = extractImports(file)
        for (const spec of imports) {
            const resolved = resolveImport(file, spec)
            edges.push({ fromFile: file, toSpecifier: spec, resolvedTo: resolved })
        }
    }

    // Group by folder
    const folderStats = new Map<string, FolderStats>()

    function getOrCreate(folder: string): FolderStats {
        if (!folderStats.has(folder)) {
            folderStats.set(folder, {
                folder,
                totalImports: 0,
                internalImports: 0,
                externalImports: 0,
                cohesion: 0,
                importsFrom: new Map(),
                importedBy: new Set(),
            })
        }
        return folderStats.get(folder)!
    }

    // Register all folders that have files
    for (const file of allFiles) {
        getOrCreate(getFolderGroup(file))
    }

    // Process edges
    for (const edge of edges) {
        const fromGroup = getFolderGroup(edge.fromFile)
        const toGroup = getFolderGroup(edge.resolvedTo)
        const stats = getOrCreate(fromGroup)
        stats.totalImports++

        if (fromGroup === toGroup) {
            stats.internalImports++
        } else {
            stats.externalImports++
            const count = stats.importsFrom.get(toGroup) ?? 0
            stats.importsFrom.set(toGroup, count + 1)
            getOrCreate(toGroup).importedBy.add(fromGroup)
        }
    }

    // Calculate cohesion
    for (const stats of folderStats.values()) {
        stats.cohesion = stats.totalImports > 0 ? stats.internalImports / stats.totalImports : 1
    }

    return { folderStats, edges, allFiles }
}

// ─── Reporting ───────────────────────────────────────────────────────────────

function printReport({ folderStats, edges, allFiles }: ReturnType<typeof analyze>) {
    const sorted = [...folderStats.values()].sort((a, b) => a.folder.localeCompare(b.folder))

    console.log("╔══════════════════════════════════════════════════════════════════════╗")
    console.log("║              📁 Folder Dependency Health Report                     ║")
    console.log("╚══════════════════════════════════════════════════════════════════════╝")
    console.log()
    console.log(`  Files analyzed: ${allFiles.length}`)
    console.log(`  Import edges: ${edges.length}`)
    console.log(`  Folder groups: ${sorted.length}`)
    console.log()

    // ── Cohesion Table ──
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  📊 Cohesion Summary (higher = more self-contained)                │")
    console.log("├────────────────────────────┬────────┬──────────┬──────────┬─────────┤")
    console.log("│ Folder                     │ Total  │ Internal │ External │ Cohesn  │")
    console.log("├────────────────────────────┼────────┼──────────┼──────────┼─────────┤")

    for (const s of sorted) {
        const bar = getCohesionBar(s.cohesion)
        const name = s.folder.padEnd(26)
        const total = String(s.totalImports).padStart(5)
        const internal = String(s.internalImports).padStart(7)
        const external = String(s.externalImports).padStart(7)
        const cohesion = `${(s.cohesion * 100).toFixed(0)}%`.padStart(4)
        console.log(`│ ${name} │ ${total}  │ ${internal}  │ ${external}  │ ${cohesion} ${bar} │`)
    }

    console.log("└────────────────────────────┴────────┴──────────┴──────────┴─────────┘")
    console.log()

    // ── Dependency Flow (who imports whom) ──
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  🔗 Dependency Flow (folder → imports from)                        │")
    console.log("└─────────────────────────────────────────────────────────────────────┘")

    for (const s of sorted) {
        if (s.importsFrom.size === 0) continue
        console.log()
        console.log(`  📂 ${s.folder}`)
        const deps = [...s.importsFrom.entries()].sort((a, b) => b[1] - a[1])
        for (const [dep, count] of deps) {
            const bar = "█".repeat(Math.min(count, 30))
            console.log(`     → ${dep.padEnd(28)} ${String(count).padStart(3)} ${bar}`)
        }
    }

    console.log()

    // ── Fan-in Analysis (most imported folders) ──
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  🎯 Fan-in (most widely imported folders = shared/core)            │")
    console.log("└─────────────────────────────────────────────────────────────────────┘")

    const fanIn = [...folderStats.values()]
        .map(s => ({ folder: s.folder, fanIn: s.importedBy.size, by: [...s.importedBy] }))
        .filter(s => s.fanIn > 0)
        .sort((a, b) => b.fanIn - a.fanIn)

    for (const s of fanIn) {
        const bar = "●".repeat(s.fanIn)
        console.log(`  ${s.folder.padEnd(28)} imported by ${String(s.fanIn).padStart(2)} folders ${bar}`)
        console.log(`  ${"".padEnd(28)} └─ ${s.by.join(", ")}`)
    }

    console.log()

    // ── Layer Violations (os-new numbered layers) ──
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  ⚠️  Layer Violations (higher layer importing lower-numbered layer  │")
    console.log("│     is OK; lower importing higher = VIOLATION)                      │")
    console.log("└─────────────────────────────────────────────────────────────────────┘")

    const layerPattern = /^os-new\/(\d+)-/
    let violationCount = 0

    for (const s of sorted) {
        const fromMatch = s.folder.match(layerPattern)
        if (!fromMatch) continue
        const fromLayer = parseInt(fromMatch[1]!)

        for (const [dep, count] of s.importsFrom.entries()) {
            const toMatch = dep.match(layerPattern)
            if (!toMatch) continue
            const toLayer = parseInt(toMatch[1]!)

            if (toLayer > fromLayer) {
                console.log(`  ❌ ${s.folder} (L${fromLayer}) → ${dep} (L${toLayer})  [${count} imports]`)
                violationCount++
            }
        }
    }

    if (violationCount === 0) {
        console.log("  ✅ No layer violations found!")
    }

    console.log()

    // ── Cross-cutting concerns ──
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  🌐 Dependency Direction Summary                                   │")
    console.log("│     Shows if each folder mainly imports DOWN (good) or UP (bad)     │")
    console.log("└─────────────────────────────────────────────────────────────────────┘")

    // Show os-new layers dependency direction
    const osLayers = sorted.filter(s => layerPattern.test(s.folder))
    for (const s of osLayers) {
        const fromMatch = s.folder.match(layerPattern)
        if (!fromMatch) continue
        const fromLayer = parseInt(fromMatch[1]!)

        let downward = 0
        let upward = 0
        let lateral = 0

        for (const [dep, count] of s.importsFrom.entries()) {
            const toMatch = dep.match(layerPattern)
            if (!toMatch) {
                lateral += count
                continue
            }
            const toLayer = parseInt(toMatch[1]!)
            if (toLayer < fromLayer) downward += count
            else if (toLayer > fromLayer) upward += count
            else lateral += count
        }

        const direction = upward > 0 ? "⚠️" : "✅"
        console.log(`  ${direction} ${s.folder.padEnd(28)} ↓down:${String(downward).padStart(3)}  ↑up:${String(upward).padStart(3)}  ↔other:${String(lateral).padStart(3)}`)
    }

    console.log()

    // ── Mermaid Diagram ──
    printMermaid(sorted)
}

function getCohesionBar(cohesion: number): string {
    const filled = Math.round(cohesion * 5)
    return "█".repeat(filled) + "░".repeat(5 - filled)
}

function printMermaid(sorted: FolderStats[]) {
    console.log("┌─────────────────────────────────────────────────────────────────────┐")
    console.log("│  📐 Mermaid Diagram (paste into mermaid live editor)               │")
    console.log("└─────────────────────────────────────────────────────────────────────┘")
    console.log()
    console.log("```mermaid")
    console.log("graph TD")

    // Create safe node IDs
    const toId = (folder: string) => folder.replace(/[\/\-\.]/g, "_")

    // Add nodes with cohesion info
    for (const s of sorted) {
        const id = toId(s.folder)
        const cohPct = `${(s.cohesion * 100).toFixed(0)}%`
        console.log(`  ${id}["${s.folder}<br/>cohesion: ${cohPct}"]`)
    }

    console.log()

    // Add edges (only significant ones, threshold: 2+ imports)
    for (const s of sorted) {
        for (const [dep, count] of s.importsFrom.entries()) {
            if (count < 2) continue
            const fromId = toId(s.folder)
            const toId2 = toId(dep)
            console.log(`  ${fromId} -->|${count}| ${toId2}`)
        }
    }

    // Style layer violations in red
    const layerPattern = /^os-new\/(\d+)-/
    const violations: string[] = []
    for (const s of sorted) {
        const fromMatch = s.folder.match(layerPattern)
        if (!fromMatch) continue
        const fromLayer = parseInt(fromMatch[1]!)
        for (const [dep] of s.importsFrom.entries()) {
            const toMatch = dep.match(layerPattern)
            if (!toMatch) continue
            const toLayer = parseInt(toMatch[1]!)
            if (toLayer > fromLayer) {
                violations.push(toId(s.folder))
            }
        }
    }

    if (violations.length > 0) {
        console.log()
        console.log(`  style ${[...new Set(violations)].join(",")} fill:#ff6b6b,color:#fff`)
    }

    console.log("```")
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const result = analyze()
printReport(result)
