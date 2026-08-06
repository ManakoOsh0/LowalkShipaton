/**
 * Legacy /streak route — redirects to Activity (opened from the home streak pill).
 */
import { Redirect } from "expo-router";

import { ROUTES } from "@/lib/routes";

export default function StreakScreen() {
  return <Redirect href={ROUTES.stats} />;
}
