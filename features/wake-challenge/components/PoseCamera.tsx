import { useCallback } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { Camera as PoseDetectionCamera } from "react-native-vision-camera-v3-pose-detection";

import type { RawPosePayload } from "@/features/wake-challenge/types";

type PoseCameraProps = {
  isActive: boolean;
  onPoseDetected: (payload: RawPosePayload) => void;
};

/**
 * Back-camera preview with on-device ML Kit pose streaming.
 * Scoped to the wake challenge — does not replace any other camera usage.
 */
export function PoseCamera({ isActive, onPoseDetected }: PoseCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  const handlePose = useCallback(
    (payload: RawPosePayload) => {
      onPoseDetected(payload);
    },
    [onPoseDetected],
  );

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <Text style={styles.permissionBody}>
          Lowalk uses the camera to count push-ups. Video is processed on your device and is not
          recorded or uploaded.
        </Text>
        <Pressable accessibilityRole="button" onPress={() => void requestPermission()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>No camera available</Text>
        <Text style={styles.permissionBody}>Connect a device with a rear camera to continue.</Text>
      </View>
    );
  }

  return (
    <PoseDetectionCamera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      photo={false}
      video={false}
      audio={false}
      options={{
        mode: "stream",
        performanceMode: "max",
      }}
      callback={handlePose}
    />
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#000",
  },
  permissionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 20,
    color: "#fff",
    textAlign: "center",
  },
  permissionBody: {
    marginTop: 12,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: "#FF7700",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#141210",
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
});
