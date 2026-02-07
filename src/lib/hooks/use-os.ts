import { useEffect, useState } from "react";

export type OS = "mac" | "windows" | "linux" | "other";

export function useOS(): OS {
  const [os, setOS] = useState<OS>("other");

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    // @ts-expect-error - platform IS deprecated but still useful for detection
    const platform =
      window.navigator?.userAgentData?.platform || window.navigator.platform;
    const macos = /Mac|iPhone|iPod|iPad/i.test(platform);
    const windows = /Win/i.test(platform);
    const linux = /Linux/i.test(platform);

    if (macos) {
      setOS("mac");
    } else if (windows) {
      setOS("windows");
    } else if (linux) {
      setOS("linux");
    } else {
      // Fallback for newer userAgent strings if platform is ambiguous
      if (/Mac/i.test(userAgent)) {
        setOS("mac");
      } else if (/Win/i.test(userAgent)) {
        setOS("windows");
      } else if (/Linux/i.test(userAgent)) {
        setOS("linux");
      }
    }
  }, []);

  return os;
}
