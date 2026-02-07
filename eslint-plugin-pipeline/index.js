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
  Field: new Set([
    "onChange",
    "onSubmit",
    "onCancel",
    "onCommit",
    "onSync",
    "onCancelCallback",
  ]),
  Zone: new Set([
    "onAction",
    "onToggle",
    "onSelect",
    "onDelete",
    "onCopy",
    "onCut",
    "onPaste",
    "onUndo",
    "onRedo",
  ]),
  Item: new Set([]),
};

// ─── Visual Handler Allowlist ───────────────────────────────────────
// 순수 시각적 효과(hover, pointer)를 위한 핸들러는 OS 상태에 영향 없음
const VISUAL_HANDLER_ALLOWLIST = new Set([
  "onMouseEnter",
  "onMouseLeave",
  "onMouseOver",
  "onMouseOut",
  "onPointerEnter",
  "onPointerLeave",
]);

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

        // 순수 시각적 핸들러는 ZIFT 위반 아님
        if (VISUAL_HANDLER_ALLOWLIST.has(attrName)) return;

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

// ─── No Imperative Handler ──────────────────────────────────────────
// DOM 직접 접근을 통한 이벤트 핸들러 등록을 감지
// addEventListener, ref.current.addEventListener 등

/** @type {import('eslint').Rule.RuleModule} */
const noImperativeHandler = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imperative DOM event registration (addEventListener) in app components",
      recommended: true,
    },
    messages: {
      noAddEventListener:
        "Direct addEventListener('{{event}}') violates ZIFT Passive Projection. " +
        "Route through the Interaction OS pipeline instead.",
      noRemoveEventListener:
        "removeEventListener detected — paired with a forbidden addEventListener.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        let methodName = null;

        // ── Pattern 1: object.addEventListener(...) ──
        // document.addEventListener, window.addEventListener,
        // ref.current.addEventListener, el.addEventListener
        if (
          callee.type === "MemberExpression" &&
          callee.property?.type === "Identifier"
        ) {
          methodName = callee.property.name;
        }

        // ── Pattern 2: standalone addEventListener (rare but possible) ──
        if (callee.type === "Identifier") {
          methodName = callee.name;
        }

        if (methodName === "addEventListener") {
          // 이벤트 이름 추출 (첫 번째 인자)
          const eventArg = node.arguments[0];
          const eventName =
            eventArg?.type === "Literal" ? String(eventArg.value) : "unknown";

          context.report({
            node,
            messageId: "noAddEventListener",
            data: { event: eventName },
          });
        }

        if (methodName === "removeEventListener") {
          context.report({
            node,
            messageId: "noRemoveEventListener",
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "no-pipeline-bypass": noPipelineBypass,
    "no-direct-commit": noDirectCommit,
    "no-handler-in-app": noHandlerInApp,
    "no-imperative-handler": noImperativeHandler,
  },
};
