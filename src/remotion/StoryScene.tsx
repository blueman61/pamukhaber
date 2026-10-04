"use client";

import { Player } from "@remotion/player";
import { Scene } from "./Scene";
import { FPS, SCENE_H, SCENE_W, type SceneData } from "./scene-data";

/** Tarayıcıda canlı oynayan sahne. Kartı kaplar; 9:16 kompozisyon yanlardan hafifçe kırpılır. */
export default function StoryScene({ scene, playing = true }: { scene: SceneData; playing?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" data-scene-player>
      <div className="absolute top-1/2 left-1/2 h-full -translate-x-1/2 -translate-y-1/2" style={{ aspectRatio: `${SCENE_W} / ${SCENE_H}`, minWidth: "100%" }}>
        <Player
          component={Scene}
          inputProps={scene}
          durationInFrames={scene.durationInFrames}
          fps={FPS}
          compositionWidth={SCENE_W}
          compositionHeight={SCENE_H}
          loop
          autoPlay={playing}
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
