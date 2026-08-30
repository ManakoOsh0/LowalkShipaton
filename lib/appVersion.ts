import Constants from "expo-constants";

/** User-facing version string from app config (e.g. "1.0.0"). */
export function getAppVersionLabel(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

/** Optional native build number when running a dev or store build. */
export function getAppBuildLabel(): string | null {
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const androidBuild = Constants.expoConfig?.android?.versionCode;
  const build = iosBuild ?? (androidBuild != null ? String(androidBuild) : null);
  return build?.trim() ? build : null;
}

export function getAboutVersionLine(): string {
  const build = getAppBuildLabel();
  const version = getAppVersionLabel();
  return build ? `Version ${version} (${build})` : `Version ${version}`;
}
