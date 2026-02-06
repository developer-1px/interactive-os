/**
 * ESLint Plugin: Focus Pipeline Rules
 * 
 * 파이프라인 위반을 검사하는 커스텀 lint 규칙
 */

/** @type {import('eslint').Rule.RuleModule} */
const noPipelineBypass = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow direct calls to commitAll, DOMRegistry, or FocusRegistry in resolve functions',
            recommended: true,
        },
        messages: {
            noCommitInResolve: 'commitAll should not be called directly. Use runPipeline instead.',
            noDOMInResolve: 'DOMRegistry should not be accessed in resolve functions. Pass DOM data as parameters.',
            noRegistryMutation: 'FocusRegistry mutations should go through runPipeline.',
        },
        schema: [],
    },
    create(context) {
        let inResolveFunction = false;
        let functionDepth = 0;

        return {
            // Detect resolve* function declarations
            FunctionDeclaration(node) {
                if (node.id?.name?.startsWith('resolve')) {
                    inResolveFunction = true;
                    functionDepth = 0;
                }
            },
            'FunctionDeclaration:exit'(node) {
                if (node.id?.name?.startsWith('resolve')) {
                    inResolveFunction = false;
                }
            },

            // Track nested functions
            FunctionExpression() {
                if (inResolveFunction) functionDepth++;
            },
            'FunctionExpression:exit'() {
                if (inResolveFunction) functionDepth--;
            },
            ArrowFunctionExpression() {
                if (inResolveFunction) functionDepth++;
            },
            'ArrowFunctionExpression:exit'() {
                if (inResolveFunction) functionDepth--;
            },

            // Check for violations
            CallExpression(node) {
                if (!inResolveFunction || functionDepth > 0) return;

                const callee = node.callee;

                // Direct function call: commitAll()
                if (callee.type === 'Identifier' && callee.name === 'commitAll') {
                    context.report({ node, messageId: 'noCommitInResolve' });
                }

                // Member expression: DOMRegistry.xxx()
                if (callee.type === 'MemberExpression') {
                    const object = callee.object;
                    if (object.type === 'Identifier') {
                        if (object.name === 'DOMRegistry') {
                            context.report({ node, messageId: 'noDOMInResolve' });
                        }
                        if (object.name === 'FocusRegistry' &&
                            callee.property?.name !== 'getGroupEntry') {
                            context.report({ node, messageId: 'noRegistryMutation' });
                        }
                    }
                }
            },
        };
    },
};

/** @type {import('eslint').Rule.RuleModule} */
const noDirectCommit = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow direct commitAll calls outside of runPipeline',
            recommended: true,
        },
        messages: {
            noDirectCommit: 'commitAll should only be called from runPipeline. Use runPipeline(result, store) instead.',
        },
        schema: [],
    },
    create(context) {
        const filename = context.filename || context.getFilename();

        // Allow in pipeline.ts itself
        if (filename.includes('pipeline/core/pipeline.ts')) {
            return {};
        }

        return {
            CallExpression(node) {
                const callee = node.callee;
                if (callee.type === 'Identifier' && callee.name === 'commitAll') {
                    context.report({ node, messageId: 'noDirectCommit' });
                }
            },
        };
    },
};

export default {
    rules: {
        'no-pipeline-bypass': noPipelineBypass,
        'no-direct-commit': noDirectCommit,
    },
};
