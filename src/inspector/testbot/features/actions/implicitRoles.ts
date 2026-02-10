/**
 * TestBot — Implicit ARIA Role Mapping (W3C spec)
 *
 * Maps HTML elements to their implicit ARIA roles so that
 * getByRole("button") can find <button> even without explicit role attr.
 */

const IMPLICIT_ROLE_MAP: Record<string, string | ((el: Element) => boolean)> = {
  button: "BUTTON",
  link: (el) => el.tagName === "A" && el.hasAttribute("href"),
  textbox: (el) =>
    (el.tagName === "INPUT" &&
      ["text", "email", "tel", "url", "search", ""].includes(
        (el as HTMLInputElement).type,
      )) ||
    el.tagName === "TEXTAREA",
  checkbox: (el) =>
    el.tagName === "INPUT" && (el as HTMLInputElement).type === "checkbox",
  radio: (el) =>
    el.tagName === "INPUT" && (el as HTMLInputElement).type === "radio",
  listbox: "SELECT",
  option: "OPTION",
  heading: (el) => /^H[1-6]$/.test(el.tagName),
  img: "IMG",
  navigation: "NAV",
  main: "MAIN",
  banner: "HEADER",
  contentinfo: "FOOTER",
  complementary: "ASIDE",
  list: (el) => el.tagName === "UL" || el.tagName === "OL",
  listitem: "LI",
  table: "TABLE",
  row: "TR",
  cell: (el) => el.tagName === "TD" || el.tagName === "TH",
  form: "FORM",
  dialog: "DIALOG",
  separator: "HR",
  group: "FIELDSET",
};

export function matchesRole(el: Element, role: string): boolean {
  if (el.getAttribute("role") === role) return true;
  const mapping = IMPLICIT_ROLE_MAP[role];
  if (!mapping) return false;
  if (typeof mapping === "string") return el.tagName === mapping;
  return mapping(el);
}

export function matchesName(el: Element, name: string): boolean {
  return (
    el.getAttribute("aria-label") === name ||
    el.getAttribute("name") === name ||
    el.getAttribute("title") === name ||
    (el.textContent?.trim() === name && el.children.length === 0)
  );
}
