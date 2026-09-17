/**
 * In-app preview of Android home-screen widgets.
 * Layout mirrors native XML exactly — see lib/widgetLayoutSpec.ts.
 */
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { WidgetHourglassIcon } from "@/components/WidgetHourglassIcon";
import { WidgetPaywallOverlay } from "@/components/settings/WidgetPaywallOverlay";
import { useProPaywall } from "@/hooks/useProPaywall";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useWidgetPremiumAccess } from "@/hooks/useWidgetPremiumAccess";
import {
  buildWidgetTileAppearance,
  type WidgetTileAppearancePayload,
} from "@/lib/heroWidgetAppearance";
import { formatWidgetDateParts } from "@/lib/widgetDateLabel";
import { WIDGET_FOCUS_SPEC, WIDGET_HOURS_SPEC } from "@/lib/widgetLayoutSpec";
import { estimateFocusMinutes } from "@/lib/periodStats";
import {
  buildWidgetPreviewContent,
  WIDGET_PREVIEW_SCENARIOS,
  type WidgetPreviewContent,
} from "@/lib/widgetPreviewModel";
import { formatWidgetFocusHours } from "@/lib/widgetViewModel";
import {
  HERO_PREVIEW_SCENARIO_LABELS,
  type HeroPreviewScenario,
} from "@/store/useHeroPreviewStore";
import { useScheduleStore } from "@/store/useScheduleStore";

function PreviewLabel({ children }: { children: string }) {
  const colors = useThemeColors();

  return (
    <Text
      style={{
        fontFamily: "Poppins-SemiBold",
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: colors.muted,
      }}
    >
      {children}
    </Text>
  );
}

function ScenarioPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderCurve: "continuous",
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.foreground : colors.border,
        backgroundColor: selected ? colors.foreground : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 12,
          lineHeight: 16,
          color: selected ? colors.background : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HeroFocusWidgetPreview({
  content,
  appearance,
}: {
  content: WidgetPreviewContent;
  appearance: WidgetTileAppearancePayload;
}) {
  const spec = WIDGET_FOCUS_SPEC;
  const date = formatWidgetDateParts();

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: spec.minWidthDp / spec.minHeightDp,
        minHeight: spec.minHeightDp,
        backgroundColor: appearance.tileBg,
        borderRadius: spec.cornerRadiusDp,
        padding: spec.paddingDp,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spec.date.marginStart,
        }}
      >
        <Text
          numberOfLines={spec.title.maxLines}
          ellipsizeMode="tail"
          style={{
            flex: 1,
            fontFamily: "Poppins-Bold",
            fontSize: spec.title.fontSize,
            lineHeight: spec.title.lineHeight,
            color: appearance.textPrimary,
          }}
        >
          {content.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spec.date.gap }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: spec.date.fontSize,
              lineHeight: spec.date.lineHeight,
              color: appearance.textPrimary,
            }}
          >
            {date.weekday}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: spec.date.fontSize,
              lineHeight: spec.date.lineHeight,
              color: appearance.dateAccent,
            }}
          >
            {date.day}
          </Text>
        </View>
      </View>

      {content.activeTimer ? (
        <View style={{ marginTop: spec.activeTimer.marginTop }}>
          <View
            style={{
              height: spec.activeTimer.progressHeight,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.round(content.activeTimer.progressRatio * 100)}%`,
                height: "100%",
                backgroundColor: appearance.dateAccent,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spec.activeTimer.labelsMarginTop,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: "Poppins-Regular",
                fontSize: spec.activeTimer.fontSize,
                lineHeight: spec.activeTimer.lineHeight,
                color: appearance.textPrimary,
              }}
            >
              {content.activeTimer.startLabel}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: spec.activeTimer.fontSize,
                lineHeight: spec.activeTimer.lineHeight,
                color: appearance.textPrimary,
              }}
            >
              {content.activeTimer.remainingLabel}
            </Text>
          </View>
        </View>
      ) : null}

      {!content.activeTimer && content.status ? (
        <Text
          numberOfLines={spec.status.maxLines}
          adjustsFontSizeToFit={spec.status.shrinkToFit}
          minimumFontScale={spec.status.minFontSize / spec.status.fontSize}
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: spec.status.fontSize,
            lineHeight: spec.status.lineHeight,
            marginTop: spec.status.marginTop,
            color: appearance.textPrimary,
          }}
        >
          {content.status}
        </Text>
      ) : null}

      {!content.activeTimer && content.detail ? (
        <Text
          numberOfLines={spec.detail.maxLines}
          ellipsizeMode="tail"
          style={{
            fontFamily: "Poppins-Regular",
            fontSize: spec.detail.fontSize,
            lineHeight: spec.detail.lineHeight,
            marginTop: spec.detail.marginTop,
            color: appearance.textMuted,
          }}
        >
          {content.detail}
        </Text>
      ) : null}
    </View>
  );
}

function FocusHoursWidgetPreview({
  appearance,
}: {
  appearance: WidgetTileAppearancePayload;
}) {
  const spec = WIDGET_HOURS_SPEC;
  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const hours = formatWidgetFocusHours(estimateFocusMinutes(focusNodes));

  return (
    <View
      style={{
        width: spec.sizeDp,
        height: spec.sizeDp,
        borderRadius: spec.cornerRadiusDp,
        backgroundColor: appearance.tileBg,
        padding: spec.paddingDp,
        alignSelf: "flex-start",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View style={{ alignItems: "center", width: "100%" }}>
        <View style={{ marginBottom: spec.icon.marginBottom }}>
          <WidgetHourglassIcon size={spec.icon.sizeDp} color={appearance.textMuted} />
        </View>
      </View>
      <Text
        numberOfLines={spec.value.maxLines}
        adjustsFontSizeToFit={spec.value.shrinkToFit}
        minimumFontScale={spec.value.minFontSize / spec.value.fontSize}
        style={{
          fontFamily: "Poppins-Bold",
          fontSize: spec.value.fontSize,
          lineHeight: spec.value.lineHeight,
          color: appearance.textPrimary,
          textAlign: "center",
          width: "100%",
        }}
      >
        {hours.value}
      </Text>
      <Text
        numberOfLines={spec.label.maxLines}
        adjustsFontSizeToFit={spec.label.shrinkToFit}
        minimumFontScale={spec.label.minFontSize / spec.label.fontSize}
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: spec.label.fontSize,
          lineHeight: spec.label.lineHeight,
          color: appearance.textMuted,
          marginTop: spec.label.marginTop,
          textAlign: "center",
          width: "100%",
        }}
      >
        {hours.label}
      </Text>
    </View>
  );
}

export function WidgetPreviewPanel() {
  const [scenario, setScenario] = useState<HeroPreviewScenario>("traveling");
  const colors = useThemeColors();
  const widgetUnlocked = useWidgetPremiumAccess();
  const { openProPaywall } = useProPaywall();
  const locked = !widgetUnlocked;
  const appearance = buildWidgetTileAppearance();
  const content = buildWidgetPreviewContent(scenario, "class");

  return (
    <View style={{ gap: 12 }}>
      <PreviewLabel>Home screen · Lowalk Focus</PreviewLabel>

      {!locked ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
        >
          {WIDGET_PREVIEW_SCENARIOS.map((item) => (
            <ScenarioPill
              key={item}
              label={HERO_PREVIEW_SCENARIO_LABELS[item]}
              selected={scenario === item}
              onPress={() => setScenario(item)}
            />
          ))}
        </ScrollView>
      ) : null}

      <WidgetPaywallOverlay
        locked={locked}
        cornerRadius={WIDGET_FOCUS_SPEC.cornerRadiusDp}
        onUnlockPress={() => void openProPaywall()}
      >
        <HeroFocusWidgetPreview content={content} appearance={appearance} />
      </WidgetPaywallOverlay>

      <PreviewLabel>Home screen · Hours saved</PreviewLabel>
      <WidgetPaywallOverlay
        locked={locked}
        cornerRadius={WIDGET_HOURS_SPEC.cornerRadiusDp}
        onUnlockPress={() => void openProPaywall()}
      >
        <FocusHoursWidgetPreview appearance={appearance} />
      </WidgetPaywallOverlay>

      <Text
        style={{
          fontFamily: "Poppins-Regular",
          fontSize: 11,
          lineHeight: 16,
          color: colors.muted,
        }}
      >
        {widgetUnlocked && Platform.OS === "android"
          ? "Long-press your home screen, open Widgets, and add Lowalk to mirror your Hero Card."
          : "Previews mirror production widget layout. Hero look settings apply in-app only."}
      </Text>
    </View>
  );
}
