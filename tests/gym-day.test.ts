import { describe, expect, it } from "vitest";
import { gymCalendarDay } from "@/lib/gym-day";

describe("gymCalendarDay", () => {
  it("uses the gym timezone across UTC date boundaries", () => {
    expect(gymCalendarDay(new Date("2026-10-01T16:30:00.000Z"), "Asia/Manila")).toBe("2026-10-02");
  });
  it("uses distinct local days when midnight differs by timezone", () => {
    const instant = new Date("2026-10-02T00:30:00.000Z");
    expect(gymCalendarDay(instant, "Asia/Manila")).toBe("2026-10-02");
    expect(gymCalendarDay(instant, "America/Los_Angeles")).toBe("2026-10-01");
  });
  it("falls back to UTC for an invalid timezone", () => {
    expect(gymCalendarDay(new Date("2026-10-02T00:30:00.000Z"), "Not/A_Real_Zone")).toBe("2026-10-02");
  });
});
