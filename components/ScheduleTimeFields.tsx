/**
 * Schedule time controls for Focus Node create/edit.
 * Class schedules use a 4-column range sheet; gym/library use start time + duration chips.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatMinutesToLabel, parseTimeToMinutes } from "@/lib/time";
import type { ThemeColors } from "@/theme/tokens";

/** Common gym / library / study window lengths — stored as fractional hours. */
export const DURATION_PRESETS: { hours: number; label: string }[] = [
  { hours: 0.5, label: "30 min" },
  { hours: 1, label: "1 hr" },
  { hours: 1.5, label: "1.5 hr" },
  { hours: 2, label: "2 hr" },
  { hours: 3, label: "3 hr" },
];

const STEP_MINUTES = 15;
const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD_ROWS = Math.floor(VISIBLE_ROWS / 2);
const PAD_HEIGHT = PAD_ROWS * ITEM_HEIGHT;

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = [0, 15, 30, 45];

function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function snapToStep(totalMinutes: number): number {
  return Math.round(totalMinutes / STEP_MINUTES) * STEP_MINUTES;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function format24HourRange(startTime: string, endTime: string): string {
  return `${startTime.trim()} — ${endTime.trim()}`;
}

function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 1 && minutes === 0) return "1 hour";
  if (hours > 1 && minutes === 0) return `${hours} hours`;
  if (hours === 0 && minutes === 1) return "1 minute";
  if (hours === 0) return `${minutes} minutes`;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  return "0 minutes";
}

type WheelColumnProps = {
  values: number[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  formatLabel: (value: number) => string;
  colors: ThemeColors;
  accessibilityLabel: string;
  flex?: number;
};

/** ScrollView drum — avoids FlatList-inside-ScrollView VirtualizedList warnings. */
function WheelColumn({
  values,
  selectedIndex,
  onChangeIndex,
  formatLabel,
  colors,
  accessibilityLabel,
  flex = 1,
}: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) return;
    const offset = selectedIndex * ITEM_HEIGHT;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    });
  }, [selectedIndex]);

  const commitOffset = (offsetY: number) => {
    const index = Math.max(
      0,
      Math.min(values.length - 1, Math.round(offsetY / ITEM_HEIGHT)),
    );
    if (index !== selectedIndex) {
      onChangeIndex(index);
    }
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDraggingRef.current = false;
    commitOffset(event.nativeEvent.contentOffset.y);
  };

  return (
    <View
      style={{ flex, height: WHEEL_HEIGHT }}
      accessibilityLabel={accessibilityLabel}
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        bounces={false}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={(event) => {
          if (event.nativeEvent.velocity?.y === 0) {
            isDraggingRef.current = false;
            commitOffset(event.nativeEvent.contentOffset.y);
          }
        }}
      >
        <View style={{ height: PAD_HEIGHT }} />
        {values.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <View
              key={`${item}-${index}`}
              style={{
                height: ITEM_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: selected ? "Poppins-Bold" : "Poppins-Regular",
                  fontSize: selected ? 28 : 20,
                  lineHeight: selected ? 34 : 26,
                  color: selected ? colors.foreground : colors.muted,
                  opacity: selected ? 1 : 0.32,
                }}
              >
                {formatLabel(item)}
              </Text>
            </View>
          );
        })}
        <View style={{ height: PAD_HEIGHT }} />
      </ScrollView>
    </View>
  );
}

const selectionBandStyle = (colors: ThemeColors) => ({
  position: "absolute" as const,
  left: 8,
  right: 8,
  top: PAD_ROWS * ITEM_HEIGHT,
  height: ITEM_HEIGHT,
  borderRadius: 12,
  backgroundColor: colors.card,
  opacity: 0.95,
});

function WheelColon({ colors }: { colors: ThemeColors }) {
  return (
    <Text
      style={{
        fontFamily: "Poppins-Bold",
        fontSize: 24,
        lineHeight: 30,
        color: colors.foreground,
        paddingHorizontal: 2,
        marginBottom: 2,
      }}
    >
      :
    </Text>
  );
}

type TimeRangeWheelsProps = {
  startTime: string;
  endTime: string;
  onChangeStartTime: (next: string) => void;
  onChangeEndTime: (next: string) => void;
  colors: ThemeColors;
};

