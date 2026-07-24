import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(
  root,
  "patches/react-native-vision-camera-v3-pose-detection/VisionCameraV3PoseDetectionModule.kt",
);
const target = path.join(
  root,
  "node_modules/react-native-vision-camera-v3-pose-detection/android/src/main/java/com/visioncamerav3posedetection/VisionCameraV3PoseDetectionModule.kt",
);

if (!existsSync(source)) {
  console.warn("[patch-pose-detection] Source patch file missing — skipping.");
  process.exit(0);
}

mkdirSync(path.dirname(target), { recursive: true });
copyFileSync(source, target);
console.log("[patch-pose-detection] Applied VisionCamera v4 compatibility patch.");
