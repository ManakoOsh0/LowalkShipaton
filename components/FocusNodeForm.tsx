/**
 * Shared Focus Node create/edit form — 2-step wizard keeps schedule and location separate.
 * Location must be a searched real venue (native geocode); optional GPS calibrate is separate.
 */
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { FocusNodeDetailsStep } from "@/components/FocusNodeDetailsStep";
import { FocusNodeLocationStep } from "@/components/FocusNodeLocationStep";
import { InlineFieldError } from "@/components/form/InlineFieldError";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FocusNodeFormSkeleton } from "@/components/skeleton/FocusNodeFormSkeleton";
import type { FocusNodeTemplateId } from "@/data/quickActions";
import { useFocusNodeRemovalLockReason } from "@/hooks/usePenaltyShieldActive";
import { formatTimeLabel, parseTimeToMinutes } from "@/lib/time";
import { ROUTES } from "@/lib/routes";
import { createNodeFromTemplate } from "@/store/seed";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useHasHydrated } from "@/hooks/usePersistedStoreHydration";
import type { Anchor } from "@/types/anchor";
import type { FocusNode, FocusNodeInput, FocusNodeKind, Weekday } from "@/types/focusNode";
import type { PlaceSelection } from "@/types/place";

const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

const WEEKDAY_FULL_LABELS: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function formatWeekdaySummary(weekdays: Weekday[]): string {
  if (weekdays.length === 0) return "";
  if (weekdays.length === 1) return WEEKDAY_LABELS[weekdays[0]];
  return sortWeekdays(weekdays)
    .map((day) => WEEKDAY_LABELS[day])
    .join(", ");
}

function sortWeekdays(weekdays: Weekday[]): Weekday[] {
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  return [...weekdays].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const LOCKED_TEMPLATES: FocusNodeTemplateId[] = ["class", "gym", "library"];

const TEMPLATE_CREATE_TITLES: Record<FocusNodeTemplateId, string> = {
  class: "New Class",
  gym: "New Gym",
  library: "New Library",
  custom: "New Focus Node",
};

const KIND_EDIT_TITLES: Record<FocusNodeKind, string> = {
  class: "Edit Class",
  gym: "Edit Gym",
  library: "Edit Library",
  custom: "Edit Focus Node",
};

const TEMPLATE_SAVE_LABELS: Record<FocusNodeTemplateId, string> = {
  class: "Create class",
  gym: "Create gym session",
  library: "Create library session",
  custom: "Create Focus Node",
};

type FormStep = "details" | "location";

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
}

function anchorToPlace(anchor: Anchor): PlaceSelection {
  const latitude = anchor.sourceLatitude ?? anchor.latitude;
  const longitude = anchor.sourceLongitude ?? anchor.longitude;

  return {
    placeId:
      anchor.placeId ??
      `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}:${anchor.name.trim().toLowerCase()}`,
    name: anchor.name,
    formattedAddress: anchor.formattedAddress ?? "",
    latitude,
    longitude,
  };
}

function placeFieldCopy(kind: FocusNodeKind): { emptyHint: string } {
  switch (kind) {
    case "gym":
      return { emptyHint: "Search for a gym (e.g. Virgin Active Hatfield)" };
    case "library":
      return { emptyHint: "Search for a library (e.g. Merensky Library)" };
    case "class":
      return { emptyHint: "Search for a building (e.g. IT Building)" };
    default:
      return { emptyHint: "Search for a place on the map" };
  }
}

type FocusNodeFormProps = {
  mode: "create" | "edit";
  nodeId?: string;
  templateId?: FocusNodeTemplateId;
  initialWeekday?: Weekday;
  returnToWeek?: boolean;
};

export function FocusNodeForm(props: FocusNodeFormProps) {
  const scheduleReady = useHasHydrated(useScheduleStore);

  // Wait to mount field state until the node exists — otherwise edit hydrates into template defaults.
  if (props.mode === "edit" && !scheduleReady) {
    return <FocusNodeEditLoading />;
  }

  return <FocusNodeFormFields {...props} />;
}

