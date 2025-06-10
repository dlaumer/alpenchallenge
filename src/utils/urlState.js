export function getStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    favorites: params.get("favorites")?.split(",").filter(Boolean) || [],
    selected: params.get("selected") || null,
    followed: params.get("followed") || null,
    time: params.get("time") || "live",
    mode: params.get("mode") || "fly",
    playing: params.get("playing") === "true",
    lang: params.get("lang") || "en"
  };
}

export function updateUrlFromState(state) {
  const params = new URLSearchParams();

  if (state.favorites?.length) params.set("favorites", state.favorites.join(","));
  if (state.selected) params.set("selected", state.selected);
  if (state.followed) params.set("followed", state.followed);
  if (state.time) params.set("time", state.time);
  if (state.mode) params.set("mode", state.mode);
  if (state.playing !== undefined) params.set("playing", state.playing);
  if (state.lang) params.set("lang", state.lang);

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
