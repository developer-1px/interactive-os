/**
 * Type declarations for .spec.ts files
 *
 * After the Vite spec-wrapper plugin transforms .spec.ts files,
 * they export a default function. This declaration tells TypeScript
 * about that shape.
 */
declare module "*.spec.ts" {
    const runSpec: {
        (): void;
        sourceFile: string;
    };
    export default runSpec;
}
