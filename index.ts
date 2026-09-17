import "@expo/metro-runtime";

import { App } from "expo-router/build/qualified-entry";
import { renderRootComponent } from "expo-router/build/renderRootComponent";
import { LogBox } from "react-native";

// Expo dev tools auto-enable keep-awake; activation can fail harmlessly if the
// screen locks while the JS bundle loads (expo/expo#23390).
if (__DEV__) {
  LogBox.ignoreLogs(["Unable to activate keep awake"]);

  const keepAwakeNoise = "Unable to activate keep awake";
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (
      (typeof first === "string" && first.includes(keepAwakeNoise)) ||
      (first instanceof Error && first.message.includes(keepAwakeNoise))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

renderRootComponent(App);
