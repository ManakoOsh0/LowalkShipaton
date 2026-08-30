/**
 * ScheduleItemActionSheet — long-press menu for editing or deleting a Focus Node.
 * Uses the shared BottomSheet shell so actions match the rest of the app.
 */
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { BottomSheet } from "@/components/BottomSheet";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { sheetStepEntering, sheetStepExiting } from "@/lib/heroMotion";
import type { FocusNodeRemovalLockReason } from "@/lib/sessionPenalty";
import type { ScheduleItem } from "@/types/dashboard";

export type ScheduleItemActionSheetProps = {
  item: ScheduleItem | null;
  deleteLockReason?: FocusNodeRemovalLockReason | null;
  onClose: () => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
};

function getDeleteLockCopy(reason: FocusNodeRemovalLockReason): {
  label: string;
  hint: string;
} {
  if (reason === "penalty") {
    return {
      label: "Can't delete during penalty",
      hint: "This session stays on your schedule until the extra app lock ends.",
    };
  }

  return {
    label: "Can't delete active session",
    hint: "Finish this session before removing it from your schedule.",
  };
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: "default" | "destructive";
  showDivider?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function ActionRow({
  icon,
  label,
  tone = "default",
  showDivider = false,
  disabled = false,
  onPress,
}: ActionRowProps) {
  const colors = useThemeColors();
  const isDestructive = tone === "destructive";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.72 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 4,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            borderCurve: "continuous",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDestructive ? `${colors.error}1A` : colors.surface,
            borderWidth: 1,
            borderColor: isDestructive ? `${colors.error}44` : colors.cardStroke,
          }}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isDestructive ? colors.error : colors.foreground}
          />
        </View>

        <Text
          style={{
            flex: 1,
            fontFamily: "Poppins-SemiBold",
            fontSize: 16,
            lineHeight: 22,
            color: isDestructive ? colors.error : colors.foreground,
          }}
        >
          {label}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDestructive ? colors.error : colors.muted}
        />
      </View>
    </Pressable>
  );
}

function ActionsContent({
  item,
  deleteLockReason,
  onEdit,
  onRequestDelete,
  onCancel,
}: {
  item: ScheduleItem;
  deleteLockReason: FocusNodeRemovalLockReason | null;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancel: () => void;
}) {
  const colors = useThemeColors();
  const deleteLocked = deleteLockReason != null;
  const deleteCopy = deleteLockReason ? getDeleteLockCopy(deleteLockReason) : null;

  return (
    <View style={{ gap: 16, paddingBottom: 4 }}>
      <View style={{ gap: 4, paddingHorizontal: 4 }}>
        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 20,
            lineHeight: 26,
            color: colors.foreground,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: 14,
            lineHeight: 20,
            color: colors.muted,
          }}
        >
          {item.locationLabel} · {item.timeLabel}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 16,
          borderCurve: "continuous",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.cardStroke,
          paddingHorizontal: 12,
        }}
      >
        <ActionRow icon="pencil-outline" label="Edit schedule" onPress={onEdit} showDivider />
        <ActionRow
          icon="trash-outline"
          label={deleteCopy?.label ?? "Delete schedule"}
          tone="destructive"
          disabled={deleteLocked}
          onPress={onRequestDelete}
        />
      </View>

      {deleteCopy ? (
        <Text
          style={{
            paddingHorizontal: 4,
            fontFamily: "Poppins-Regular",
            fontSize: 13,
            lineHeight: 18,
            color: colors.muted,
          }}
        >
          {deleteCopy.hint}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={onCancel}
        style={({ pressed }) => ({
          alignItems: "center",
          paddingVertical: 14,
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 16,
            lineHeight: 22,
            color: colors.foregroundSubtle,
          }}
        >
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}

function ConfirmDeleteContent({
  item,
  onConfirm,
  onBack,
}: {
  item: ScheduleItem;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 20, paddingBottom: 4 }}>
      <View style={{ alignItems: "center", gap: 12, paddingHorizontal: 8 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${colors.error}1A`,
          }}
        >
          <Ionicons name="trash-outline" size={28} color={colors.error} />
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 20,
              lineHeight: 26,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            Delete schedule?
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              lineHeight: 22,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            {`"${item.title}" will be removed from your recurring schedule. This can't be undone.`}
          </Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete schedule"
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onConfirm();
          }}
          style={({ pressed }) => ({
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: colors.error,
            paddingVertical: 15,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 16,
              lineHeight: 22,
              color: "#FFFFFF",
            }}
          >
            Delete schedule
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keep schedule"
          onPress={onBack}
          style={({ pressed }) => ({
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            borderCurve: "continuous",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.cardStroke,
            paddingVertical: 15,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 16,
              lineHeight: 22,
              color: colors.foreground,
            }}
          >
            Keep schedule
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ScheduleItemActionSheet({
  item,
  deleteLockReason = null,
  onClose,
  onEdit,
  onDelete,
}: ScheduleItemActionSheetProps) {
  const [step, setStep] = useState<"actions" | "confirm">("actions");
  const reduceMotion = useReduceMotion();
  const deleteLocked = deleteLockReason != null;

  useEffect(() => {
    if (!item) {
      setStep("actions");
    }
  }, [item]);

  useEffect(() => {
    if (deleteLocked) {
      setStep("actions");
    }
  }, [deleteLocked]);

  const handleClose = () => {
    setStep("actions");
    onClose();
  };

  return (
    <BottomSheet visible={item != null} onClose={handleClose}>
      {item ? (
        <Animated.View
          key={step}
          entering={sheetStepEntering(reduceMotion)}
          exiting={sheetStepExiting(reduceMotion)}
        >
          {step === "actions" ? (
            <ActionsContent
              item={item}
              deleteLockReason={deleteLockReason}
              onEdit={() => {
                onEdit(item);
                handleClose();
              }}
              onRequestDelete={() => {
                if (deleteLocked) return;
                setStep("confirm");
              }}
              onCancel={handleClose}
            />
          ) : (
            <ConfirmDeleteContent
              item={item}
              onConfirm={() => {
                if (deleteLocked) {
                  setStep("actions");
                  return;
                }
                onDelete(item);
                handleClose();
              }}
              onBack={() => setStep("actions")}
            />
          )}
        </Animated.View>
      ) : null}
    </BottomSheet>
  );
}
