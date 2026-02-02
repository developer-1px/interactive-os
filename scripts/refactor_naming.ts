
import { Project, SyntaxKind, QuoteKind } from 'ts-morph';
import path from 'path';
import fs from 'fs';

const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true, // we will add manually to be checking
    manipulationSettings: {
        quoteKind: QuoteKind.Single,
    }
});

async function main() {
    // Manually add files to ensure they are found
    project.addSourceFilesAtPaths("src/**/*.{ts,tsx}");

    console.log('Starting refactoring...');

    // 1. Rename src/lib files (snake_case -> camelCase)
    const libDir = project.getDirectoryOrThrow('src/lib');
    const filesToRename = [
        { old: 'todo_engine.tsx', new: 'todoEngine.tsx' },
        { old: 'todo_commands.ts', new: 'todoCommands.ts' },
        { old: 'todo_keys.ts', new: 'todoKeys.ts' },
        { old: 'todo_menus.ts', new: 'todoMenus.ts' },
        { old: 'todo_types.ts', new: 'todoTypes.ts' },
    ];

    for (const file of filesToRename) {
        const sourceFile = libDir.getSourceFile(file.old);
        if (sourceFile) {
            console.log(`Renaming ${file.old} to ${file.new}...`);
            sourceFile.move(path.join(libDir.getPath(), file.new));
        } else {
            console.warn(`File not found: src/lib/${file.old}`);
        }
    }

    // 2. Dissolve src/lib/primitives barrels
    const primitivesDir = project.getDirectory('src/lib/primitives');
    if (primitivesDir) {
        const subDirs = primitivesDir.getDirectories();
        for (const subDir of subDirs) {
            const indexFile = subDir.getSourceFile('index.tsx') || subDir.getSourceFile('index.ts');
            if (indexFile) {
                const stepName = subDir.getBaseName(); // e.g., 'Zone'
                const newPath = path.join(primitivesDir.getPath(), `${stepName}.tsx`);
                console.log(`Moving ${subDir.getPath()}/index.tsx to ${newPath}...`);

                indexFile.move(newPath);

                // We need to delete the directory later, as ts-morph might hold references? 
                // Actually sourceFile.move() moves the file physically on save().
                // We'll trust sourceFile.move() and then we can delete the empty directory.
            }
        }

        // Remove src/lib/primitives/index.ts
        const primitivesIndex = primitivesDir.getSourceFile('index.ts');
        if (primitivesIndex) {
            console.log('Deleting src/lib/primitives/index.ts...');
            primitivesIndex.delete();
        }
    }

    // 3. Dissolve src/components/mocks barrel
    const mocksDir = project.getDirectory('src/components/mocks');
    if (mocksDir) {
        const mocksIndex = mocksDir.getSourceFile('index.ts');
        if (mocksIndex) {
            console.log('Deleting src/components/mocks/index.ts...');
            mocksIndex.delete();
        }
    }

    // 4. Save changes (this applies renames and updates imports)
    console.log('Saving changes...');
    await project.save();

    // 5. Cleanup empty directories
    // We do this after save to ensure files are moved out.
    if (primitivesDir) {
        const subDirs = primitivesDir.getDirectories();
        // Note: getDirectories() returns the in-memory representation. 
        // If we moved files out, these directories might still exist on disk but be empty of the moved files.
        for (const subDir of subDirs) {
            try {
                // Check if directory is empty on disk
                const dirPath = subDir.getPath();
                if (fs.existsSync(dirPath)) {
                    const files = fs.readdirSync(dirPath);
                    if (files.length === 0) {
                        console.log(`Removing empty directory: ${dirPath}`);
                        fs.rmdirSync(dirPath);
                    }
                }
            } catch (e) {
                console.error(`Failed to cleanup dir: ${subDir.getPath()}`, e);
            }
        }
    }

    console.log('Refactoring complete.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
