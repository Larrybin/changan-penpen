import { describe, expect, it } from "vitest";

import * as alias from "./route";
import * as v1 from "../v1/health/route";

describe("/api/health alias", () => {
    it("re-exports runtime", () => {
        expect(alias.runtime).toBe(v1.runtime);
    });

    it("re-exports GET handler", () => {
        expect(alias.GET).toBe(v1.GET);
    });
});
