export function detectPlatform() {
  if (window.navigator.userAgent.indexOf("Mac") !== -1) {
    return "Mac OS";
  }

  return "Linux";
}

export function joinPath(path, platform) {
  return path.join("/");
}

export function localPath(platform) {
  return "$BASE";
}

export function basePath(platform) {
  if (platform === "Mac OS") {
    return joinPath(
      ["$HOME", "Library", "Application Support", "lnd"],
      platform
    );
  }

  return joinPath(["~", ".lnd"], platform);
}
