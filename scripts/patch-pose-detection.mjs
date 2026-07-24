import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patchDir = path.join(root, "patches/react-native-vision-camera-v3-pose-detection");
const targetDir = path.join(
  root,
  "node_modules/react-native-vision-camera-v3-pose-detection/android/src/main/java/com/visioncamerav3posedetection",
);

const files = [
  "VisionCameraV3PoseDetectionModule.kt",
  "VisionCameraV3PoseDetectionPackage.kt",
];

for (const file of files) {
  const source = path.join(patchDir, file);
  const target = path.join(targetDir, file);

  if (!existsSync(source)) {
    console.warn(`[patch-pose-detection] Source patch file missing: ${file} — skipping.`);
    continue;
  }

  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(source, target);
}

console.log("[patch-pose-detection] Applied VisionCamera v4 compatibility patch.");