/** Four-column start/end wheels with a shared selection band. */
function TimeRangeWheels({
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  colors,
}: TimeRangeWheelsProps) {
  const startSnapped = snapToStep(parseTimeToMinutes(startTime));
  const endSnapped = snapToStep(parseTimeToMinutes(endTime));
  const startHour = Math.floor(startSnapped / 60) % 24;
  const startMinute = startSnapped % 60;
  const endHour = Math.floor(endSnapped / 60) % 24;
  const endMinute = endSnapped % 60;
  const startMinuteIndex = Math.max(0, MINUTES.indexOf(startMinute));
  const endMinuteIndex = Math.max(0, MINUTES.indexOf(endMinute));

  const durationMinutes = Math.max(endSnapped - startSnapped, 0);

  const emitStart = (hour: number, minute: number) => {
    onChangeStartTime(minutesToTimeString(hour * 60 + minute));
  };

  const emitEnd = (hour: number, minute: number) => {
    onChangeEndTime(minutesToTimeString(hour * 60 + minute));
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={{ height: WHEEL_HEIGHT, position: "relative" }}>
        <View pointerEvents="none" style={selectionBandStyle(colors)} />
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 4,
          }}
        >
          <WheelColumn
            values={HOURS}
            selectedIndex={startHour}
            onChangeIndex={(index) => emitStart(HOURS[index], MINUTES[startMinuteIndex])}
            formatLabel={pad2}
            colors={colors}
            accessibilityLabel="Start hour"
            flex={1.1}
          />
          <WheelColumn
            values={MINUTES}
            selectedIndex={startMinuteIndex}
            onChangeIndex={(index) => emitStart(startHour, MINUTES[index])}
            formatLabel={pad2}
            colors={colors}
            accessibilityLabel="Start minute"
            flex={1.1}
          />
          <WheelColon colors={colors} />
          <WheelColumn
            values={HOURS}
            selectedIndex={endHour}
            onChangeIndex={(index) => emitEnd(HOURS[index], MINUTES[endMinuteIndex])}
            formatLabel={pad2}
            colors={colors}
            accessibilityLabel="End hour"
            flex={1.1}
          />
          <WheelColumn
            values={MINUTES}
            selectedIndex={endMinuteIndex}
            onChangeIndex={(index) => emitEnd(endHour, MINUTES[index])}
            formatLabel={pad2}
            colors={colors}
            accessibilityLabel="End minute"
            flex={1.1}
          />
        </View>
      </View>

      <Text
        style={{
          textAlign: "center",
          fontFamily: "Poppins-Regular",
          fontSize: 15,
          lineHeight: 20,
          color: colors.muted,
        }}
      >
        {formatDurationMinutes(durationMinutes)}
      </Text>
    </View>
  );
}

type StartTimeWheelsProps = {
  startTime: string;
  onChangeStartTime: (next: string) => void;
  colors: ThemeColors;
};

function StartTimeWheels({ startTime, onChangeStartTime, colors }: StartTimeWheelsProps) {
  const snapped = snapToStep(parseTimeToMinutes(startTime));
  const hour = Math.floor(snapped / 60) % 24;
  const minute = snapped % 60;
  const minuteIndex = Math.max(0, MINUTES.indexOf(minute));

  const emit = (nextHour: number, nextMinute: number) => {
    onChangeStartTime(minutesToTimeString(nextHour * 60 + nextMinute));
  };

  return (
    <View style={{ height: WHEEL_HEIGHT, position: "relative" }}>
      <View pointerEvents="none" style={selectionBandStyle(colors)} />
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 48,
        }}
      >
        <WheelColumn
          values={HOURS}
          selectedIndex={hour}
          onChangeIndex={(index) => emit(HOURS[index], MINUTES[minuteIndex])}
          formatLabel={pad2}
          colors={colors}
          accessibilityLabel="Start hour"
        />
        <WheelColon colors={colors} />
        <WheelColumn
          values={MINUTES}
          selectedIndex={minuteIndex}
          onChangeIndex={(index) => emit(hour, MINUTES[index])}
          formatLabel={pad2}
          colors={colors}
          accessibilityLabel="Start minute"
        />
      </View>
    </View>
  );
}

type TimePickerSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  colors: ThemeColors;
  children: ReactNode;
};

function TimePickerSheet({
  visible,
  title,
  onClose,
  onConfirm,
  colors,
  children,
}: TimePickerSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(13, 19, 43, 0.45)" }}
          onPress={onClose}
        />
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 10,
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
        <View
          style={{
            alignSelf: "center",
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
            marginBottom: 16,
          }}
        />

        <Text
          style={{
            fontFamily: "Poppins-Bold",
            fontSize: 18,
            lineHeight: 24,
            color: colors.foreground,
            marginBottom: 20,
          }}
        >
          {title}
        </Text>

        {children}

        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={{
            marginTop: 20,
            alignItems: "center",
            borderRadius: 999,
            backgroundColor: colors.primary,
            paddingVertical: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 16,
              color: "#F0EDE9",
            }}
          >
            Confirm
          </Text>
        </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function TimeFieldPressable({
  label,
  value,
  onPress,
  colors,
}: {
  label: string;
  value: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            fontFamily: "Poppins-SemiBold",
            fontSize: 17,
            lineHeight: 22,
            color: colors.foreground,
          }}
        >
          {value}
        </Text>
      </Pressable>
    </View>
  );
}

type ScheduleTimeRangeFieldProps = {
  startTime: string;
  endTime: string;
  onChangeStartTime: (next: string) => void;
  onChangeEndTime: (next: string) => void;
  colors: ThemeColors;
};

/** Class schedule — tap to open a 4-column start/end range sheet. */
export function ScheduleTimeRangeField({
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  colors,
}: ScheduleTimeRangeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draftStart, setDraftStart] = useState(startTime);
  const [draftEnd, setDraftEnd] = useState(endTime);

  const openSheet = () => {
    setDraftStart(startTime);
    setDraftEnd(endTime);
    setVisible(true);
  };

  const handleConfirm = () => {
    const startMinutes = parseTimeToMinutes(draftStart);
    const endMinutes = parseTimeToMinutes(draftEnd);
    if (endMinutes <= startMinutes) {
      onChangeStartTime(draftStart);
      onChangeEndTime(minutesToTimeString(startMinutes + STEP_MINUTES));
    } else {
      onChangeStartTime(draftStart);
      onChangeEndTime(draftEnd);
    }
    setVisible(false);
  };

  const displayValue =
    isValidTime(startTime) && isValidTime(endTime)
      ? format24HourRange(startTime, endTime)
      : "Set time";

  return (
    <>
      <TimeFieldPressable
        label="Time"
        value={displayValue}
        onPress={openSheet}
        colors={colors}
      />

      <TimePickerSheet
        visible={visible}
        title="Active time"
        onClose={() => setVisible(false)}
        onConfirm={handleConfirm}
        colors={colors}
      >
        <TimeRangeWheels
          startTime={draftStart}
          endTime={draftEnd}
          onChangeStartTime={setDraftStart}
          onChangeEndTime={setDraftEnd}
          colors={colors}
        />
      </TimePickerSheet>
    </>
  );
}

type ScheduleSessionTimeFieldProps = {
  startTime: string;
  durationHours: number;
  onChangeStartTime: (next: string) => void;
  onChangeDurationHours: (hours: number) => void;
  colors: ThemeColors;
};

