/**
 * Custom bottom tab bar — flat card-toned bar with a centred quick-action FAB.
 */
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { HomeSmile, Settings } from "@solar-icons/react-native/Bold";
import {
  HomeSmile as HomeSmileDuotone,
  Settings as SettingsDuotone,
} from "@solar-icons/react-native/BoldDuotone";
import { useRouter } from "expo-router";
import { ComponentType, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuickActionHourglassIcon } from "@/components/QuickActionHourglassIcon";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import type { QuickActionId } from "@/data/quickActions";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ROUTES } from "@/lib/routes";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const FAB_COLOR = "#FF8A3D";
const BAR_BODY_HEIGHT = 62;
const FAB_SIZE = 64;
const TAB_ICON_SIZE = 30;
const CENTER_GAP = FAB_SIZE + 28;
/** How far the FAB centre sits below the bar's top edge. */
const FAB_NESTLE = 14;
/** Extra nudge downward without changing bar height. */
const FAB_OFFSET_DOWN = 8;
const MENU_GAP_ABOVE_FAB = 14;
/** Hourglass tilt when the quick-actions menu is open. */
const FAB_ICON_TILT_DEG = 45;

type TabRoute = {
  routeName: string;
  label: string;
  ActiveIcon: ComponentType<IconProps>;
  InactiveIcon: ComponentType<IconProps>;
};

const HOME_TAB: TabRoute = {
  routeName: "index",
  label: "Home",
  ActiveIcon: HomeSmile,
  InactiveIcon: HomeSmileDuotone,
};

const SETTINGS_TAB: TabRoute = {
  routeName: "settings",
  label: "Settings",
  ActiveIcon: Settings,
  InactiveIcon: SettingsDuotone,
};

function TabButton({
  slot,
  isFocused,
  onPress,
}: {
  slot: TabRoute;
  isFocused: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const InactiveIcon = slot.InactiveIcon;
  const ActiveIcon = slot.ActiveIcon;
  const labelColor = isFocused ? colors.foreground : colors.muted;
  const iconColor = isFocused ? colors.foreground : colors.muted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={slot.label}
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {isFocused ? (
        <ActiveIcon size={TAB_ICON_SIZE} color={iconColor} />
      ) : (
        <InactiveIcon size={TAB_ICON_SIZE} color={iconColor} />
      )}

      <Text
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: 12,
          lineHeight: 15,
          color: labelColor,
        }}
      >
        {slot.label}
      </Text>
    </Pressable>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomPad = Math.max(insets.bottom, 10);
  const fabLift = FAB_SIZE / 2 - FAB_NESTLE;
  const innerHeight = BAR_BODY_HEIGHT + fabLift;
  const menuBottomOffset = bottomPad + innerHeight + MENU_GAP_ABOVE_FAB;

  const handleQuickActionSelect = (actionId: QuickActionId) => {
    setMenuOpen(false);
    if (actionId === "blocked-apps") {
      router.push(ROUTES.blockedApps);
      return;
    }
    router.push(ROUTES.focusNodeNewWithTemplate(actionId));
  };

  const renderTab = (slot: TabRoute) => {
    const routeIndex = state.routes.findIndex((route) => route.name === slot.routeName);
    const route = state.routes[routeIndex];
    if (!route) return null;

    return (
      <TabButton
        key={route.key}
        slot={slot}
        isFocused={state.index === routeIndex}
        onPress={() => {
          setMenuOpen(false);
          navigation.navigate(slot.routeName);
        }}
      />
    );
  };

  return (
    <>
      <QuickActionsMenu
        visible={menuOpen}
        bottomOffset={menuBottomOffset}
        onClose={() => setMenuOpen(false)}
        onSelect={handleQuickActionSelect}
      />

      <View
        style={{
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.cardStroke,
          paddingBottom: bottomPad,
        }}
      >
        <View style={{ height: innerHeight }}>
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: BAR_BODY_HEIGHT,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {renderTab(HOME_TAB)}
            <View style={{ width: CENTER_GAP }} />
            {renderTab(SETTINGS_TAB)}
          </View>

          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: fabLift + FAB_NESTLE - FAB_SIZE / 2 + FAB_OFFSET_DOWN,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quick actions"
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => setMenuOpen((open) => !open)}
              style={({ pressed }) => ({
                width: FAB_SIZE,
                height: FAB_SIZE,
                borderRadius: FAB_SIZE / 2,
                borderCurve: "continuous",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.card,
                borderWidth: 2.5,
                borderColor: FAB_COLOR,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <View
                style={{
                  transform: [
                    { rotate: menuOpen ? `${FAB_ICON_TILT_DEG}deg` : "0deg" },
                  ],
                }}
              >
                <QuickActionHourglassIcon size={30} color={FAB_COLOR} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}
