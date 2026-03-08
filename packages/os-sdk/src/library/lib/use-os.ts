export type OS = "mac" | "windows" | "linux" | "other";

function detectOS(): OS {
  if (typeof window === "undefined") return "other";
  const userAgent = window.navigator.userAgent;
  const nav = window.navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = nav.userAgentData?.platform || window.navigator.platform;

  if (/Mac|iPhone|iPod|iPad/i.test(platform)) return "mac";
  if (/Win/i.test(platform)) return "windows";
  if (/Linux/i.test(platform)) return "linux";

  // Fallback for newer userAgent strings if platform is ambiguous
  if (/Mac/i.test(userAgent)) return "mac";
  if (/Win/i.test(userAgent)) return "windows";
  if (/Linux/i.test(userAgent)) return "linux";

  return "other";
}

const detectedOS = detectOS();

export function useOS(): OS {
  return detectedOS;
}
