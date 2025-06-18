

export function getStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const camRaw = params.get("cam")?.split(",").map(Number);
  const cam = camRaw?.length === 5 ? camRaw : null;
  return {
    favorites: params.get("favorites")?.split(",").filter(Boolean) || [],
    selected: params.get("selected") || null,
    followed: params.get("followed") || null,
    time: params.get("time") || "live",
    mode: params.get("mode") || "fly",
    playing: params.get("playing") ? params.get("playing") === "true" : true,
    lang: params.get("lang") || "en",
    cam: cam
  };
}

export function updateUrlFromState(state) {
  const paramsOld = new URLSearchParams(window.location.search);
  if (paramsOld.get("time") !== "live" && state.time != paramsOld.get("time")) {
    if (Math.abs(state.time - paramsOld.get("time")) < 1000) {
      return; // Don't update URL if the time change is less than 1 second
    }
  }
  const params = new URLSearchParams();

  if (state.favorites?.length) params.set("favorites", state.favorites.join(","));
  if (state.selected) params.set("selected", state.selected);
  if (state.followed) params.set("followed", state.followed);
  if (state.time) params.set("time", state.time);
  if (state.mode) params.set("mode", state.mode);
  if (state.playing !== undefined) params.set("playing", state.playing);
  if (state.lang) params.set("lang", state.lang);
  if (state.camera && state.camera?.length === 5) {
    params.set("cam", state.camera.join(","));
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
