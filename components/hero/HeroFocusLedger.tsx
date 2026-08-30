/**
 * HeroFocusLedger — weekly report card for the TRMNL hero shell.
 * Fills the fixed hero body band — same outer shell size as every other state.
 */
import { View } from "react-native";

import { HeroInsetEdge } from "@/components/hero/HeroInsetEdge";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { useHeroTheme } from "@/hooks/useHeroTheme";
import type { HeroFocusLedgerSnapshot } from "@/types/dashboard";

type HeroFocusLedgerProps = {
  ledger: HeroFocusLedgerSnapshot;
};

function DottedRule() {
  const theme = useHeroTheme();

  return (
    <View
      style={{
        width: 1,
        alignSelf: "stretch",
        borderLeftWidth: 1,
        borderStyle: "dotted",
        borderColor: theme.textPrimary,
        marginHorizontal: 8,
      }}
    />
  );
}

function StatCell({
  value,
  label,
  borderedTop = false,
  borderedLeft = false,
}: {
  value: string;
  label: string;
  borderedTop?: boolean;
  borderedLeft?: boolean;
}) {
  const theme = useHeroTheme();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 8,
        justifyContent: "center",
        borderTopWidth: borderedTop ? 1 : 0,
        borderLeftWidth: borderedLeft ? 1 : 0,
        borderStyle: "dotted",
        borderColor: theme.textPrimary,
      }}
    >
      <TrmnlText variant="value" numberOfLines={1} style={{ fontSize: 18, lineHeight: 20 }}>
        {value}
      </TrmnlText>
      <TrmnlText
        variant="labelSmall"
        color="mutedWell"
        numberOfLines={1}
        style={{ marginTop: 4, fontSize: 15, lineHeight: 18 }}
      >
        {label}
      </TrmnlText>
    </View>
  );
}

export function HeroFocusLedger({ ledger }: HeroFocusLedgerProps) {
  const theme = useHeroTheme();
  const completionLabel =
    ledger.sessionsScheduled > 0
      ? `${ledger.sessionsCompleted}/${ledger.sessionsScheduled}`
      : String(ledger.sessionsCompleted);

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: theme.plaque,
        overflow: "hidden",
      }}
    >
      <HeroInsetEdge edgeSize={10} opacity={0.14} />
      <View style={{ flex: 1, flexDirection: "row", alignItems: "stretch", zIndex: 1 }}>
        <View style={{ flex: 1.1, justifyContent: "center", paddingHorizontal: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <TrmnlText
              variant="countdown"
              numberOfLines={1}
              style={{ fontSize: 40, lineHeight: 42 }}
            >
              {ledger.focusTime}
            </TrmnlText>
            <TrmnlText
              variant="label"
              color="mutedWell"
              numberOfLines={1}
              style={{ fontSize: 16, lineHeight: 18 }}
            >
              {ledger.focusTimeUnit}
            </TrmnlText>
          </View>
          <TrmnlText
            variant="labelSmall"
            color="mutedWell"
            numberOfLines={1}
            style={{ marginTop: 6, fontSize: 14, lineHeight: 14 }}
          >
            Focus time this week
          </TrmnlText>
        </View>

        <DottedRule />

        <View style={{ flex: 1.2 }}>
          <StatCell value={String(ledger.currentStreak)} label="Day streak" />
          <View style={{ flex: 1, flexDirection: "row" }}>
            <StatCell
              value={completionLabel}
              label="Sessions done"
              borderedTop
            />
            <StatCell
              value={String(ledger.activeDaysThisWeek)}
              label="Days active"
              borderedTop
              borderedLeft
            />
          </View>
        </View>
      </View>
    </View>
  );
}
