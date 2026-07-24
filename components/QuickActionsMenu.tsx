/**
 * Quick Actions popover — preset Focus Node templates from the center FAB.
 * Renders as a floating tray above the tab bar, not a navigable screen.
 */
import * as Haptics from "expo-haptics";
import { ComponentType } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";

import { quickActionTemplates, type QuickActionId } from "@/data/quickActions";
import { NeuCard } from "@/components/NeuCard";
import { ICON_TILE_RADIUS_SM } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { IconProps } from "@solar-icons/react-native/lib/types";

const MENU_WIDTH = 248;
const ICON_BADGE_SIZE = 36;

type QuickActionsMenuProps = {
  visible: boolean;
  bottomOffset: number;
  onClose: () => void;
  onSelect: (actionId: QuickActionId) => void;
  disabledActionIds?: QuickActionId[];
};

type QuickActionRowProps = {
  label: string;
  accent: string;
  tint: string;
  Icon: ComponentType<IconProps>;
  showDivider: boolean;
  dividerColor: string;
  foregroundColor: string;
  disabled?: boolean;
  onPress: () => void;
};

function QuickActionRow({
  label,
  accent,
  tint,
  Icon,
  showDivider,
  dividerColor,
  foregroundColor,
  disabled = false,
  onPress,
}: QuickActionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.72 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: dividerColor,
        }}
      >
        <View
          style={{
            width: ICON_BADGE_SIZE,
            height: ICON_BADGE_SIZE,
            borderRadius: ICON_TILE_RADIUS_SM,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tint,
          }}
        >
          <Icon size={20} color={accent} />
        </View>

        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            fontFamily: "Poppins-SemiBold",
            fontSize: 15,
            lineHeight: 20,
            color: foregroundColor,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function QuickActionsMenu({
  visible,
  bottomOffset,
  onClose,
  onSelect,
  disabledActionIds = [],
}: QuickActionsMenuProps) {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get("window").width;
  const menuLeft = (screenWidth - MENU_WIDTH) / 2;
  const overlayColor = "rgba(0, 0, 0, 0.55)";

  const handleSelect = (actionId: QuickActionId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(actionId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: overlayColor,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close quick actions"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View
          entering={ZoomIn.duration(180).springify().damping(18).stiffness(260)}
          exiting={ZoomOut.duration(120)}
          style={{
            position: "absolute",
            left: menuLeft,
            bottom: bottomOffset,
            width: MENU_WIDTH,
          }}
        >
          <NeuCard borderRadius={16} shadowVariant="md" contentStyle={{ overflow: "hidden" }}>
          {quickActionTemplates.map((action, index) => (
            <QuickActionRow
              key={action.id}
              label={action.label}
              accent={action.accent}
              tint={action.tint}
              Icon={action.Icon}
              showDivider={index < quickActionTemplates.length - 1}
              dividerColor={colors.border}
              foregroundColor={colors.foreground}
              disabled={disabledActionIds.includes(action.id)}
              onPress={() => handleSelect(action.id)}
            />
          ))}
          </NeuCard>
        </Animated.View>
      </View>
    </Modal>
  );
}
