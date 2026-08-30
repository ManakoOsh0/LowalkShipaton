import * as WebBrowser from "expo-web-browser";
import { Alert, Linking } from "react-native";

export async function openUrl(url: string, failureTitle = "Could not open link"): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(failureTitle, "This link is not available on your device.");
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(failureTitle, "Try again in a moment.");
  }
}

export async function openInAppBrowser(url: string, failureTitle = "Could not open page"): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert(failureTitle, "Try again in a moment.");
  }
}

export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert("Could not open Settings", "Open Lowalk in your device Settings app manually.");
  }
}
