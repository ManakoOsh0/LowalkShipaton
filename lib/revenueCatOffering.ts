import type { PurchasesOffering, PurchasesOfferings } from "react-native-purchases";

import { REVENUECAT_PAYWALL_OFFERING_ID } from "@/lib/revenueCatConfig";

/** Dashboard lookup keys we accept when resolving the hosted paywall offering. */
const PAYWALL_OFFERING_FALLBACK_IDS = ["default 2", "default_2"] as const;

function normalizeOfferingKey(key: string): string {
  return key.replace(/_/g, " ").trim().toLowerCase();
}

function offeringMatchesPreferred(
  offering: PurchasesOffering | null | undefined,
  preferredNormalized: string,
): boolean {
  if (!offering) {
    return false;
  }
  return normalizeOfferingKey(offering.identifier) === preferredNormalized;
}

/** Dev-only: surfaces package context the native paywall module reads. */
export function logPaywallOfferingDiagnostics(offering: PurchasesOffering): void {
  if (!__DEV__) {
    return;
  }

  const firstPackage = offering.availablePackages[0];
  const contextId =
    firstPackage?.presentedOfferingContext?.offeringIdentifier ??
    firstPackage?.offeringIdentifier ??
    "none";

  console.log(
    "[RevenueCat] Paywall offering diagnostics:",
    `identifier=${offering.identifier}`,
    `packages=${offering.availablePackages.length}`,
    `presentedOfferingContext=${contextId}`,
  );
}

/**
 * Picks the offering that owns the hosted paywall. RevenueCat keys are exact
 * (e.g. "default 2" with a space); falling back to `current` can still point at
 * legacy `default` whose paywall is unpublished → generic fallback UI.
 */
export function pickPaywallOffering(offerings: PurchasesOfferings): PurchasesOffering | null {
  const preferredNormalized = normalizeOfferingKey(REVENUECAT_PAYWALL_OFFERING_ID);

  // Native presentPaywall uses the first package's presentedOfferingContext — prefer `current` when it matches.
  if (offeringMatchesPreferred(offerings.current, preferredNormalized)) {
    return offerings.current;
  }

  const candidates = [
    REVENUECAT_PAYWALL_OFFERING_ID,
    ...PAYWALL_OFFERING_FALLBACK_IDS,
  ].filter((id, index, list) => id.length > 0 && list.indexOf(id) === index);

  for (const candidate of candidates) {
    const direct = offerings.all[candidate];
    if (direct) {
      return direct;
    }
  }

  for (const [key, offering] of Object.entries(offerings.all)) {
    if (normalizeOfferingKey(key) === preferredNormalized) {
      return offering;
    }
  }

  for (const fallbackId of PAYWALL_OFFERING_FALLBACK_IDS) {
    const normalizedFallback = normalizeOfferingKey(fallbackId);
    for (const [key, offering] of Object.entries(offerings.all)) {
      if (normalizeOfferingKey(key) === normalizedFallback) {
        return offering;
      }
    }
  }

  if (__DEV__) {
    console.warn(
      "[RevenueCat] Paywall offering not found in offerings.all;",
      `wanted=${candidates.join(" | ")}`,
      `available=${Object.keys(offerings.all).join(", ") || "none"}`,
      `current=${offerings.current?.identifier ?? "none"}`,
    );
  }

  return offerings.current;
}
