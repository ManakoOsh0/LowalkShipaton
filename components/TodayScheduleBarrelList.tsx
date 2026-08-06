/**
 * TodayScheduleBarrelList — today's schedule with smooth scroll-linked depth.
 * Continuous scale + opacity falloff; falls back to a flat list when Reduce Motion is on.
 */
import { View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { NeuCard } from "@/components/NeuCard";
import { ScheduleRow } from "@/components/ScheduleRow";
import { TodayScheduleCard } from "@/components/TodayScheduleCard";
import { useReduceMotion } from "@/hooks/useHeroMotion";
import { CARD_RADIUS_LG } from "@/lib/cardStyle";
import type { ScheduleItem } from "@/types/dashboard";

const ROW_GAP = 8;
/** Approximate row + gap for scroll-depth math — layout itself stays natural height. */
const SLOT_HEIGHT = 84;

/** Smooth 0→1 focus curve — no snap points, no linear segments. */
function focusFromDistance(absDistance: number, slot: number): number {
  "worklet";
  const t = absDistance / (slot * 2);
  return 1 / (1 + t * t * 3.5);
}

type TodayScheduleBarrelListProps = {
  items: ScheduleItem[];
  onItemPress?: (item: ScheduleItem) => void;
  onItemLongPress?: (item: ScheduleItem) => void;
  contentPaddingBottom?: number;
};

type BarrelItemProps = {
  item: ScheduleItem;
  index: number;
  scrollY: SharedValue<number>;
  viewportHeight: SharedValue<number>;
  onItemPress?: (item: ScheduleItem) => void;
  onItemLongPress?: (item: ScheduleItem) => void;
};

function BarrelScheduleItem({
  item,
  index,
  scrollY,
  viewportHeight,
  onItemPress,
  onItemLongPress,
}: BarrelItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const itemCenterY = index * SLOT_HEIGHT + SLOT_HEIGHT / 2;
    const viewportCenterY = scrollY.value + viewportHeight.value / 2;
    const distance = itemCenterY - viewportCenterY;
    const focus = focusFromDistance(Math.abs(distance), SLOT_HEIGHT);

    return {
      opacity: 0.72 + focus * 0.28,
      transform: [{ scale: 0.94 + focus * 0.06 }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <NeuCard
        borderRadius={CARD_RADIUS_LG}
        shadowVariant="sm"
        contentStyle={{ padding: 0 }}
      >
        <ScheduleRow
          {...item}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
          onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
        />
      </NeuCard>
    </Animated.View>
  );
}

export function TodayScheduleBarrelList({
  items,
  onItemPress,
  onItemLongPress,
  contentPaddingBottom = 0,
}: TodayScheduleBarrelListProps) {
  const reduceMotion = useReduceMotion();
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(320);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (reduceMotion) {
    return (
      <View style={{ paddingBottom: contentPaddingBottom }}>
        <TodayScheduleCard
          items={items}
          onItemPress={onItemPress}
          onItemLongPress={onItemLongPress}
        />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(event) => {
        viewportHeight.value = event.nativeEvent.layout.height;
      }}
    >
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: ROW_GAP, paddingBottom: contentPaddingBottom }}
      >
        {items.map((item, index) => (
          <BarrelScheduleItem
            key={item.id}
            item={item}
            index={index}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
            onItemPress={onItemPress}
            onItemLongPress={onItemLongPress}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}
