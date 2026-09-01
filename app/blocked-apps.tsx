/**
 * Blocked Apps screen — pick installed Android packages to shield during focus.
 * Free-text fallback remains for iOS / Expo Go where the native picker is unavailable.
 */
import { ShieldMinimalistic } from "@solar-icons/react-native/Bold";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppState,
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

import { BlockedAppIcon } from "@/components/BlockedAppIcon";
import { FormSectionCard } from "@/components/form/FormSectionCard";
import { PressableScale } from "@/components/PressableScale";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionLabel } from "@/components/SectionLabel";
import { AppListSkeleton } from "@/components/skeleton/AppListSkeleton";
import { useBlockedAppIcons } from "@/hooks/useBlockedAppIcons";
import { useBlockedAppsRemovalLocked } from "@/hooks/useBlockedAppsRemovalLocked";
import { usePenaltyShieldActive } from "@/hooks/usePenaltyShieldActive";
import { useModalAnimationType } from "@/hooks/useHeroMotion";
import { useBlockedAppsHydrated } from "@/hooks/usePersistedStoreHydration";
import { useRequiredPermissions } from "@/hooks/useRequiredPermissions";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
  describeAppShieldBlocker,
  getAppShieldBlockersAsync,
  isRunningInExpoGo,
} from "@/lib/appShieldStatus";
import { SCREEN_PADDING } from "@/lib/layout";
import { requestOrOpenPermission } from "@/lib/requiredPermissions";
import { useBlockedAppsStore } from "@/store/useBlockedAppsStore";
import {
  getInstalledApps,
  isAppShieldSupported,
  type InstalledAppInfo,
} from "lowalk-app-shield";

