/**
 * Blocked Apps screen — pick installed Android packages to shield during focus.
 * Free-text fallback remains for iOS / Expo Go where the native picker is unavailable.
 */
import { ShieldMinimalistic } from "@solar-icons/react-native/Bold";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import {
  getInstalledApps,
  hasUsageStatsPermission,
  isAppShieldSupported,
  openUsageAccessSettings,
  type InstalledAppInfo,
} from "lowalk-app-shield";
import { BlockedAppIcon } from "@/components/BlockedAppIcon";
import { useBlockedAppIcons } from "@/hooks/useBlockedAppIcons";
import { useBlockedAppsEditingLocked } from "@/hooks/useBlockedAppsEditingLocked";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";

export default function BlockedAppsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const apps = useBlockedAppsStore((state) => state.apps);
  const addApp = useBlockedAppsStore((state) => state.addApp);
  const removeApp = useBlockedAppsStore((state) => state.removeApp);
  const iconsByPackage = useBlockedAppIcons(apps);
  const editingLocked = useBlockedAppsEditingLocked();

  const shieldSupported = isAppShieldSupported();
  const [draftName, setDraftName] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [usageGranted, setUsageGranted] = useState<boolean | null>(null);

  const refreshPermissions = useCallback(async () => {
    if (!shieldSupported) {
      setUsageGranted(false);
      return;
    }
    const usage = await hasUsageStatsPermission();
    setUsageGranted(usage);
  }, [shieldSupported]);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  const openPicker = async () => {
    setPickerVisible(true);
    setPickerLoading(true);
    setPickerQuery("");
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

  const filteredInstalled = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return installedApps;
    return installedApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q),
    );
  }, [installedApps, pickerQuery]);

  const handleAddManual = () => {
    if (editingLocked || !draftName.trim()) return;
    addApp({ name: draftName });
    setDraftName("");
  };

  const handlePickApp = (app: InstalledAppInfo) => {
    if (editingLocked) return;
    addApp({ name: app.name, packageName: app.packageName });
    setPickerVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 24,
                lineHeight: 32,
                color: colors.foreground,
              }}
            >
              Blocked Apps
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              {shieldSupported
                ? "Shielded during active focus sessions on Android"
                : "Apps to shield during active focus sessions"}
            </Text>
          </View>
        </View>

        {editingLocked ? (
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
              List locked during active focus
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
              You can view blocked apps, but cannot add or remove them until your session ends.
            </Text>
          </View>
        ) : null}

        {shieldSupported ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pick installed app"
              disabled={editingLocked}
              onPress={() => void openPicker()}
              style={({ pressed }) => ({
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                alignItems: "center",
                opacity: editingLocked ? 0.45 : pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 15,
                  color: "#F0EDE9",
                }}
              >
                Pick installed app
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
                Usage Access is required. Lowalk opens a full-screen shield when a blocked app is detected.
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
                disabled={editingLocked || !draftName.trim()}
                style={({ pressed }) => ({
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 18,
                  opacity: editingLocked || !draftName.trim() ? 0.45 : pressed ? 0.85 : 1,
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
                    disabled={editingLocked}
                    onPress={() => removeApp(item.id)}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      opacity: editingLocked ? 0.35 : pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={editingLocked ? colors.border : colors.muted}
                    />
                  </Pressable>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 12,
            }}
          >
            <Pressable onPress={() => setPickerVisible(false)} hitSlop={8}>
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
              Choose an app
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
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePickApp(item)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    borderRadius: 14,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    opacity: pressed ? 0.85 : 1,
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
                      {item.packageName}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
