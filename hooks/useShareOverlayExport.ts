import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useCallback, useRef, useState } from "react";
import { Alert, Platform, View } from "react-native";

import { SHARE_EXPORT_HEIGHT, SHARE_EXPORT_WIDTH } from "@/lib/shareOverlay";

export function useShareOverlayExport() {
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<View>(null);

  const pickPhoto = useCallback(async (): Promise<string | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photos access needed",
        "Allow photo library access to add a background image to your share card.",
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) return null;
    return result.assets[0].uri;
  }, []);

  const captureImage = useCallback(async (): Promise<string | null> => {
    if (!exportRef.current) return null;
    try {
      const { captureRef } = await import("react-native-view-shot");
      return await captureRef(exportRef, {
        format: "png",
        quality: 1,
        width: SHARE_EXPORT_WIDTH,
        height: SHARE_EXPORT_HEIGHT,
      });
    } catch {
      Alert.alert(
        "Export unavailable",
        "Image export needs a development build. Use Settings → Preview share templates to browse overlays in Expo Go.",
      );
      return null;
    }
  }, []);

  const shareImage = useCallback(async () => {
    setIsExporting(true);
    try {
      const uri = await captureImage();
      if (!uri) return;

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing unavailable", "Sharing is not supported on this device.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your focus session",
        UTI: "public.png",
      });
    } finally {
      setIsExporting(false);
    }
  }, [captureImage]);

  const saveImage = useCallback(async () => {
    setIsExporting(true);
    try {
      const uri = await captureImage();
      if (!uri) return;

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photos access needed",
          "Allow photo library access to save your share card.",
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "Your share card was saved to your photo library.");
    } finally {
      setIsExporting(false);
    }
  }, [captureImage]);

  return {
    exportRef,
    isExporting,
    pickPhoto,
    shareImage,
    saveImage,
    supportsSave: Platform.OS !== "web",
  };
}
