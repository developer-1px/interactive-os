import { defineScope } from "@kernel";
import { router } from "@os-sdk/app/modules/router";
import { os } from "@os-sdk/os";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { appRouter } from "./router";

// Install router module on docs-viewer app scope.
// Installed here (not in defineApp) to avoid transitive import of routeTree → components → virtual modules.
const routerMod = router({
  instance:
    appRouter as unknown as import("@os-sdk/app/modules/router").RouterInstance,
  basePath: "/docs",
});
const mw = routerMod.install({
  appId: "docs-viewer",
  scope: defineScope("docs-viewer"),
});
if (Array.isArray(mw)) {
  for (const m of mw) os.use(m);
} else {
  os.use(mw);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>,
);
