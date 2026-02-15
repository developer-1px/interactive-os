#!/usr/bin/env node

/**
 * move-docs.mjs — Markdown 파일 이동 + 상호참조 자동 수정
 *
 * Usage:
 *   node scripts/move-docs.mjs <target-dir> <file1> [file2] [file3] ...
 *   node scripts/move-docs.mjs --dry-run <target-dir> <file1> [file2] ...
 */

import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { visit } from "unist-util-visit"

const args = process.argv.slice(2)
let dryRun = false
if (args[0] === "--dry-run") { dryRun = true; args.shift() }

if (args.length < 2) {
    console.error("Usage: node scripts/move-docs.mjs [--dry-run] <target-dir> <file1> [file2] ...")
    process.exit(1)
}

const targetDir = args[0]
const filesToMove = args.slice(1)
const projectRoot = process.cwd()
const absTargetDir = path.resolve(projectRoot, targetDir)

for (const file of filesToMove) {
    if (!fs.existsSync(path.resolve(projectRoot, file))) { console.error(`❌ Not found: ${file}`); process.exit(1) }
    if (!file.endsWith(".md")) { console.error(`❌ Not markdown: ${file}`); process.exit(1) }
}

if (!dryRun) fs.mkdirSync(absTargetDir, { recursive: true })

for (const file of filesToMove) {
    const dest = path.join(absTargetDir, path.basename(file))
    if (fs.existsSync(dest)) { console.error(`❌ Already exists: ${dest}`); process.exit(1) }
}

const movedFiles = []
console.log(`\n📦 Moving ${filesToMove.length} file(s) to ${targetDir}`)

for (const file of filesToMove) {
    const oldAbs = path.resolve(projectRoot, file)
    const newAbs = path.join(absTargetDir, path.basename(file))
    console.log(`  git mv ${path.relative(projectRoot, oldAbs)} → ${path.relative(projectRoot, newAbs)}`)
    if (!dryRun) {
        try { execSync(`git mv "${oldAbs}" "${newAbs}"`, { stdio: "pipe" }) }
        catch { fs.renameSync(oldAbs, newAbs); console.log(`  ⚠️  Not git-tracked, used regular mv`) }
    }
    movedFiles.push({ oldAbs, newAbs })
}

function findAllMd() {
    const results = []
    function walk(dir) {
        if (!fs.existsSync(dir)) return
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const fp = path.join(dir, e.name)
            if (e.isDirectory()) walk(fp)
            else if (e.name.endsWith(".md")) results.push(fp)
        }
    }
    walk(path.join(projectRoot, "docs"))
    return results
}

function parseLink(url, contextDir) {
    if (!url || url.startsWith("http://") || url.startsWith("https://")) return null
    const hi = url.indexOf("#")
    let filePart = hi >= 0 ? url.slice(0, hi) : url
    const anchor = hi >= 0 ? url.slice(hi) : ""
    if (!filePart) return null
    if (filePart.startsWith("file://")) {
        return { filePath: decodeURIComponent(filePart.replace("file://", "")), anchor, isFileUrl: true }
    }
    return { filePath: path.resolve(contextDir, filePart), anchor, isFileUrl: false }
}

const processor = unified().use(remarkParse).use(remarkStringify, { bullet: "-", emphasis: "*", strong: "*", listItemIndent: "one", rule: "-" })

console.log(`\n🔗 Updating references...`)
let totalUpdated = 0

for (const mdFile of findAllMd()) {
    const content = fs.readFileSync(mdFile, "utf-8")
    const tree = processor.parse(content)
    const contextDir = path.dirname(mdFile)
    let modified = false, count = 0

    visit(tree, ["link", "image", "definition"], (node) => {
        const parsed = parseLink(node.url, contextDir)
        if (!parsed) return
        const moved = movedFiles.find(m => m.oldAbs === parsed.filePath)
        if (!moved) return
        node.url = parsed.isFileUrl
            ? `file://${moved.newAbs}${parsed.anchor}`
            : `${((r) => r.startsWith(".") ? r : `./${r}`)(path.relative(contextDir, moved.newAbs))}${parsed.anchor}`
        modified = true; count++
    })

    if (modified) {
        console.log(`  ✏️  ${path.relative(projectRoot, mdFile)}: ${count} link(s)`)
        if (!dryRun) fs.writeFileSync(mdFile, processor.stringify(tree), "utf-8")
        totalUpdated += count
    }
}

if (!totalUpdated) console.log(`  (no references to update)`)
else console.log(`  Total: ${totalUpdated} link(s) updated`)

console.log(`\n🔍 Validating...`)
let broken = 0
for (const mdFile of findAllMd()) {
    const tree = processor.parse(fs.readFileSync(mdFile, "utf-8"))
    visit(tree, ["link", "image", "definition"], (node) => {
        const p = parseLink(node.url, path.dirname(mdFile))
        if (!p || p.isFileUrl || !p.filePath.endsWith(".md")) return
        if (!fs.existsSync(p.filePath)) {
            console.log(`  ⚠️  ${path.relative(projectRoot, mdFile)}: ${node.url}`)
            broken++
        }
    })
}
console.log(broken ? `  ❌ ${broken} broken link(s)` : `  ✅ All links valid!`)
console.log(dryRun ? "\n🏁 Dry run complete." : `\n🏁 Done. ${filesToMove.length} moved, ${totalUpdated} links updated.`)
