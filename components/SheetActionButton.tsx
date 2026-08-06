/**
 * SheetActionButton — primary/secondary CTA with haptics and press feedback for bottom sheets.
 */
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { DawnPathPillFrame } from "@/components/DawnPathPillFrame";
import { CARD_RADIUS_SM } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";

const SHEET_BUTTON_RADIUS = CARD_RADIUS_SM;
const SHEET_BUTTON_LIP = 2;

type SheetActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
};

export function SheetActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: SheetActionButtonProps) {
  const colors = useThemeColors();
  const isPrimary = variant === "primary";

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (isPrimary) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={handlePress}
        style={({ pressed }) => ({
          opacity: disabled ? 0.65 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        })}
      >
        <DawnPathPillFrame
          borderRadius={SHEET_BUTTON_RADIUS}
          lipDepth={SHEET_BUTTON_LIP}
          contentStyle={{
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 16,
                lineHeight: 22,
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              {label}
            </Text>
          )}
        </DawnPathPillFrame>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
      })}
    >
      <View
        style={[
          {
            borderRadius: SHEET_BUTTON_RADIUS,
            borderCurve: "continuous",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardStroke,
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          },
          Platform.select({
            ios: {
              shadowColor: colors.cardShadow,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.28,
              shadowRadius: 8,
            },
            android: { elevation: 3 },
          }),
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.muted} />
        ) : (
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 16,
              lineHeight: 22,
              color: colors.foreground,
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
