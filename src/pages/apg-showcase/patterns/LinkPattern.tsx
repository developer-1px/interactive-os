/**
 * APG Link Pattern — Showcase UI
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/link/examples/link/
 *
 * W3C APG Link spec:
 *   - Enter: activates the link
 *   - Native <a href> is strongly preferred (browser provides context menu,
 *     new-tab, status bar URL, etc.)
 *   - For non-anchor elements: role="link" + tabindex="0" + Enter activates
 *
 * ZIFT classification: Trigger (action)
 *   - Custom links use Zone + Trigger prop-getter for Enter/click activation.
 *   - Native <a> links need no OS machinery — browsers handle Enter natively.
 *
 * OS pattern:
 *   Native <a> links need no OS machinery — browsers handle Enter natively.
 *   Custom link (span role="link") uses trigger declared in bind()
 *   to dispatch a navigation command on click.
 *   defineApp state tracks the last navigated URL for testability.
 */

import { defineApp } from "@os-sdk/app/defineApp";

// ─── App State ───

export const LinkApp = defineApp<{
  lastNavigatedUrl: string | null;
}>("apg-link", {
  lastNavigatedUrl: null,
});

const linkZone = LinkApp.createZone("custom-links");

export const NAVIGATE_LINK = linkZone.command(
  "NAVIGATE_LINK",
  (_ctx, payload: { url: string }) => ({
    state: { lastNavigatedUrl: payload.url },
  }),
);

// ─── Bind (triggers declared here) ───

const LinkUI = linkZone.bind({
  role: "toolbar",
  options: {
    navigate: { orientation: "vertical" },
  },
  triggers: {
    NavSettings: () => NAVIGATE_LINK({ url: "/settings" }),
    NavProfile: () => NAVIGATE_LINK({ url: "/profile" }),
  },
});

// ─── Link Data ───

interface LinkDef {
  id: string;
  label: string;
  url: string;
  description: string;
}

const NATIVE_LINKS: LinkDef[] = [
  {
    id: "link-w3c",
    label: "W3C WAI-ARIA",
    url: "https://www.w3.org/WAI/ARIA/apg/",
    description: "W3C Accessible Rich Internet Applications specification.",
  },
  {
    id: "link-mdn",
    label: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    description: "Comprehensive web development documentation.",
  },
];

interface CustomLinkDef extends LinkDef {
  triggerKey: "NavSettings" | "NavProfile";
}

const CUSTOM_LINKS: CustomLinkDef[] = [
  {
    id: "link-custom-settings",
    label: "Settings",
    url: "/settings",
    description:
      'A span element with role="link" — demonstrates ARIA link on non-anchor.',
    triggerKey: "NavSettings",
  },
  {
    id: "link-custom-profile",
    label: "Profile",
    url: "/profile",
    description:
      "Another custom link — OS Trigger dispatches a command on activation.",
    triggerKey: "NavProfile",
  },
];

// ─── Component ───

function LinkPattern() {
  const lastUrl = LinkApp.useComputed((s) => s.lastNavigatedUrl);

  return (
    <div className="max-w-lg">
      <h3 className="text-lg font-semibold mb-3">Link</h3>
      <p className="text-sm text-gray-500 mb-4">
        W3C APG Link Pattern: <kbd>Enter</kbd> activates the link. Native{" "}
        <code>&lt;a&gt;</code> elements are preferred. For custom elements, use{" "}
        <code>role=&quot;link&quot;</code> with{" "}
        <code>tabindex=&quot;0&quot;</code>.{" "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/link/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          W3C APG Spec
        </a>
        {" | "}
        <a
          href="https://www.w3.org/WAI/ARIA/apg/patterns/link/examples/link/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          Example →
        </a>
      </p>

      {/* Section 1: Native <a> links — browser handles everything */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Native Links (recommended)
        </h4>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
          {NATIVE_LINKS.map((link) => (
            <div key={link.id} className="px-4 py-3">
              <a
                id={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  text-sm font-medium text-indigo-600 hover:text-indigo-800
                  underline decoration-indigo-300 underline-offset-2
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                  rounded-sm
                "
              >
                {link.label}
              </a>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Custom role="link" — trigger prop-getter dispatches command */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Custom Links (role=&quot;link&quot;)
        </h4>
        <LinkUI.Zone
          className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm"
          aria-label="Custom navigation links"
        >
          {CUSTOM_LINKS.map((link) => (
            <div key={link.id} className="px-4 py-3">
              <LinkUI.Item id={link.id}>
                <span
                  role="link"
                  tabIndex={0}
                  {...LinkUI.triggers[link.triggerKey]()}
                  className="
                    text-sm font-medium text-indigo-600 hover:text-indigo-800
                    underline decoration-indigo-300 underline-offset-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                    rounded-sm cursor-pointer
                  "
                >
                  {link.label}
                </span>
              </LinkUI.Item>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </div>
          ))}
        </LinkUI.Zone>
      </div>

      {/* Debug: last navigated URL */}
      {lastUrl && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            Last custom link activated:{" "}
            <code className="text-indigo-600 font-mono">{lastUrl}</code>
          </p>
        </div>
      )}
    </div>
  );
}

export { LinkPattern };