/** Gym / library — start time sheet plus duration chips. */
export function ScheduleSessionTimeField({
  startTime,
  durationHours,
  onChangeStartTime,
  onChangeDurationHours,
  colors,
}: ScheduleSessionTimeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draftStart, setDraftStart] = useState(startTime);
  const [draftDuration, setDraftDuration] = useState(durationHours);

  const openSheet = () => {
    setDraftStart(startTime);
    setDraftDuration(durationHours);
    setVisible(true);
  };

  const handleConfirm = () => {
    onChangeStartTime(draftStart);
    onChangeDurationHours(draftDuration);
    setVisible(false);
  };

  const durationMinutes = Math.round(durationHours * 60);
  const displayValue = isValidTime(startTime)
    ? `${startTime} · ${formatDurationMinutes(durationMinutes)}`
    : "Set time";

  return (
    <>
      <TimeFieldPressable
        label="Time"
        value={displayValue}
        onPress={openSheet}
        colors={colors}
      />

      <TimePickerSheet
        visible={visible}
        title="Session time"
        onClose={() => setVisible(false)}
        onConfirm={handleConfirm}
        colors={colors}
      >
        <StartTimeWheels
          startTime={draftStart}
          onChangeStartTime={setDraftStart}
          colors={colors}
        />

        <View style={{ marginTop: 20, gap: 8 }}>
          <Text
            style={{
              fontFamily: "Poppins-SemiBold",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Duration
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {DURATION_PRESETS.map((preset) => {
              const selected = Math.abs(preset.hours - draftDuration) < 0.001;
              return (
                <Pressable
                  key={preset.hours}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setDraftDuration(preset.hours)}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 13,
                      color: selected ? "#F0EDE9" : colors.foreground,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            style={{
              textAlign: "center",
              fontFamily: "Poppins-Regular",
              fontSize: 15,
              lineHeight: 20,
              color: colors.muted,
              marginTop: 4,
            }}
          >
            {formatDurationMinutes(Math.round(draftDuration * 60))}
          </Text>
        </View>
      </TimePickerSheet>
    </>
  );
}

/** @deprecated Use ScheduleTimeRangeField or ScheduleSessionTimeField. */
export function TimeWheel({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  colors: ThemeColors;
}) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <>
      <TimeFieldPressable
        label={label}
        value={isValidTime(value) ? value : "Set time"}
        onPress={() => {
          setDraft(value);
          setVisible(true);
        }}
        colors={colors}
      />
      <TimePickerSheet
        visible={visible}
        title={label}
        onClose={() => setVisible(false)}
        onConfirm={() => {
          onChange(draft);
          setVisible(false);
        }}
        colors={colors}
      >
        <StartTimeWheels
          startTime={draft}
          onChangeStartTime={setDraft}
          colors={colors}
        />
      </TimePickerSheet>
    </>
  );
}

/** @deprecated Prefer TimeWheel — kept so older imports keep working during rename. */
export const TimeStepper = TimeWheel;

/** @deprecated Duration is configured inside ScheduleSessionTimeField. */
export function DurationChips({
  valueHours,
  onChange,
  colors,
}: {
  valueHours: number;
  onChange: (hours: number) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          fontFamily: "Poppins-SemiBold",
          fontSize: 13,
          lineHeight: 18,
          color: colors.muted,
        }}
      >
        Duration
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {DURATION_PRESETS.map((preset) => {
          const selected = Math.abs(preset.hours - valueHours) < 0.001;
          return (
            <Pressable
              key={preset.hours}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(preset.hours)}
              style={{
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: selected ? colors.primary : colors.background,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 13,
                  color: selected ? "#F0EDE9" : colors.foreground,
                }}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ScheduleWindowSummaryProps = {
  startTime: string;
  endMinutes: number;
  colors: ThemeColors;
};

function formatWindowSummary(startTime: string, endMinutes: number): string {
  const startMinutes = parseTimeToMinutes(startTime);
  const durationMinutes = Math.max(endMinutes - startMinutes, 0);
  return `${formatMinutesToLabel(startMinutes)} – ${formatMinutesToLabel(endMinutes)} · ${formatDurationMinutes(durationMinutes)}`;
}

/** Read-only window so users see the derived end without opening the sheet. */
export function ScheduleWindowSummary({
  startTime,
  endMinutes,
  colors,
}: ScheduleWindowSummaryProps) {
  return (
    <Text
      style={{
        fontFamily: "Poppins-Regular",
        fontSize: 13,
        lineHeight: 18,
        color: colors.muted,
      }}
    >
      {formatWindowSummary(startTime, endMinutes)}
    </Text>
  );
}

/** @deprecated Use ScheduleTimeRangeField. */
export function ClassEndTimePicker({
  startTime,
  endTime,
  onChangeEndTime,
  colors,
}: {
  startTime: string;
  endTime: string;
  onChangeEndTime: (next: string) => void;
  colors: ThemeColors;
  compact?: boolean;
}) {
  return (
    <ScheduleWindowSummary
      startTime={startTime}
      endMinutes={parseTimeToMinutes(endTime)}
      colors={colors}
    />
  );
}
