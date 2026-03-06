import { defineScope } from "@kernel";
import { os } from "@os-sdk/os";
import { router } from "@os-sdk/app/modules/router";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { appRouter } from "./router";

// Install router module on docs-viewer app scope.
// Installed here (not in defineApp) to avoid transitive import of routeTree → components → virtual modules.
const routerMod = router({ instance: appRouter, basePath: "/docs" });
const mw = routerMod.install({ appId: "docs-viewer", scope: defineScope("docs-viewer") });
os.use(mw);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>,
);
