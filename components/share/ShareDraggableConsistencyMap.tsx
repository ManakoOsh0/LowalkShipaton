import { useEffect } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ShareConsistencyMapSticker } from "@/components/share/ShareConsistencyMapSticker";
import {
  clampShareMapPosition,
  getShareMapStickerLayout,
  shareMapCenterToOffset,
  type ShareMapPosition,
} from "@/lib/shareOverlayMap";
import type { ShareOverlayContributionWeek } from "@/types/shareOverlay";

type ShareDraggableConsistencyMapProps = {
  weeks: ShareOverlayContributionWeek[];
  activeDaysLast30: number;
  canvasWidth: number;
  canvasHeight: number;
  position: ShareMapPosition;
  onPositionChange?: (position: ShareMapPosition) => void;
  interactive?: boolean;
};

/** Positions the consistency map sticker on the canvas; draggable in the composer. */
export function ShareDraggableConsistencyMap({
  weeks,
  activeDaysLast30,
  canvasWidth,
  canvasHeight,
  position,
  onPositionChange,
  interactive = false,
}: ShareDraggableConsistencyMapProps) {
  const layout = getShareMapStickerLayout(canvasWidth);
  const offset = shareMapCenterToOffset(
    position,
    canvasWidth,
    canvasHeight,
    layout.width,
    layout.height,
  );

  const translateX = useSharedValue(offset.left);
  const translateY = useSharedValue(offset.top);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);

  useEffect(() => {
    const next = shareMapCenterToOffset(
      position,
      canvasWidth,
      canvasHeight,
      layout.width,
      layout.height,
    );
    translateX.value = next.left;
    translateY.value = next.top;
  }, [
    canvasHeight,
    canvasWidth,
    layout.height,
    layout.width,
    position,
    translateX,
    translateY,
  ]);

  const pan = Gesture.Pan()
    .enabled(interactive)
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onStart(() => {
      dragStartX.value = translateX.value;
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const maxLeft = canvasWidth - layout.width;
      const maxTop = canvasHeight - layout.height;
      translateX.value = Math.min(
        maxLeft,
        Math.max(0, dragStartX.value + event.translationX),
      );
      translateY.value = Math.min(
        maxTop,
        Math.max(0, dragStartY.value + event.translationY),
      );
    })
    .onEnd(() => {
      if (!onPositionChange) return;
      const centerX = (translateX.value + layout.width / 2) / canvasWidth;
      const centerY = (translateY.value + layout.height / 2) / canvasHeight;
      const clamped = clampShareMapPosition(
        { x: centerX, y: centerY },
        canvasWidth,
        canvasHeight,
        layout.width,
        layout.height,
      );
      runOnJS(onPositionChange)(clamped);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const sticker = (
    <ShareConsistencyMapSticker
      weeks={weeks}
      activeDaysLast30={activeDaysLast30}
      canvasWidth={canvasWidth}
      interactive={interactive}
    />
  );

  if (!interactive) {
    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: offset.left,
          top: offset.top,
        }}
      >
        {sticker}
      </View>
    );
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 20,
          },
          animatedStyle,
        ]}
      >
        {sticker}
      </Animated.View>
    </GestureDetector>
  );
}
