/**
 * HeroStatusPill — hero state as Framework title_bar.
 */
import { HeroVerifyingPulse } from "@/components/hero/HeroVerifyingPulse";
import { TrmnlTitleBar } from "@/components/trmnl/TrmnlTitleBar";

type HeroStatusPillProps = {
  label: string;
  motionKey?: string;
  reduceMotion?: boolean;
  verifyPulse?: boolean;
};

export function HeroStatusPill({
  label,
  motionKey,
  reduceMotion = false,
  verifyPulse = false,
}: HeroStatusPillProps) {
  return (
    <HeroVerifyingPulse active={verifyPulse}>
      <TrmnlTitleBar
        title={label}
        motionKey={motionKey}
        reduceMotion={reduceMotion}
      />
    </HeroVerifyingPulse>
  );
}
