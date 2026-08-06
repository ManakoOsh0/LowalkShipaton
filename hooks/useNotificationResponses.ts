import type { NotificationResponse } from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { ROUTES } from "@/lib/routes";
import {
  areSessionRemindersSupported,
  ensureNotificationHandler,
} from "@/services/sessionReminders";

type NotificationData = {
  nodeId?: string;
  type?: string;
};

function handleNotificationResponse(
  response: NotificationResponse,
  router: ReturnType<typeof useRouter>,
): void {
  const data = response.notification.request.content.data as NotificationData | undefined;
  const nodeId = typeof data?.nodeId === "string" ? data.nodeId : null;

  if (nodeId) {
    router.push(ROUTES.sessionDetail(nodeId));
    return;
  }

  router.push(ROUTES.home);
}

/**
 * Routes the user to the relevant screen when they tap a local notification.
 */
export function useNotificationResponses(): void {
  const router = useRouter();

  useEffect(() => {
    if (!areSessionRemindersSupported()) return;

    let subscription: { remove: () => void } | undefined;

    void (async () => {
      await ensureNotificationHandler();
      const Notifications = await import("expo-notifications");

      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        handleNotificationResponse(lastResponse, router);
      }

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response, router);
      });
    })();

    return () => subscription?.remove();
  }, [router]);
}
