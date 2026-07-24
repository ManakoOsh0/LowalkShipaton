/**
 * Weekly schedule screen — full Mon–Sun view of recurring Focus Nodes.
 * Reachable from the Home "View all" link beside Today's plan.
 */
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TodayScheduleCard } from "@/components/TodayScheduleCard";
import { ROUTES } from "@/lib/routes";
import { useScheduleStore } from "@/store/useScheduleStore";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function WeekScheduleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const getWeekSchedule = useScheduleStore((state) => state.getWeekSchedule);
  const week = getWeekSchedule();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
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

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Poppins-Bold",
              fontSize: 24,
              lineHeight: 32,
              color: colors.foreground,
            }}
          >
            This week
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontFamily: "Poppins-Regular",
              fontSize: 13,
              lineHeight: 18,
              color: colors.muted,
            }}
          >
            Your recurring Focus Node schedule
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {week.map((day) => (
          <View key={day.weekday}>
            <View
              style={{
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-Bold",
                  fontSize: 16,
                  lineHeight: 22,
                  color: colors.foreground,
                }}
              >
                {day.dayLabel}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.muted,
                }}
              >
                {day.dateLabel}
              </Text>
              {day.isToday ? (
                <View
                  style={{
                    borderRadius: 999,
                    backgroundColor: colors.skyDeep,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins-SemiBold",
                      fontSize: 11,
                      lineHeight: 14,
                      color: "#FFFFFF",
                    }}
                  >
                    Today
                  </Text>
                </View>
              ) : null}
            </View>

            {day.items.length > 0 ? (
              <TodayScheduleCard
                items={day.items}
                onItemPress={(item) =>
                  router.push(ROUTES.sessionDetail(item.id, day.dateIso))
                }
              />
            ) : (
              <Text
                style={{
                  fontFamily: "Poppins-Regular",
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.muted,
                }}
              >
                No sessions scheduled
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
