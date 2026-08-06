/**
 * Blocked Apps screen — pick installed Android packages to shield during focus.
 * Free-text fallback remains for iOS / Expo Go where the native picker is unavailable.
 */
import { ShieldMinimalistic } from "@solar-icons/react-native/Bold";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import {
  getInstalledApps,
  hasOverlayPermission,
  hasUsageStatsPermission,
  isAppShieldSupported,
  openOverlaySettings,
  openUsageAccessSettings,
  type InstalledAppInfo,
} from "lowalk-app-shield";
import {
  describeAppShieldBlocker,
  getAppShieldBlockersAsync,
  isRunningInExpoGo,
} from "@/lib/appShieldStatus";
import { BlockedAppIcon } from "@/components/BlockedAppIcon";
import { useBlockedAppIcons } from "@/hooks/useBlockedAppIcons";
import { useBlockedAppsRemovalLocked } from "@/hooks/useBlockedAppsRemovalLocked";
import { useModalAnimationType } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";

export default function BlockedAppsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const modalAnimationType = useModalAnimationType("slide");
  const apps = useBlockedAppsStore((state) => state.apps);
  const addApp = useBlockedAppsStore((state) => state.addApp);
  const addApps = useBlockedAppsStore((state) => state.addApps);
  const removeApp = useBlockedAppsStore((state) => state.removeApp);
  const iconsByPackage = useBlockedAppIcons(apps);
  const removalLocked = useBlockedAppsRemovalLocked();

  const shieldSupported = isAppShieldSupported() && !isRunningInExpoGo();
  const [draftName, setDraftName] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(() => new Set());
  const [usageGranted, setUsageGranted] = useState<boolean | null>(null);
  const [overlayGranted, setOverlayGranted] = useState<boolean | null>(null);
  const [shieldBlockers, setShieldBlockers] = useState<string[]>([]);

  const refreshPermissions = useCallback(async () => {
    if (!shieldSupported) {
      setUsageGranted(false);
      setOverlayGranted(false);
      return;
    }
    const [usage, overlay] = await Promise.all([
      hasUsageStatsPermission(),
      hasOverlayPermission(),
    ]);
    setUsageGranted(usage);
    setOverlayGranted(overlay);
  }, [shieldSupported]);

  const refreshShieldStatus = useCallback(async () => {
    const blockers = await getAppShieldBlockersAsync();
    setShieldBlockers(blockers.map(describeAppShieldBlocker));
    await refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    void refreshShieldStatus();
    const interval = setInterval(() => {
      void refreshShieldStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshShieldStatus]);

  useEffect(() => {
    if (!shieldSupported) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refreshShieldStatus();
      }
    });
    return () => sub.remove();
  }, [refreshShieldStatus, shieldSupported]);

  const blockedPackageNames = useMemo(
    () =>
      new Set(
        apps
          .map((app) => app.packageName?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    [apps],
  );

  const filteredInstalled = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q),
    );
  }, [installedApps, pickerQuery]);

  const pickerAddCount = useMemo(() => {
    let count = 0;
    for (const packageName of pickerSelected) {
      if (!blockedPackageNames.has(packageName)) count += 1;
    }
    return count;
  }, [blockedPackageNames, pickerSelected]);

  const handleAddManual = () => {
    if (!draftName.trim()) return;
    addApp({ name: draftName });
    setDraftName("");
  };

  const openPicker = async () => {
    setPickerVisible(true);
    setPickerLoading(true);
    setPickerQuery("");
    setPickerSelected(new Set());
    try {
      const list = await getInstalledApps();
      // Prefer user-installed apps first for distraction targeting.
      setInstalledApps(
        [...list].sort((a, b) => {
          if (a.isSystem !== b.isSystem) return a.isSystem ? 1 : -1;
          return a.name.localeCompare(b.name);
        }),
      );
    } finally {
      setPickerLoading(false);
    }
  };

  const togglePickerSelection = useCallback(
    (packageName: string) => {
      if (blockedPackageNames.has(packageName)) return;
      setPickerSelected((current) => {
        const next = new Set(current);
        if (next.has(packageName)) {
          next.delete(packageName);
        } else {
          next.add(packageName);
        }
        return next;
      });
    },
    [blockedPackageNames],
  );

  const handleConfirmPicker = () => {
    if (pickerAddCount === 0) return;

    const selectedApps = installedApps.filter(
      (app) =>
        pickerSelected.has(app.packageName) &&
        !blockedPackageNames.has(app.packageName),
    );

    addApps(
      selectedApps.map((app) => ({
        name: app.name,
        packageName: app.packageName,
      })),
    );
    setPickerVisible(false);
    setPickerSelected(new Set());
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerSelected(new Set());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader
          title="Blocked Apps"
          subtitle={
            shieldSupported
              ? "Shielded during active focus sessions on Android"
              : "Apps to shield during active focus sessions"
          }
        />

        {removalLocked ? (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 14,
              backgroundColor: "rgba(255, 119, 0, 0.1)",
              borderWidth: 1,
              borderColor: "rgba(255, 119, 0, 0.2)",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                lineHeight: 18,
                color: colors.foreground,
              }}
            >
              Focus is active
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: "Poppins-Regular",
                fontSize: 12,
                lineHeight: 17,
                color: colors.muted,
              }}
            >
              You can still add apps to your block list. Removals unlock when this session ends.
            </Text>
          </View>
        ) : null}

        {shieldBlockers.length > 0 ? (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 14,
              backgroundColor: "rgba(255, 119, 0, 0.1)",
              borderWidth: 1,
              borderColor: "rgba(255, 119, 0, 0.2)",
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 13,
                lineHeight: 18,
                color: colors.foreground,
              }}
            >
              App blocking unavailable
            </Text>
            {shieldBlockers.map((message) => (
              <Text
                key={message}
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors.muted,
                }}
              >
                {message}
              </Text>
            ))}
          </View>
        ) : null}

        {shieldSupported ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pick installed apps"
              onPress={() => void openPicker()}
              style={({ pressed }) => ({
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 15,
                  color: "#F0EDE9",
                }}
              >
                Pick installed apps
              </Text>
            </Pressable>

            <View
              style={{
                borderRadius: 16,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors.muted,
                }}
              >
                Usage Access detects blocked apps. Display over other apps lets Lowalk cover them with the focus shield.
              </Text>

              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.foreground,
                }}
              >
                Usage access:{" "}
                {usageGranted == null
                  ? "checking…"
                  : usageGranted
                    ? "granted"
                    : "required"}
              </Text>
              {usageGranted === false ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void openUsageAccessSettings().then(() => {
                      setTimeout(() => void refreshPermissions(), 800);
                    });
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 13,
                      color: colors.primary,
                    }}
                  >
                    Open Usage Access settings
                  </Text>
                </Pressable>
              ) : null}

              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.foreground,
                  marginTop: 4,
                }}
              >
                Display over other apps:{" "}
                {overlayGranted == null
                  ? "checking…"
                  : overlayGranted
                    ? "granted"
                    : "required"}
              </Text>
              {overlayGranted === false ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void openOverlaySettings().then(() => {
                      setTimeout(() => void refreshPermissions(), 800);
                    });
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 13,
                      color: colors.primary,
                    }}
                  >
                    Open Display over other apps settings
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text
              style={{
                marginBottom: 10,
                fontFamily: "Poppins-SemiBold",
                fontSize: 11,
                lineHeight: 14,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: colors.muted,
              }}
            >
              Add app
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                accessibilityLabel="App name"
                placeholder="e.g. Instagram"
                placeholderTextColor={colors.muted}
                value={draftName}
                onChangeText={setDraftName}
                onSubmitEditing={handleAddManual}
                returnKeyType="done"
                style={{
                  flex: 1,
                  fontFamily: "Poppins-Regular",
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.foreground,
                  borderRadius: 14,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add blocked app"
                onPress={handleAddManual}
                disabled={!draftName.trim()}
                style={({ pressed }) => ({
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 18,
                  opacity: !draftName.trim() ? 0.45 : pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 15,
                    lineHeight: 20,
                    color: "#F0EDE9",
                  }}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text
            style={{
              marginBottom: 10,
              fontFamily: "Poppins-SemiBold",
              fontSize: 11,
              lineHeight: 14,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: colors.muted,
            }}
          >
            Your list ({apps.length})
          </Text>

          {apps.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 32,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                }}
              >
                <ShieldMinimalistic size={24} color={colors.primary} />
              </View>
              <Text
                style={{
                  marginTop: 12,
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.foreground,
                  textAlign: "center",
                }}
              >
                No apps blocked yet
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                  textAlign: "center",
                }}
              >
                {shieldSupported
                  ? "Pick installed apps above. During an active session, opening one covers that app with the focus shield."
                  : "Add distracting apps above. Native shielding is available on Android preview builds."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={apps}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 16,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <BlockedAppIcon
                    iconUri={item.packageName ? iconsByPackage[item.packageName] : null}
                    size={36}
                    radius={10}
                  />

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontFamily: "Poppins-SemiBold",
                        fontSize: 15,
                        lineHeight: 20,
                        color: colors.foreground,
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.packageName ? (
                      <Text
                        style={{
                          marginTop: 2,
                          fontFamily: "Poppins-Regular",
                          fontSize: 11,
                          color: colors.muted,
                        }}
                        numberOfLines={1}
                      >
                        {item.packageName}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          marginTop: 2,
                          fontFamily: "Poppins-Regular",
                          fontSize: 11,
                          color: colors.muted,
                        }}
                      >
                        No package ID — re-pick on Android to enforce
                      </Text>
                    )}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name}`}
                    disabled={removalLocked}
                    onPress={() => removeApp(item.id)}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      opacity: removalLocked ? 0.35 : pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={removalLocked ? colors.border : colors.muted}
                    />
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} animationType={modalAnimationType} onRequestClose={closePicker}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Pressable onPress={closePicker} hitSlop={8} accessibilityLabel="Close picker">
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontFamily: "Poppins-Bold",
                fontSize: 18,
                color: colors.foreground,
              }}
            >
              Choose apps
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <TextInput
              placeholder="Search apps"
              placeholderTextColor={colors.muted}
              value={pickerQuery}
              onChangeText={setPickerQuery}
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 15,
                color: colors.foreground,
                borderRadius: 14,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            />
          </View>

          {pickerLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={filteredInstalled}
              keyExtractor={(item) => item.packageName}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const alreadyBlocked = blockedPackageNames.has(item.packageName);
                const selected = pickerSelected.has(item.packageName);
                const selectionIcon = alreadyBlocked
                  ? "checkmark-circle"
                  : selected
                    ? "checkmark-circle"
                    : "ellipse-outline";
                const selectionColor = alreadyBlocked
                  ? colors.muted
                  : selected
                    ? colors.primary
                    : colors.border;

                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: alreadyBlocked || selected,
                      disabled: alreadyBlocked,
                    }}
                    accessibilityLabel={
                      alreadyBlocked ? `${item.name}, already blocked` : item.name
                    }
                    disabled={alreadyBlocked}
                    onPress={() => togglePickerSelection(item.packageName)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 14,
                      backgroundColor: colors.background,
                      borderWidth: 1,
                      borderColor: selected && !alreadyBlocked ? colors.primary : colors.border,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      opacity: alreadyBlocked ? 0.55 : pressed ? 0.85 : 1,
                      gap: 12,
                    })}
                  >
                    <BlockedAppIcon iconUri={item.iconUri} size={40} radius={10} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Poppins-SemiBold",
                          fontSize: 15,
                          color: colors.foreground,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontFamily: "Poppins-Regular",
                          fontSize: 11,
                          color: colors.muted,
                        }}
                        numberOfLines={1}
                      >
                        {alreadyBlocked ? "Already blocked" : item.packageName}
                      </Text>
                    </View>
                    <Ionicons name={selectionIcon} size={24} color={selectionColor} />
                  </Pressable>
                );
              }}
            />
          )}

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                pickerAddCount > 0 ? `Add ${pickerAddCount} apps` : "Add selected apps"
              }
              disabled={pickerAddCount === 0}
              onPress={handleConfirmPicker}
              style={({ pressed }) => ({
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pickerAddCount === 0 ? 0.45 : pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 15,
                  color: "#F0EDE9",
                }}
              >
                {pickerAddCount > 0 ? `Add ${pickerAddCount} apps` : "Add apps"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
