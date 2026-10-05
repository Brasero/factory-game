import {describe, expect, it} from "vitest";
import {pipeSprite} from "./pipe";

describe("pipe sprites", () => {
  it("uses straight state indicators only for straight pipes", () => {
    expect(pipeSprite(new Set(["left", "right"]), "right", false)).toMatchObject({sx: 48, sy: 64});
    expect(pipeSprite(new Set(["left", "right"]), "right", true)).toMatchObject({sx: 48, sy: 48});
  });

  it("uses the atlas corners and junction", () => {
    expect(pipeSprite(new Set(["right", "down"]), "right", false)).toMatchObject({sx: 0, sy: 0});
    expect(pipeSprite(new Set(["left", "up"]), "up", false)).toMatchObject({sx: 32, sy: 32});
    expect(pipeSprite(new Set(["left", "right", "down"]), "right", false)).toMatchObject({sx: 64, sy: 16});
  });
});
