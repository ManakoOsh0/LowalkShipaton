/**
 * InlineFieldError — small validation hint below a form section.
 */
import { Text } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type InlineFieldErrorProps = {
  message: string;
  centered?: boolean;
};

export function InlineFieldError({ message, centered }: InlineFieldErrorProps) {
  const colors = useThemeColors();

  return (
    <Text
      style={{
        fontFamily: "Poppins-Regular",
        fontSize: 13,
        lineHeight: 18,
        color: colors.error,
        textAlign: centered ? "center" : undefined,
      }}
    >
      {message}
    </Text>
  );
}
