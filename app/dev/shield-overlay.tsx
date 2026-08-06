/**

 * Dev-only fullscreen preview for ShieldOverlayLayout — works in Expo Go without native shielding.

 */

import { useRouter } from "expo-router";



import { ShieldOverlayLayout } from "@/components/ShieldOverlayLayout";

import { getShieldOverlayCopy } from "@/lib/shieldOverlayCopy";



const PREVIEW_APP_NAME = "Instagram";



export default function ShieldOverlayPreviewScreen() {

  const router = useRouter();

  const copy = getShieldOverlayCopy({ appName: PREVIEW_APP_NAME });



  return (

    <ShieldOverlayLayout

      headline={copy.headline}

      subtitle={copy.subtitle}

      ctaLabel={copy.ctaLabel}

      onCtaPress={() => router.back()}

    />

  );

}

