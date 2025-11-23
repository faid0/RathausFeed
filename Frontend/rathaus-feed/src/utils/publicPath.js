const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/$/, "");

export function withPublicPath(assetPath = "") {
  if (!assetPath) return PUBLIC_URL || "";
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return PUBLIC_URL ? `${PUBLIC_URL}${normalized}` : normalized;
}

export { PUBLIC_URL };
