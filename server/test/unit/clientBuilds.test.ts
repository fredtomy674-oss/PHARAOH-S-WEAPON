import { describe, expect, it } from "vitest";
import { lastClientBuild, recordClientBuild } from "../../src/clientBuilds.js";

/**
 * PHASE 174 — which web build is really running on a device. The owner's
 * phone kept a stale bundle open through several deploys; a page now reports
 * itself once per load (GET /api/health?v=…), and this is the receipt.
 */
describe("PHASE 174 — the client-build beacon", () => {
  it("records the latest sighting", () => {
    recordClientBuild("174");
    const seen = lastClientBuild();
    expect(seen?.build).toBe("174");
    expect(seen && Date.parse(seen.at)).not.toBeNaN();
  });

  it("keeps the newest report — the beacon answers 'right now', not history", () => {
    recordClientBuild("173");
    recordClientBuild("174");
    expect(lastClientBuild()?.build).toBe("174");
  });

  it("ignores anything that is not a small, plain build id", () => {
    recordClientBuild("174-preview.1_ok");
    expect(lastClientBuild()?.build).toBe("174-preview.1_ok");
    recordClientBuild(undefined);
    recordClientBuild(42);
    recordClientBuild("  ");
    recordClientBuild("x".repeat(200));
    recordClientBuild("<script>alert(1)</script>");
    expect(lastClientBuild()?.build).toBe("174-preview.1_ok");
  });
});