function FocusNodeEditLoading() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <ScreenHeader title="Edit Focus Node" subtitle="Loading…" />
      <FocusNodeFormSkeleton />
    </SafeAreaView>
  );
}

function FocusNodeFormFields({
  mode,
  nodeId,
  templateId = "custom",
  initialWeekday,
  returnToWeek = false,
}: FocusNodeFormProps) {
  const router = useRouter();
  const colors = useThemeColors();

  const focusNodes = useScheduleStore((state) => state.focusNodes);
  const anchors = useScheduleStore((state) => state.anchors);
  const addFocusNode = useScheduleStore((state) => state.addFocusNode);
  const updateFocusNode = useScheduleStore((state) => state.updateFocusNode);
  const removeFocusNode = useScheduleStore((state) => state.removeFocusNode);

  const existingNode: FocusNode | undefined = useMemo(
    () => (nodeId ? focusNodes.find((node) => node.id === nodeId) : undefined),
    [focusNodes, nodeId],
  );
  const deleteLockReason = useFocusNodeRemovalLockReason(nodeId);
  const deleteLocked = deleteLockReason != null;

  useEffect(() => {
    if (mode === "edit" && nodeId && !existingNode) {
      router.back();
    }
  }, [existingNode, mode, nodeId, router]);

  const initial = useMemo((): FocusNodeInput => {
    if (existingNode) {
      return {
        title: existingNode.title,
        icon: existingNode.icon,
        kind: existingNode.kind,
        schedule: existingNode.schedule,
        locationLabel: existingNode.locationLabel ?? null,
        anchorId: existingNode.anchorId,
      };
    }
    return createNodeFromTemplate(templateId);
  }, [existingNode, templateId]);

  const existingAnchor = useMemo(() => {
    if (!initial.anchorId) return null;
    return anchors.find((anchor) => anchor.id === initial.anchorId) ?? null;
  }, [anchors, initial.anchorId]);

  const showTypePicker =
    mode === "create" && templateId === "custom" && !LOCKED_TEMPLATES.includes(templateId);

  const [step, setStep] = useState<FormStep>("details");
  const [title, setTitle] = useState(initial.title);
  const [kind, setKind] = useState<FocusNodeKind>(initial.kind);
  const [roomLabel, setRoomLabel] = useState(initial.locationLabel ?? "");
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(initial.anchorId);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(
    () => (existingAnchor ? anchorToPlace(existingAnchor) : null),
  );
  const [weekdays, setWeekdays] = useState<Weekday[]>(() => {
    if (initialWeekday !== undefined) return [initialWeekday];
    return [initial.schedule.weekday];
  });
  const [startTime, setStartTime] = useState(initial.schedule.startTime);
  const [endTime, setEndTime] = useState(
    initial.schedule.type === "class" ? initial.schedule.endTime : "10:00",
  );
  const [durationHours, setDurationHours] = useState(
    initial.schedule.type === "duration" ? initial.schedule.durationHours : 1,
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const usesClassSchedule = kind === "class";
  const allowMultipleWeekdays = mode === "create";

  const selectedAnchor = useMemo(
    () => (selectedAnchorId ? anchors.find((anchor) => anchor.id === selectedAnchorId) : null),
    [anchors, selectedAnchorId],
  );

  const summaryLine = useMemo(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !isValidTime(startTime)) return "";

    const dayLabel = formatWeekdaySummary(weekdays);
    const timeLabel = usesClassSchedule
      ? isValidTime(endTime)
        ? `${formatTimeLabel(startTime)}–${formatTimeLabel(endTime)}`
        : formatTimeLabel(startTime)
      : `${formatTimeLabel(startTime)} · ${durationHours}h`;

    const parts = [trimmedTitle, dayLabel, timeLabel];
    if (usesClassSchedule && roomLabel.trim()) {
      parts.push(roomLabel.trim());
    }
    return parts.join(" · ");
  }, [title, weekdays, startTime, endTime, durationHours, usesClassSchedule, roomLabel]);

  const validateDetailsStep = (): boolean => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError(
        usesClassSchedule ? "Enter the name of the class." : "Give this Focus Node a name.",
      );
      return false;
    }

    if (weekdays.length === 0) {
      setTitleError("Pick at least one day.");
      return false;
    }

    setTitleError(null);

    if (!isValidTime(startTime)) {
      setTitleError("Use 24-hour format like 09:30 for the start time.");
      return false;
    }

    if (usesClassSchedule) {
      if (!isValidTime(endTime)) {
        setTitleError("Use 24-hour format like 10:30 for the end time.");
        return false;
      }
      if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
        setTitleError("End time must be after the start time.");
        return false;
      }
    } else if (!Number.isFinite(durationHours) || durationHours <= 0) {
      setTitleError("Pick a session length.");
      return false;
    }

    return true;
  };

  const buildInput = (weekday: Weekday): FocusNodeInput | null => {
    if (!validateDetailsStep()) return null;

    if (!selectedAnchorId) {
      setLocationError(
        `Pick a place or choose "When I arrive". ${placeFieldCopy(kind).emptyHint}`,
      );
      return null;
    }

    setLocationError(null);

    const trimmedTitle = title.trim();
    const anchorId = selectedAnchorId;

    if (usesClassSchedule) {
      return {
        title: trimmedTitle,
        icon: kind,
        kind,
        locationLabel: roomLabel.trim() || null,
        anchorId,
        schedule: {
          type: "class",
          weekday,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
        },
      };
    }

    return {
      title: trimmedTitle,
      icon: kind,
      kind,
      locationLabel: roomLabel.trim() || null,
      anchorId,
      schedule: {
        type: "duration",
        weekday,
        startTime: startTime.trim(),
        durationHours,
      },
    };
  };

  const finishAfterSave = (daysToSave: Weekday[]) => {
    const todayWeekday = new Date().getDay() as Weekday;
    const nonTodayDays = daysToSave.filter((day) => day !== todayWeekday);

    if (returnToWeek) {
      router.replace(ROUTES.weekSchedule);
      return;
    }

    if (nonTodayDays.length === 0) {
      router.back();
      return;
    }

    const daySummary =
      nonTodayDays.length === 1
        ? WEEKDAY_FULL_LABELS[nonTodayDays[0]]
        : sortWeekdays(nonTodayDays)
            .map((day) => WEEKDAY_FULL_LABELS[day])
            .join(", ");

    Alert.alert(
      "Added to your week",
      `Session added to ${daySummary}. View it in This week — it will appear on Home on that day.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const handleSave = () => {
    const daysToSave = allowMultipleWeekdays ? weekdays : [weekdays[0]];
    if (!daysToSave.length) return;

    if (mode === "edit" && nodeId) {
      const input = buildInput(daysToSave[0]);
      if (!input) return;

      const result = updateFocusNode(nodeId, input);
      if (!result.success) {
        Alert.alert("Schedule conflict", result.error);
        return;
      }
    } else {
      for (const weekday of daysToSave) {
        const input = buildInput(weekday);
        if (!input) return;

        const result = addFocusNode(input);
        if (!result.success) {
          Alert.alert("Schedule conflict", result.error);
          return;
        }
      }
    }

    finishAfterSave(daysToSave);
  };

  const handleContinue = () => {
    if (!validateDetailsStep()) return;
    setLocationError(null);
    setStep("location");
  };

  const handleBack = () => {
    if (step === "location") {
      setStep("details");
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    if (!nodeId) return;

    if (deleteLocked) {
      Alert.alert(
        deleteLockReason === "penalty"
          ? "Can't delete during a penalty"
          : "Can't delete active session",
        deleteLockReason === "penalty"
          ? "This session stays on your schedule until the extra app lock ends."
          : "Finish this session before removing it from your schedule.",
      );
      return;
    }

    Alert.alert("Delete Focus Node", "Remove this session from your schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeFocusNode(nodeId);
          router.back();
        },
      },
    ]);
  };

  const handlePlaceSelected = (place: PlaceSelection, anchorId: string) => {
    setSelectedPlace(place);
    setSelectedAnchorId(anchorId);
    setLocationError(null);
  };

  const screenTitle =
    mode === "edit" ? KIND_EDIT_TITLES[kind] : TEMPLATE_CREATE_TITLES[templateId];

  const saveLabel =
    mode === "edit"
      ? "Save changes"
      : TEMPLATE_SAVE_LABELS[templateId];

  const canSave = Boolean(selectedAnchorId);
  const stepLabel = step === "details" ? "Details" : "Location";

  if (mode === "edit" && !existingNode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
        <ScreenHeader title="Edit Focus Node" subtitle="Loading…" />
        <FocusNodeFormSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 8,
            gap: 12,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === "location" ? "Back to details" : "Go back"}
            onPress={handleBack}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>

          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                fontSize: 24,
                lineHeight: 32,
                color: colors.foreground,
              }}
            >
              {screenTitle}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Regular",
                fontSize: 13,
                lineHeight: 18,
                color: colors.muted,
              }}
            >
              Step {step === "details" ? 1 : 2} of 2 · {stepLabel}
            </Text>
          </View>

          {mode === "edit" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                deleteLockReason === "penalty"
                  ? "Can't delete during a penalty"
                  : deleteLockReason === "active"
                    ? "Can't delete active session"
                    : "Delete Focus Node"
              }
              accessibilityState={{ disabled: deleteLocked }}
              onPress={handleDelete}
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: deleteLocked ? colors.border : colors.error,
                opacity: deleteLocked ? 0.45 : 1,
              }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={deleteLocked ? colors.muted : colors.error}
              />
            </Pressable>
          ) : null}
        </View>

        {step === "details" ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <FocusNodeDetailsStep
              kind={kind}
              showTypePicker={showTypePicker}
              title={title}
              onTitleChange={(value) => {
                setTitle(value);
                if (titleError) setTitleError(null);
              }}
              roomLabel={roomLabel}
              onRoomLabelChange={setRoomLabel}
              weekdays={weekdays}
              onWeekdaysChange={setWeekdays}
              allowMultipleWeekdays={allowMultipleWeekdays}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              endTime={endTime}
              onEndTimeChange={setEndTime}
              durationHours={durationHours}
              onDurationHoursChange={setDurationHours}
              onKindChange={setKind}
              titleError={titleError ?? undefined}
              colors={colors}
            />
          </ScrollView>
        ) : (
          <View style={{ flex: 1, minHeight: 0, paddingHorizontal: 16, paddingTop: 8 }}>
            <FocusNodeLocationStep
              kind={kind}
              summaryLine={summaryLine}
              selectedPlace={selectedPlace}
              anchors={anchors}
              selectedAnchorId={selectedAnchorId}
              onPlaceSelected={handlePlaceSelected}
              locationError={locationError ?? undefined}
              colors={colors}
            />
          </View>
        )}

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {step === "details" ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleContinue}
              style={{
                alignItems: "center",
                borderRadius: 14,
                backgroundColor: colors.primary,
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 16,
                  color: "#F0EDE9",
                }}
              >
                Continue
              </Text>
            </Pressable>
          ) : (
            <>
              {!canSave ? (
                <InlineFieldError
                  centered
                  message="Pick a place or choose “When I arrive”."
                />
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={handleSave}
                disabled={!canSave}
                style={{
                  alignItems: "center",
                  borderRadius: 14,
                  backgroundColor: canSave ? colors.primary : colors.border,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-Bold",
                    fontSize: 16,
                    color: "#F0EDE9",
                  }}
                >
                  {saveLabel}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
