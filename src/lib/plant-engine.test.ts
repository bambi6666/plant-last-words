import { describe, expect, it } from "vitest";
import { diagnosePlant } from "@/lib/plant-engine";

describe("diagnosePlant", () => {
  it("marks severely overwatered plants as dying or dead", () => {
    const result = diagnosePlant({
      imageName: "money-tree.jpg",
      symptoms: ["yellow_leaf", "droopy", "mold"],
      roomLight: "low",
      watering: "daily",
      potDrainage: "no"
    });

    expect(["dead", "dying"]).toContain(result.status);
    expect(result.rescueItems.some((item) => item.id === "well-draining-soil" && item.priority === "must")).toBe(true);
  });

  it("creates a rescue note for recoverable plants", () => {
    const result = diagnosePlant({
      imageName: "pothos.png",
      symptoms: ["yellow_leaf"],
      roomLight: "medium",
      watering: "weekly",
      potDrainage: "yes"
    });

    expect(result.detectedSpecies).toBe("绿萝");
    expect(result.letterTone).toBe("rescue_note");
  });
});
