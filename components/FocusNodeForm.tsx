/**
 * Shared Focus Node create/edit form — 2-step wizard keeps schedule and location separate.
 * Location must be a searched real venue (native geocode); optional GPS calibrate is separate.
 */
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { formatTimeLabel, parseTimeToMinutes } from "@/lib/time";
import { createNodeFromTemplate } from "@/store/seed";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { FocusNodeTemplateId } from "@/data/quickActions";
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

const LOCKED_TEMPLATES: FocusNodeTemplateId[] = ["class", "gym", "library"];

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
};

export function FocusNodeForm({ mode, nodeId, templateId = "custom" }: FocusNodeFormProps) {
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
  const [weekday, setWeekday] = useState<Weekday>(initial.schedule.weekday);
  const [startTime, setStartTime] = useState(initial.schedule.startTime);
  const [endTime, setEndTime] = useState(
    initial.schedule.type === "class" ? initial.schedule.endTime : "10:00",
  );
  const [durationHours, setDurationHours] = useState(
    initial.schedule.type === "duration" ? initial.schedule.durationHours : 1,
  );

  const usesClassSchedule = kind === "class";

  const selectedAnchor = useMemo(
    () => (selectedAnchorId ? anchors.find((anchor) => anchor.id === selectedAnchorId) : null),
    [anchors, selectedAnchorId],
  );

  const summaryLine = useMemo(() => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !isValidTime(startTime)) return "";

    const dayLabel = WEEKDAY_LABELS[weekday];
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
  }, [title, weekday, startTime, endTime, durationHours, usesClassSchedule, roomLabel]);

  const validateDetailsStep = (): boolean => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert(
        usesClassSchedule ? "Missing class name" : "Missing title",
        usesClassSchedule ? "Enter the name of the class." : "Give this Focus Node a name.",
      );
      return false;
    }

    if (usesClassSchedule && !roomLabel.trim()) {
      Alert.alert("Missing room", "Enter the room or hall label (e.g. IT 4-1).");
      return false;
    }

    if (!isValidTime(startTime)) {
      Alert.alert("Invalid start time", "Use 24-hour format like 09:30.");
      return false;
    }

    if (usesClassSchedule) {
      if (!isValidTime(endTime)) {
        Alert.alert("Invalid end time", "Use 24-hour format like 10:30.");
        return false;
      }
      if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
        Alert.alert("Invalid time range", "End time must be after the start time.");
        return false;
      }
    } else if (!Number.isFinite(durationHours) || durationHours <= 0) {
      Alert.alert("Invalid duration", "Pick a session length.");
      return false;
    }

    return true;
  };

  const buildInput = (): FocusNodeInput | null => {
    if (!validateDetailsStep()) return null;

    if (!selectedAnchorId) {
      Alert.alert("Missing location", placeFieldCopy(kind).emptyHint);
      return null;
    }

    const trimmedTitle = title.trim();
    const anchorId = selectedAnchorId;

    if (usesClassSchedule) {
      return {
        title: trimmedTitle,
        icon: kind,
        kind,
        locationLabel: roomLabel.trim(),
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

  const handleNext = () => {
    if (!validateDetailsStep()) return;
    setStep("location");
  };

  const handleBack = () => {
    if (step === "location") {
      setStep("details");
      return;
    }
    router.back();
  };

  const handleSave = () => {
    const input = buildInput();
    if (!input) return;

    if (mode === "edit" && nodeId) {
      const result = updateFocusNode(nodeId, input);
      if (!result.success) {
        Alert.alert("Schedule conflict", result.error);
        return;
      }
    } else {
      const result = addFocusNode(input);
      if (!result.success) {
        Alert.alert("Schedule conflict", result.error);
        return;
      }
    }

    router.back();
  };

  const handleDelete = () => {
    if (!nodeId) return;

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

  const handleSelectAnchor = (anchor: Anchor) => {
    setSelectedAnchorId(anchor.id);
    setSelectedPlace(anchorToPlace(anchor));
  };

  const handlePlaceSelected = (place: PlaceSelection, anchorId: string) => {
    setSelectedPlace(place);
    setSelectedAnchorId(anchorId);
  };

  const screenTitle =
    mode === "edit"
      ? usesClassSchedule
        ? "Edit Class"
        : "Edit Focus Node"
      : usesClassSchedule
        ? "New Class"
        : "New Focus Node";

  const saveLabel =
    mode === "edit"
      ? "Save changes"
      : usesClassSchedule
        ? "Create class"
        : "Create Focus Node";

  const canSave = Boolean(selectedAnchorId);

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

          <View style={{ flex: 1, gap: 4 }}>
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
            {!showTypePicker ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 11,
                    lineHeight: 16,
                    color: colors.muted,
                    textTransform: "capitalize",
                  }}
                >
                  {kind}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <StepIndicator currentStep={step} colors={colors} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === "details" ? (
            <FocusNodeDetailsStep
              kind={kind}
              showTypePicker={showTypePicker}
              title={title}
              onTitleChange={setTitle}
              roomLabel={roomLabel}
              onRoomLabelChange={setRoomLabel}
              weekday={weekday}
              onWeekdayChange={setWeekday}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              endTime={endTime}
              onEndTimeChange={setEndTime}
              durationHours={durationHours}
              onDurationHoursChange={setDurationHours}
              onKindChange={setKind}
              colors={colors}
            />
          ) : (
            <FocusNodeLocationStep
              kind={kind}
              summaryLine={summaryLine}
              selectedAnchor={selectedAnchor ?? null}
              selectedPlace={selectedPlace}
              anchors={anchors}
              selectedAnchorId={selectedAnchorId}
              onSelectAnchor={handleSelectAnchor}
              onPlaceSelected={handlePlaceSelected}
              colors={colors}
            />
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            gap: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          {step === "details" ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleNext}
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
                Next
              </Text>
            </Pressable>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep("details")}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    borderRadius: 14,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      fontSize: 16,
                      color: colors.foreground,
                    }}
                  >
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSave}
                  disabled={!canSave}
                  style={{
                    flex: 2,
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
              </View>

              {mode === "edit" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDelete}
                  style={{
                    alignItems: "center",
                    borderRadius: 14,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.error,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-Bold",
                      fontSize: 16,
                      color: colors.error,
                    }}
                  >
                    Delete Focus Node
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({
  currentStep,
  colors,
}: {
  currentStep: FormStep;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const steps: { id: FormStep; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "location", label: "Location" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
      }}
    >
      {steps.map((step, index) => {
        const active = step.id === currentStep;
        const completed =
          step.id === "details" && currentStep === "location";
        return (
          <View key={step.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {index > 0 ? (
              <Text style={{ fontFamily: "Poppins-Regular", fontSize: 13, color: colors.muted }}>
                ·
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: active || completed ? colors.primary : colors.border,
                }}
              />
              <Text
                style={{
                  fontFamily: active ? "Poppins-SemiBold" : "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: active ? colors.foreground : colors.muted,
                }}
              >
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
