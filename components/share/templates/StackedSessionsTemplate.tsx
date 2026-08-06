import { Text, View } from "react-native";

import {
  ShareAuraGlassCard,
  ShareAuraWatermark,
} from "@/components/share/ShareOverlayPrimitives";
import type { ShareOverlayTemplateProps } from "@/components/share/ShareOverlayTemplateProps";
import { FocusNodeKindIcon } from "@/components/FocusNodeKindIcon";
import { formatShareKindLabel, shareScale } from "@/lib/shareOverlay";

const KIND_LABELS: Record<string, string> = {
  class: "Class",
  gym: "Gym",
  library: "Library",
  custom: "Focus",
};

export function StackedSessionsTemplate({
  payload,
  showWatermark,
  width,
  height,
}: ShareOverlayTemplateProps) {
  const scale = shareScale(width);
  const inset = 40 * scale;
  const sessions = payload.todaySessions.slice(0, 2);
  const overflow = payload.todaySessions.length - sessions.length;

  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: "absolute",
          right: inset,
          bottom: height * 0.18,
          gap: 12 * scale,
          alignItems: "flex-end",
        }}
      >
        {sessions.map((session) => (
          <ShareAuraGlassCard
            key={`${session.kind}-${session.nodeTitle}`}
            label={KIND_LABELS[session.kind] ?? formatShareKindLabel(session.kind)}
            heroValue={session.durationLabel}
            subline={session.nodeTitle}
            icon={<FocusNodeKindIcon kind={session.kind} size={30 * scale} color="#111111" />}
            scale={scale}
          />
        ))}
        {overflow > 0 ? (
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13 * scale,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            +{overflow} more today
          </Text>
        ) : null}
      </View>

      <ShareAuraWatermark width={width} visible={showWatermark} />
    </View>
  );
}
