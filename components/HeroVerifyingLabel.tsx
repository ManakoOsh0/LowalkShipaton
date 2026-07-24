/**
 * HeroVerifyingLabel — two-frame blink for TRMNL verification copy.
 */
import { useEffect, useState } from "react";

import { TrmnlText } from "@/components/trmnl/TrmnlText";

const BLINK_MS = 600;

export function HeroVerifyingLabel() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((current) => !current);
    }, BLINK_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <TrmnlText
      variant="labelSmall"
      color="muted"
      style={{ textAlign: "center", opacity: visible ? 1 : 0.25 }}
    >
      Verifying…
    </TrmnlText>
  );
}
