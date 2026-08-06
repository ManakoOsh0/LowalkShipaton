/**
 * InlineFieldError — small validation hint below a form section.
 */
import { Text } from "react-native";

import { useThemeColors } from "@/hooks/useThemeColors";

type InlineFieldErrorProps = {
  message: string;
};

export function InlineFieldError({ message }: InlineFieldErrorProps) {
  const colors = useThemeColors();

  return (
    <Text
      style={{
        fontFamily: "Poppins-Regular",
        fontSize: 13,
        lineHeight: 18,
        color: colors.error,
      }}
    >
      {message}
    </Text>
  );
}