export default function BlockedAppsScreen() {
  const colors = useThemeColors();
  const modalAnimationType = useModalAnimationType("slide");
  const apps = useBlockedAppsStore((state) => state.apps);
  const appsReady = useBlockedAppsHydrated();
  const addApp = useBlockedAppsStore((state) => state.addApp);
  const addApps = useBlockedAppsStore((state) => state.addApps);
  const removeApp = useBlockedAppsStore((state) => state.removeApp);
  const iconsByPackage = useBlockedAppIcons(apps);
  const removalLocked = useBlockedAppsRemovalLocked();
  const penaltyLocked = usePenaltyShieldActive();
  const { checks: permissionChecks } = useRequiredPermissions();

  const shieldSupported = isAppShieldSupported() && !isRunningInExpoGo();
  const [draftName, setDraftName] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledAppInfo[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(() => new Set());
  const [shieldBlockers, setShieldBlockers] = useState<string[]>([]);

  const missingShieldPermissions = useMemo(
    () =>
      permissionChecks.filter(
        (check) =>
          (check.id === "usageAccess" || check.id === "overlay") &&
          check.applicable &&
          !check.granted,
      ),
    [permissionChecks],
  );

  const refreshShieldBlockers = useCallback(async () => {
    const blockers = await getAppShieldBlockersAsync();
    setShieldBlockers(blockers.map(describeAppShieldBlocker));
  }, []);

  useEffect(() => {
    void refreshShieldBlockers();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshShieldBlockers();
    });
    return () => sub.remove();
  }, [refreshShieldBlockers]);

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

  const handleRemoveApp = (id: string) => {
    if (removalLocked) {
      Alert.alert(
        penaltyLocked ? "Can't remove during a penalty" : "Can't remove during focus",
        penaltyLocked
          ? "Blocked apps stay locked until the extra lock time ends."
          : "Blocked apps stay locked until this session ends.",
      );
      return;
    }
    removeApp(id);
  };

  const listHeader = (
    <View style={{ gap: 16, paddingBottom: 12 }}>
      {removalLocked ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderRadius: 12,
            backgroundColor: "rgba(255, 119, 0, 0.08)",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Ionicons name="lock-closed" size={16} color={colors.primary} />
          <Text
            style={{
              flex: 1,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            {penaltyLocked
              ? "Removals unlock when the penalty ends."
              : "Removals unlock when this session ends."}
          </Text>
        </View>
      ) : null}

      {shieldBlockers.length > 0 ? (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: "rgba(255, 119, 0, 0.08)",
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 4,
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
            Blocking unavailable
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 12,
              lineHeight: 17,
              color: colors.muted,
            }}
          >
            {shieldBlockers[0]}
          </Text>
        </View>
      ) : null}

      {shieldSupported && missingShieldPermissions.length > 0 ? (
        <FormSectionCard title="Setup needed">
          {missingShieldPermissions.map((check, index) => (
            <Pressable
              key={check.id}
              accessibilityRole="button"
              accessibilityLabel={`${check.title}, needed`}
              onPress={() => {
                void requestOrOpenPermission(check.id);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: index < missingShieldPermissions.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                gap: 12,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.foreground,
                }}
              >
                {check.title}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: colors.primary,
                }}
              >
                Allow
              </Text>
            </Pressable>
          ))}
        </FormSectionCard>
      ) : null}

      {!shieldSupported ? (
        <View style={{ gap: 10 }}>
          <SectionLabel>Add app</SectionLabel>
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
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Add blocked app"
              onPress={handleAddManual}
              disabled={!draftName.trim()}
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingHorizontal: 18,
                opacity: !draftName.trim() ? 0.45 : 1,
              }}
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
            </PressableScale>
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <SectionLabel style={{ marginBottom: 0 }}>
          {appsReady ? `Blocked (${apps.length})` : "Blocked"}
        </SectionLabel>

        {shieldSupported && appsReady && apps.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add apps"
            onPress={() => void openPicker()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
          >
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.primary,
              }}
            >
              + Add apps
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const listEmpty = !appsReady ? (
    <AppListSkeleton rows={5} label="Loading blocked apps" />
  ) : apps.length === 0 ? (
    <View
      style={{
        alignItems: "center",
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 28,
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          backgroundColor: colors.surface,
        }}
      >
        <ShieldMinimalistic size={22} color={colors.primary} />
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
          marginTop: 4,
          fontFamily: "Poppins-Regular",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
          textAlign: "center",
        }}
      >
        {shieldSupported
          ? "These apps get covered by the focus shield during sessions."
          : "Add distracting apps. Native shielding works on Android builds."}
      </Text>

      {shieldSupported ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add apps"
          onPress={() => void openPicker()}
          haptic
          style={{
            marginTop: 16,
            borderRadius: 14,
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 15,
              color: "#F0EDE9",
            }}
          >
            Add apps
          </Text>
        </PressableScale>
      ) : null}
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader title="Blocked Apps" />

        <FlatList
          data={appsReady && apps.length > 0 ? apps : []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SCREEN_PADDING,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 14,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 11,
              }}
            >
              <BlockedAppIcon
                iconUri={item.packageName ? iconsByPackage[item.packageName] : null}
                size={36}
                radius={10}
              />

              <Text
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.foreground,
                }}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  removalLocked
                    ? `Can't remove ${item.name} during ${penaltyLocked ? "a penalty" : "focus"}`
                    : `Remove ${item.name}`
                }
                accessibilityState={{ disabled: removalLocked }}
                onPress={() => handleRemoveApp(item.id)}
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
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              <AppListSkeleton rows={8} label="Loading installed apps" />
            </View>
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
                      {alreadyBlocked ? (
                        <Text
                          style={{
                            marginTop: 2,
                            fontFamily: "Poppins-Regular",
                            fontSize: 11,
                            color: colors.muted,
                          }}
                        >
                          Already blocked
                        </Text>
                      ) : null}
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
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={
                pickerAddCount > 0 ? `Add ${pickerAddCount} apps` : "Add selected apps"
              }
              disabled={pickerAddCount === 0}
              onPress={handleConfirmPicker}
              haptic
              style={{
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pickerAddCount === 0 ? 0.45 : 1,
              }}
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
            </PressableScale>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
