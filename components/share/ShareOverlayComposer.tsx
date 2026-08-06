/**
 * ShareOverlayComposer — full-screen Aura-style editor: photo, template, hero stat, export.
 */
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ShareOverlayCanvas } from "@/components/share/ShareOverlayCanvas";
import { SheetActionButton } from "@/components/SheetActionButton";
import { useShareOverlayExport } from "@/hooks/useShareOverlayExport";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PILL_RADIUS } from "@/lib/cardStyle";
import { useShareOverlayStore } from "@/store/useShareOverlayStore";
import {
  getShareTemplatesForPayload,
  SHARE_OVERLAY_HERO_STATS,
  type ShareOverlayHeroStat,
  type ShareOverlayTemplateId,
} from "@/types/shareOverlay";

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
        paddingVertical: 10,
      }}
    >
      <Text
        style={{
          fontFamily: "Poppins-Medium",
          fontSize: 15,
          color: colors.foreground,
        }}
      >
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

export function ShareOverlayHost() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = Math.min(windowWidth - 48, 320);
  const previewHeight = previewWidth * (16 / 9);

  const visible = useShareOverlayStore((state) => state.visible);
  const payload = useShareOverlayStore((state) => state.payload);
  const photoUri = useShareOverlayStore((state) => state.photoUri);
  const templateId = useShareOverlayStore((state) => state.templateId);
  const heroStat = useShareOverlayStore((state) => state.heroStat);
  const showVenue = useShareOverlayStore((state) => state.showVenue);
  const showVerifiedBadge = useShareOverlayStore((state) => state.showVerifiedBadge);
  const showWatermark = useShareOverlayStore((state) => state.showWatermark);
  const showConsistencyMap = useShareOverlayStore((state) => state.showConsistencyMap);
  const mapPosition = useShareOverlayStore((state) => state.mapPosition);
  const close = useShareOverlayStore((state) => state.close);
  const setPhotoUri = useShareOverlayStore((state) => state.setPhotoUri);
  const setTemplateId = useShareOverlayStore((state) => state.setTemplateId);
  const setHeroStat = useShareOverlayStore((state) => state.setHeroStat);
  const setShowVenue = useShareOverlayStore((state) => state.setShowVenue);
  const setShowVerifiedBadge = useShareOverlayStore((state) => state.setShowVerifiedBadge);
  const setShowWatermark = useShareOverlayStore((state) => state.setShowWatermark);
  const setShowConsistencyMap = useShareOverlayStore((state) => state.setShowConsistencyMap);
  const setMapPosition = useShareOverlayStore((state) => state.setMapPosition);

  const { exportRef, isExporting, pickPhoto, shareImage, saveImage, supportsSave } =
    useShareOverlayExport();

  if (!visible || !payload) return null;

  const availableTemplates = getShareTemplatesForPayload(payload);
  const activeTemplateId = availableTemplates.some((t) => t.id === templateId)
    ? templateId
    : availableTemplates[0]?.id ?? "neon_duration";

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
    width: previewWidth,
    height: previewHeight,
    photoUri,
  };

  return (
    <Modal
      visible
      animationType={reduceMotion ? "none" : "slide"}
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 12,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close share editor"
            onPress={close}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="close" size={28} color={colors.foreground} />
          </Pressable>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 17,
              color: colors.foreground,
            }}
          >
            Share
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change photo"
            onPress={() => {
              void (async () => {
                const uri = await pickPhoto();
                if (uri) setPhotoUri(uri);
              })();
            }}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="image-outline" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", paddingHorizontal: 24, marginBottom: 12 }}>
          <View ref={exportRef} collapsable={false}>
            <ShareOverlayCanvas templateId={activeTemplateId} {...canvasProps} />
          </View>

          {!photoUri ? (
            <Text
              style={{
                marginTop: 10,
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Tap the photo icon to add a background image.
            </Text>
          ) : null}

          {showConsistencyMap ? (
            <Text
              style={{
                marginTop: 8,
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Drag the consistency map to reposition it on your card.
            </Text>
          ) : null}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: "100%", gap: 8 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              Template
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {availableTemplates.map((template) => {
                  const active = template.id === activeTemplateId;
                  return (
                    <Pressable
                      key={template.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setTemplateId(template.id as ShareOverlayTemplateId)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: PILL_RADIUS,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primarySoft : colors.card,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins-SemiBold",
                          fontSize: 14,
                          color: active ? colors.primary : colors.foreground,
                        }}
                      >
                        {template.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View style={{ width: "100%", gap: 8 }}>
            <Text
              style={{
                fontFamily: "Poppins-SemiBold",
                fontSize: 14,
                color: colors.muted,
              }}
            >
              Hero stat
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {SHARE_OVERLAY_HERO_STATS.map((stat) => {
                  const active = stat.id === heroStat;
                  return (
                    <Pressable
                      key={stat.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setHeroStat(stat.id as ShareOverlayHeroStat)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: PILL_RADIUS,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primarySoft : colors.card,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: "Poppins-Medium",
                          fontSize: 13,
                          color: active ? colors.primary : colors.foreground,
                        }}
                      >
                        {stat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
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
            <ToggleRow
              label="Show venue"
              value={showVenue}
              onValueChange={setShowVenue}
            />
            <ToggleRow
              label="Verified badge"
              value={showVerifiedBadge}
              onValueChange={setShowVerifiedBadge}
            />
            <ToggleRow
              label="Watermark"
              value={showWatermark}
              onValueChange={setShowWatermark}
            />
            <ToggleRow
              label="Consistency map"
              value={showConsistencyMap}
              onValueChange={setShowConsistencyMap}
            />
          </View>

          <View style={{ width: "100%", gap: 10 }}>
            <SheetActionButton
              label="Share"
              onPress={() => {
                void shareImage();
              }}
              loading={isExporting}
            />
            {supportsSave ? (
              <SheetActionButton
                label="Save image"
                variant="secondary"
                onPress={() => {
                  void saveImage();
                }}
                loading={isExporting}
              />
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
