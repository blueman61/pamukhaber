import "@fontsource-variable/nunito";
import { Composition } from "remotion";
import { Scene } from "../../src/remotion/Scene";
import { FPS, SCENE_H, SCENE_W, type SceneData } from "../../src/remotion/scene-data";

const demo: SceneData = {
  title: "Güzel bir haber",
  beats: ["Bu bir deneme sahnesidir."],
  motifs: ["iyilik"],
  category: "iyilik",
  categories: ["iyilik"],
  sourceName: "",
  seed: 1,
  durationInFrames: 8 * FPS,
};

export function Root() {
  return (
    <Composition
      id="Scene"
      component={Scene}
      width={SCENE_W}
      height={SCENE_H}
      fps={FPS}
      durationInFrames={demo.durationInFrames}
      defaultProps={demo}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
    />
  );
}
