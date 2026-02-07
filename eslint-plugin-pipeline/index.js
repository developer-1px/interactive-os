/**
 * ESLint Plugin: Focus Pipeline Rules
 *
 * 파이프라인 위반을 검사하는 커스텀 lint 규칙
 */

/** @type {import('eslint').Rule.RuleModule} */
const noPipelineBypass = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct calls to commitAll, DOMRegistry, or FocusRegistry in resolve functions",
      recommended: true,
    },
    messages: {
      noCommitInResolve:
        "commitAll should not be called directly. Use runPipeline instead.",
      noDOMInResolve:
        "DOMRegistry should not be accessed in resolve functions. Pass DOM data as parameters.",
      noRegistryMutation:
        "FocusRegistry mutations should go through runPipeline.",
    },
    schema: [],
  },
  create(context) {
    let inResolveFunction = false;
    let functionDepth = 0;

    return {
      // Detect resolve* function declarations
      FunctionDeclaration(node) {
        if (node.id?.name?.startsWith("resolve")) {
          inResolveFunction = true;
          functionDepth = 0;
        }
      },
      "FunctionDeclaration:exit"(node) {
        if (node.id?.name?.startsWith("resolve")) {
          inResolveFunction = false;
        }
      },

      // Track nested functions
      FunctionExpression() {
        if (inResolveFunction) functionDepth++;
      },
      "FunctionExpression:exit"() {
        if (inResolveFunction) functionDepth--;
      },
      ArrowFunctionExpression() {
        if (inResolveFunction) functionDepth++;
      },
      "ArrowFunctionExpression:exit"() {
        if (inResolveFunction) functionDepth--;
      },

      // Check for violations
      CallExpression(node) {
        if (!inResolveFunction || functionDepth > 0) return;

        const callee = node.callee;

        // Direct function call: commitAll()
        if (callee.type === "Identifier" && callee.name === "commitAll") {
          context.report({ node, messageId: "noCommitInResolve" });
        }

        // Member expression: DOMRegistry.xxx()
        if (callee.type === "MemberExpression") {
          const object = callee.object;
          if (object.type === "Identifier") {
            if (object.name === "DOMRegistry") {
              context.report({ node, messageId: "noDOMInResolve" });
            }
            if (
              object.name === "FocusRegistry" &&
              callee.property?.name !== "getGroupEntry"
            ) {
              context.report({ node, messageId: "noRegistryMutation" });
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
    type: "problem",
    docs: {
      description: "Disallow direct commitAll calls outside of runPipeline",
      recommended: true,
    },
    messages: {
      noDirectCommit:
        "commitAll should only be called from runPipeline. Use runPipeline(result, store) instead.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();

    // Allow in pipeline.ts itself
    if (filename.includes("pipeline/core/pipeline.ts")) {
      return {};
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "commitAll") {
          context.report({ node, messageId: "noDirectCommit" });
        }
      },
    };
  },
};

// ─── ZIFT Semantic Props Allowlist ──────────────────────────────────
// ZIFT 프리미티브의 시맨틱 props는 네이티브 DOM 핸들러가 아니므로 예외 처리
const ZIFT_ALLOWED_PROPS = {
  Trigger: new Set(["onPress"]),
  Field: new Set(["onChange", "onSubmit", "onCancel"]),
  Zone: new Set([
    "onAction",
    "onToggle",
    "onSelect",
    "onDelete",
    "onCopy",
    "onPaste",
    "onUndo",
    "onRedo",
  ]),
};

/** @type {import('eslint').Rule.RuleModule} */
const noHandlerInApp = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow native DOM event handlers in app components (ZIFT Passive Projection)",
      recommended: true,
    },
    messages: {
      noHandler:
        "Native handler '{{name}}' violates ZIFT Passive Projection. " +
        "Use ZIFT primitives (Zone, Item, Field, Trigger) instead.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const attrName = node.name?.name;
        if (typeof attrName !== "string") return;

        // on* 패턴이 아니면 무시
        if (!attrName.startsWith("on") || attrName.length < 3) return;
        // 세 번째 글자가 대문자인 경우만 (React 이벤트 핸들러 컨벤션: onClick, onSubmit 등)
        if (attrName[2] !== attrName[2].toUpperCase()) return;

        // 부모 JSX 요소의 컴포넌트 이름 확인
        const jsxElement = node.parent;
        if (jsxElement?.type === "JSXOpeningElement") {
          const elementName = jsxElement.name;
          let componentName = null;

          if (elementName.type === "JSXIdentifier") {
            componentName = elementName.name;
          } else if (elementName.type === "JSXMemberExpression") {
            componentName = elementName.property?.name;
          }

          // ZIFT 프리미티브의 허용된 시맨틱 props는 예외
          if (componentName && ZIFT_ALLOWED_PROPS[componentName]) {
            if (ZIFT_ALLOWED_PROPS[componentName].has(attrName)) {
              return;
            }
          }
        }

        context.report({
          node,
          messageId: "noHandler",
          data: { name: attrName },
        });
      },
    };
  },
};

export default {
  rules: {
    "no-pipeline-bypass": noPipelineBypass,
    "no-direct-commit": noDirectCommit,
    "no-handler-in-app": noHandlerInApp,
  },
};
