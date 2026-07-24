/**
 * HeroFocusLedger — weekly report card for the TRMNL hero shell.
 * Hours protected headline, streak + coins grid, and GitHub-style heatmap.
 */
import { View } from "react-native";

import { TrmnlText } from "@/components/trmnl/TrmnlText";
import { HERO_EINK } from "@/lib/heroEink";
import type { HeroFocusLedgerSnapshot } from "@/types/dashboard";

const CELL_GAP = 2;
const CELL_SIZE = 6;
const HEATMAP_HEIGHT = CELL_SIZE * 7 + CELL_GAP * 6;

type HeroFocusLedgerProps = {
  ledger: HeroFocusLedgerSnapshot;
};

function DottedRule({ vertical = false }: { vertical?: boolean }) {
  return (
    <View
      style={
        vertical
          ? {
              width: 1,
              alignSelf: "stretch",
              borderLeftWidth: 1,
              borderStyle: "dotted",
              borderColor: HERO_EINK.ink,
              marginHorizontal: 6,
            }
          : {
              height: 1,
              borderTopWidth: 1,
              borderStyle: "dotted",
              borderColor: HERO_EINK.ink,
              marginVertical: 8,
            }
      }
    />
  );
}

function heatmapFill(level: number): string {
  switch (level) {
    case 4:
      return HERO_EINK.ink;
    case 3:
      return "rgba(0, 0, 0, 0.72)";
    case 2:
      return "rgba(0, 0, 0, 0.48)";
    case 1:
      return "rgba(0, 0, 0, 0.24)";
    default:
      return "rgba(0, 0, 0, 0.06)";
  }
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
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderTopWidth: borderedTop ? 1 : 0,
        borderLeftWidth: borderedLeft ? 1 : 0,
        borderStyle: "dotted",
        borderColor: HERO_EINK.ink,
      }}
    >
      <TrmnlText variant="value" numberOfLines={1}>
        {value}
      </TrmnlText>
      <TrmnlText variant="labelSmall" color="muted" numberOfLines={2} style={{ marginTop: 2 }}>
        {label}
      </TrmnlText>
    </View>
  );
}

export function HeroFocusLedger({ ledger }: HeroFocusLedgerProps) {
  const completionLabel =
    ledger.sessionsScheduled > 0
      ? `${ledger.sessionsCompleted}/${ledger.sessionsScheduled}`
      : String(ledger.sessionsCompleted);

  return (
    <View>
      <TrmnlText variant="labelSmall" color="muted">
        Weekly report
      </TrmnlText>

      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          minHeight: 72,
          marginTop: 4,
        }}
      >
        <View style={{ flex: 1.1, justifyContent: "center", paddingRight: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            <TrmnlText
              variant="countdown"
              numberOfLines={1}
              style={{ fontSize: 30, lineHeight: 32 }}
            >
              {ledger.focusTime}
            </TrmnlText>
            <TrmnlText variant="label" color="muted">
              {ledger.focusTimeUnit}
            </TrmnlText>
          </View>
          <TrmnlText variant="labelSmall" color="muted" style={{ marginTop: 4 }}>
            Focus time this week
          </TrmnlText>
        </View>

        <DottedRule vertical />

        <View style={{ flex: 1.2 }}>
          <View style={{ flexDirection: "row" }}>
            <StatCell value={String(ledger.currentStreak)} label="Day streak" />
            <StatCell
              value={String(ledger.focusCoins)}
              label="Focus coins"
              borderedLeft
            />
          </View>
          <View style={{ flexDirection: "row" }}>
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

      <DottedRule />

      <View style={{ height: HEATMAP_HEIGHT }}>
        <View style={{ flex: 1, flexDirection: "row", gap: CELL_GAP }}>
          {ledger.heatmapWeeks.map((week) => (
            <View key={week.weekStartIso} style={{ flex: 1, gap: CELL_GAP }}>
              {week.days.map((day) => (
                <View
                  key={day.dateIso}
                  style={{
                    height: CELL_SIZE,
                    borderRadius: 1,
                    backgroundColor: heatmapFill(day.level),
                    borderWidth: day.isToday || week.isCurrentWeek ? 1 : 0,
                    borderColor: day.isToday
                      ? HERO_EINK.ink
                      : week.isCurrentWeek
                        ? "rgba(0, 0, 0, 0.35)"
                        : "rgba(0, 0, 0, 0.12)",
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
