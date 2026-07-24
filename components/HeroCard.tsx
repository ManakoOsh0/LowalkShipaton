/**
 * Hero Card — TRMNL Classic paper block on the home dashboard.
 * Fixed shell for active sessions and footer CTAs; compact only for lightweight states.
 */
import { View } from "react-native";

import { HeroActiveTimer } from "@/components/hero/HeroActiveTimer";
import { HeroCounterProgress } from "@/components/hero/HeroCounterProgress";
import { HeroFocusLedger } from "@/components/hero/HeroFocusLedger";
import { HeroUpNextPanel } from "@/components/hero/HeroUpNextPanel";
import { HeroEinkFlash } from "@/components/HeroEinkFlash";
import { HeroEinkFrame } from "@/components/HeroEinkFrame";
import { HeroMetricGrid } from "@/components/HeroMetricGrid";
import { TrmnlText } from "@/components/trmnl/TrmnlText";
import {
  formatTrmnlActionLabel,
  HERO_EINK_BUTTON_RADIUS,
  HERO_EINK_FOOTER_GAP,
  HERO_EINK_FOOTER_HEIGHT,
  HERO_EINK_HEADER_SLOT_HEIGHT,
  HERO_EINK_PADDING,
  TRMNL_THEME,
} from "@/lib/heroEink";
import type { HeroAction, HeroCardData } from "@/types/dashboard";

const SCREEN_PADDING = 16;

const HERO_TITLE_STYLE = { textAlign: "center" as const };

type HeroCardProps = HeroCardData & {
  onActionPress?: (action: HeroAction) => void;
};

type HeroFooterButtonProps = {
  label: string;
  onPress?: () => void;
};

function HeroFooterButton({ label, onPress }: HeroFooterButtonProps) {
  const displayLabel = formatTrmnlActionLabel(label);

  return (
    <HeroEinkFlash
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress}
      style={{
        height: HERO_EINK_FOOTER_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: HERO_EINK_BUTTON_RADIUS,
      }}
    >
      {({ inverted }) => (
        <TrmnlText
          variant="action"
          color={inverted ? "ink" : "inverse"}
          numberOfLines={1}
        >
          {displayLabel}
        </TrmnlText>
      )}
    </HeroEinkFlash>
  );
}

export function HeroCard({
  state,
  title,
  subtitle,
  action,
  countdownLabel,
  progressRatio,
  travelStats,
  focusLedger,
  upNext,
  locationLabel,
  onActionPress,
}: HeroCardProps) {
  const isActive = state === "active";
  const isUpNext = state === "up_next" && Boolean(upNext);
  const showLedger = state === "weekly_report" && Boolean(focusLedger);
  const showCountdown =
    (state === "on_the_way" || isActive) && Boolean(countdownLabel);
  const showAction = Boolean(action);
  const showFooter = showAction;
  const useFixedShell = showFooter;
  const useFluidFrame = isActive && !showFooter;
  const showTravelStats = Boolean(travelStats);
  const showProgress = progressRatio != null && progressRatio >= 0 && showCountdown;
  const showSubtitleAboveCountdown =
    Boolean(subtitle) && showCountdown && !isActive && !showTravelStats;
  const showSubtitleBelowCountdown =
    Boolean(subtitle) && showCountdown && isActive && !locationLabel;
  const showSubtitleOnly =
    Boolean(subtitle) && !showCountdown && !showTravelStats && !isUpNext;
  const progressFill = Math.min(Math.max(progressRatio ?? 0, 0), 1);

  return (
    <View style={{ marginTop: 22, paddingHorizontal: SCREEN_PADDING }}>
      <HeroEinkFrame
        journey={showLedger}
        compact={!showLedger && (!useFixedShell || useFluidFrame)}
      >
        {showLedger && focusLedger ? (
          <View style={{ padding: HERO_EINK_PADDING }}>
            <HeroFocusLedger ledger={focusLedger} />
          </View>
        ) : (
          <View
            style={
              useFixedShell
                ? { flex: 1, padding: HERO_EINK_PADDING }
                : { padding: HERO_EINK_PADDING }
            }
          >
            {useFixedShell ? (
              <View
                style={{
                  height: HERO_EINK_HEADER_SLOT_HEIGHT,
                  overflow: "hidden",
                }}
              >
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <TrmnlText
                    variant="title"
                    numberOfLines={2}
                    style={HERO_TITLE_STYLE}
                  >
                    {title}
                  </TrmnlText>
                </View>
                <View style={{ height: 2, backgroundColor: TRMNL_THEME.textPrimary, alignSelf: "stretch" }} />
              </View>
            ) : (
              <View style={{ marginBottom: 10, alignItems: "center" }}>
                <TrmnlText
                  variant="title"
                  numberOfLines={2}
                  style={HERO_TITLE_STYLE}
                >
                  {title}
                </TrmnlText>
                <View
                  style={{
                    height: 2,
                    marginTop: 8,
                    alignSelf: "stretch",
                    backgroundColor: TRMNL_THEME.textPrimary,
                  }}
                />
              </View>
            )}

            <View
              style={
                useFixedShell
                  ? { flex: 1, justifyContent: "center", overflow: "hidden" }
                  : { paddingVertical: isActive ? 4 : 10, justifyContent: "center" }
              }
            >
              {isActive && countdownLabel ? (
                <HeroActiveTimer
                  countdownLabel={countdownLabel}
                  locationLabel={locationLabel}
                  subtitle={subtitle}
                  progressRatio={progressRatio}
                />
              ) : null}

              {isUpNext && upNext ? (
                <HeroUpNextPanel upNext={upNext} travelStats={travelStats} />
              ) : null}

              {!isUpNext && showTravelStats && travelStats ? (
                <HeroMetricGrid stats={travelStats} />
              ) : null}

              {!isUpNext && showSubtitleOnly ? (
                <TrmnlText variant="description" color="muted" numberOfLines={3}>
                  {subtitle}
                </TrmnlText>
              ) : null}

              {!isUpNext && !isActive && showCountdown ? (
                <View style={{ width: "100%", alignItems: "center", gap: 10 }}>
                  {showSubtitleAboveCountdown ? (
                    <TrmnlText
                      variant="description"
                      color="muted"
                      numberOfLines={3}
                      style={{ alignSelf: "stretch" }}
                    >
                      {subtitle}
                    </TrmnlText>
                  ) : null}

                  <TrmnlText variant="countdown" selectable>
                    {countdownLabel!}
                  </TrmnlText>

                  {showSubtitleBelowCountdown ? (
                    <TrmnlText
                      variant="description"
                      color="muted"
                      numberOfLines={2}
                      style={{ textAlign: "center" }}
                    >
                      {subtitle}
                    </TrmnlText>
                  ) : null}

                  {showProgress ? (
                    <View style={{ width: "100%", marginTop: 2 }}>
                      <HeroCounterProgress progressRatio={progressFill} />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            {showFooter ? (
              <View
                style={{
                  marginTop: HERO_EINK_FOOTER_GAP,
                  height: HERO_EINK_FOOTER_HEIGHT,
                }}
              >
                {showAction && action ? (
                  <HeroFooterButton
                    label={action.label}
                    onPress={() => onActionPress?.(action)}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </HeroEinkFrame>
    </View>
  );
}
