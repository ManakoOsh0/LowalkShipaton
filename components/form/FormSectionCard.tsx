/**
 * FormSectionCard — grouped form section matching dashboard NeuCard styling.
 */
import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { CARD_RADIUS_XL } from "@/lib/cardStyle";
import { useThemeColors } from "@/hooks/useThemeColors";

type FormSectionCardProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function FormSectionCard({ title, children, footer }: FormSectionCardProps) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 10 }}>
      {title ? (
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 11,
            lineHeight: 14,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: colors.muted,
          }}
        >
          {title}
        </Text>
      ) : null}

      <NeuCard
        borderRadius={CARD_RADIUS_XL}
        shadowVariant="none"
        contentStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
      >
        {children}
      </NeuCard>

      {footer}
    </View>
  );
}
