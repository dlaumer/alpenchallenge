import Point from "@arcgis/core/geometry/Point";

/**
 * Computes a smoothed camera for following a rider,
 * preserving user tilt and zoom, and applying exponential smoothing to heading.
 *
 * @param {Camera} currentCamera - Current camera.
 * @param {Object} riderPos - { longitude, latitude, altitude, heading }.
 * @param {boolean} isFlyMode - True if fly mode, false if ride.
 * @param {number} smoothingFactor - Optional exponential smoothing factor (default 0.08).
 * @returns {Camera}
 */
export function getFollowCamera(currentCamera, riderPos, isFlyMode = false, smoothingFactor = 0.08) {
  const {
    longitude,
    latitude,
    altitude,
    heading: targetHeading
  } = riderPos;

  const currentHeading = currentCamera.heading;
  let delta = targetHeading - currentHeading;

  // Normalize to [-180, 180]
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  // Exponential smoothing
  let effectiveDelta = 1 - Math.exp(-smoothingFactor);
  const smoothedHeading = (currentHeading + delta * effectiveDelta + 360) % 360;

  // Determine new position
  let position;
  if (isFlyMode) {
    const behindM = 150;
    const upM = 80;
    const rad = (smoothedHeading + 180) * Math.PI / 180;
    const dx = behindM * Math.sin(rad);
    const dy = behindM * Math.cos(rad);
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos(latitude * Math.PI / 180);
    const deltaLat = dy / metersPerDegLat;
    const deltaLon = dx / metersPerDegLon;

    position = new Point({
      latitude: latitude + deltaLat,
      longitude: longitude + deltaLon,
      z: altitude + upM
    });
  } else {
    position = new Point({
      latitude,
      longitude,
      z: altitude
    });
  }

  return currentCamera.clone().set({
    position,
    heading: smoothedHeading,
    tilt: isFlyMode ?  65 : 90,
    fov: currentCamera.fov
  });
}
