/**
 * StatsCardShell — polished surface shared across the Statistics tab.
 * Uses the default elevated shadow so tiles read clearly on the dark canvas.
 */
import type { ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { NeuCard } from "@/components/NeuCard";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";

type StatsCardShellProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function StatsCardShell({ children, style }: StatsCardShellProps) {
  return (
    <NeuCard borderRadius={CARD_RADIUS_LG} style={style}>
      {children}
    </NeuCard>
  );
}
