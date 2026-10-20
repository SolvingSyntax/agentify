import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  const router = createRouter({ routeTree });
  for (const path of ["/", "/workflows", "/workflows/abc", "/agents", "/approvals", "/executions", "/executions/abc", "/integrations", "/analytics", "/settings"]) {
    it(`matches a page for ${path}`, () => {
      expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe(rootRouteId);
    });
  }
});
