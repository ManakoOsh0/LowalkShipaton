/**
 * Dev-only gallery for share overlay templates — no photo library or view-shot required.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ShareOverlayCanvas } from "@/components/share/ShareOverlayCanvas";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PILL_RADIUS } from "@/lib/cardStyle";
import {
  DEFAULT_SHARE_MAP_POSITION,
  type ShareMapPosition,
} from "@/lib/shareOverlayMap";
import {
  buildShareOverlayDailyGoalPreviewPayload,
  buildShareOverlayPreviewPayload,
  SHARE_OVERLAY_PREVIEW_SCENARIOS,
  type PreviewScenario,
} from "@/lib/shareOverlayPreview";
import {
  getShareTemplatesForPayload,
  SHARE_OVERLAY_HERO_STATS,
  suggestedTemplateForPayload,
  type ShareOverlayHeroStat,
  type ShareOverlayTemplateId,
} from "@/types/shareOverlay";

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  const colors = useThemeColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((option) => {
          const active = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: PILL_RADIUS,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primarySoft : colors.card,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: active ? colors.primary : colors.foreground,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
      }}
    >
      <Text style={{ fontFamily: "Poppins-Medium", fontSize: 15, color: colors.foreground }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function ShareOverlaysPreviewScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = Math.min(windowWidth - 48, 280);
  const previewHeight = previewWidth * (16 / 9);
  const galleryWidth = (windowWidth - 48 - 12) / 2;
  const galleryHeight = galleryWidth * (16 / 9);

  const [scenario, setScenario] = useState<PreviewScenario>("early_class");
  const [templateId, setTemplateId] = useState<ShareOverlayTemplateId>("early_class");
  const [heroStat, setHeroStat] = useState<ShareOverlayHeroStat>("duration");
  const [useDailyGoalPayload, setUseDailyGoalPayload] = useState(false);
  const [showVenue, setShowVenue] = useState(true);
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showConsistencyMap, setShowConsistencyMap] = useState(false);
  const [mapPosition, setMapPosition] = useState<ShareMapPosition>(DEFAULT_SHARE_MAP_POSITION);

  const payload = useMemo(
    () =>
      useDailyGoalPayload
        ? buildShareOverlayDailyGoalPreviewPayload()
        : buildShareOverlayPreviewPayload(scenario),
    [scenario, useDailyGoalPayload],
  );

  const availableTemplates = getShareTemplatesForPayload(payload);
  const activeTemplateId = availableTemplates.some((t) => t.id === templateId)
    ? templateId
    : suggestedTemplateForPayload(payload);

  const canvasProps = {
    payload,
    heroStat,
    showVenue,
    showVerifiedBadge,
    showWatermark,
    showConsistencyMap,
    mapPosition,
    mapInteractive: showConsistencyMap,
    onMapPositionChange: setMapPosition,
    photoUri: null,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 20,
              color: colors.foreground,
            }}
          >
            Share templates
          </Text>
          <Text
            style={{
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              color: colors.muted,
            }}
          >
            Expo Go preview — no export needed
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 32,
          gap: 20,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <ShareOverlayCanvas
          templateId={activeTemplateId}
          width={previewWidth}
          height={previewHeight}
          {...canvasProps}
        />

        <View style={{ width: "100%", gap: 10 }}>
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.muted }}>
            Moment
          </Text>
          <ChipRow
            options={SHARE_OVERLAY_PREVIEW_SCENARIOS}
            value={scenario}
            onChange={(next) => {
              setScenario(next);
              const nextPayload = buildShareOverlayPreviewPayload(next);
              setTemplateId(suggestedTemplateForPayload(nextPayload));
            }}
          />
        </View>

        <View style={{ width: "100%", gap: 10 }}>
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.muted }}>
            Template
          </Text>
          <ChipRow
            options={availableTemplates}
            value={activeTemplateId}
            onChange={setTemplateId}
          />
        </View>

        <View style={{ width: "100%", gap: 10 }}>
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.muted }}>
            Hero stat
          </Text>
          <ChipRow
            options={SHARE_OVERLAY_HERO_STATS}
            value={heroStat}
            onChange={setHeroStat}
          />
        </View>

        <View
          style={{
            width: "100%",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: 16,
          }}
        >
          <ToggleRow label="Daily goal payload" value={useDailyGoalPayload} onValueChange={setUseDailyGoalPayload} />
          <ToggleRow label="Show venue" value={showVenue} onValueChange={setShowVenue} />
          <ToggleRow label="Verified badge" value={showVerifiedBadge} onValueChange={setShowVerifiedBadge} />
          <ToggleRow label="Watermark" value={showWatermark} onValueChange={setShowWatermark} />
          <ToggleRow
            label="Consistency map"
            value={showConsistencyMap}
            onValueChange={setShowConsistencyMap}
          />
        </View>

        <View style={{ width: "100%", gap: 12 }}>
          <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 14, color: colors.muted }}>
            All templates
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {availableTemplates.map((template) => (
              <Pressable
                key={template.id}
                accessibilityRole="button"
                onPress={() => setTemplateId(template.id)}
                style={{ width: galleryWidth }}
              >
                <ShareOverlayCanvas
                  templateId={template.id}
                  width={galleryWidth}
                  height={galleryHeight}
                  {...canvasProps}
                />
                <Text
                  style={{
                    marginTop: 8,
                    fontFamily: "Poppins-Medium",
                    fontSize: 13,
                    color: colors.foreground,
                    textAlign: "center",
                  }}
                >
                  {template.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
