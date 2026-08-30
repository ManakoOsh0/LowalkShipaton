/**
 * TrmnlLayout — Framework layout column with tokenized gap.
 */
import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

import { TRMNL_GAP, type TrmnlGap } from "@/lib/trmnlFramework";

type TrmnlLayoutProps = {
  children: ReactNode;
  gap?: TrmnlGap;
  /** Stack from top — no flex-grow between zones. */
  compact?: boolean;
  /** Center the full zone stack in the well (hero card). */
  centered?: boolean;
  style?: ViewStyle;
};

type ZoneProps = {
  children?: ReactNode;
  gap?: TrmnlGap;
  style?: ViewStyle;
};

export function TrmnlLayout({
  children,
  gap = "base",
  compact = false,
  centered = false,
  style,
}: TrmnlLayoutProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          minHeight: 0,
          width: "100%",
          gap: TRMNL_GAP[gap],
          justifyContent: centered ? "center" : compact ? "flex-start" : undefined,
          alignItems: centered ? "stretch" : undefined,
          paddingVertical: centered ? TRMNL_GAP.small : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Primary content band — grows to fill available well space unless compact. */
export function TrmnlLayoutMain({ children, compact = false, style }: ZoneProps & { compact?: boolean }) {
  return (
    <View
      style={[
        {
          flex: compact ? 0 : 1,
          flexShrink: compact ? 0 : 1,
          minHeight: compact ? undefined : 0,
          justifyContent: compact ? "flex-start" : "center",
          alignItems: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Context band — label, description, footnotes below the value. */
export function TrmnlLayoutFooter({ children, gap = "small", style }: ZoneProps) {
  return (
    <View
      style={[
        {
          flexShrink: 0,
          alignItems: "center",
          gap: TRMNL_GAP[gap],
          paddingBottom: 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
