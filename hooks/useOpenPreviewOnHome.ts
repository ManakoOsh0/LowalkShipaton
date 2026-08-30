import { useRouter } from "expo-router";

import { ROUTES } from "@/lib/routes";

/** Switch to Home first so sheet/modal previews sit over the dashboard, not Settings. */
export function useOpenPreviewOnHome() {
  const router = useRouter();
  return (open: () => void) => {
    router.push(ROUTES.home);
    requestAnimationFrame(open);
  };
}
