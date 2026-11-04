"use strict";
(function(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.WardNursingNavigation = api;
})(typeof globalThis === "object" ? globalThis : this, function() {
  const BOUNDS = { minX: -5.7, maxX: 5.7, minZ: -6.7, maxZ: 6.7 };
  const START = { x: 0, z: 2.4 };
  const OBSTACLES = [
    { x: 0, z: -1.7, w: 4, d: 1.6 },
    { x: -5.25, z: -3.35, w: 1.15, d: 1.2 },
    { x: 4.15, z: 1.05, w: 1.15, d: .72 },
    { x: 4.75, z: -6.82, w: 1.8, d: .16 }
  ];
  const TARGETS = {
    schedule: { x: -4.2, z: -5.45 },
    recordA: { x: -1.25, z: -1.15 },
    recordB: { x: 0, z: -1.15 },
    recordC: { x: 1.25, z: -1.15 },
    recorder: { x: 2.4, z: -1.15 },
    keypad: { x: 3.35, z: -1.15 },
    drawer: { x: -2.82, z: -2.3 },
    file: { x: -3.05, z: -2.45 },
    elevatorCard: { x: -2.58, z: -2.45 },
    elevatorReader: { x: 3.75, z: -5.65 }
  };

  function canStand(point) {
    const radius = .28;
    if (point.x < BOUNDS.minX + radius || point.x > BOUNDS.maxX - radius ||
        point.z < BOUNDS.minZ + radius || point.z > BOUNDS.maxZ - radius) return false;
    return !OBSTACLES.some(box =>
      Math.abs(point.x - box.x) < box.w / 2 + radius &&
      Math.abs(point.z - box.z) < box.d / 2 + radius);
  }

  function move(position, yaw, forward, right, distance) {
    const length = Math.hypot(forward, right);
    if (!length) return { x: position.x, z: position.z };
    const f = forward / length, r = right / length;
    const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * r) * distance;
    const dz = (-Math.cos(yaw) * f - Math.sin(yaw) * r) * distance;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .08));
    const point = { x: position.x, z: position.z };
    for (let i = 0; i < steps; i++) {
      if (canStand({ x: point.x + dx / steps, z: point.z })) point.x += dx / steps;
      if (canStand({ x: point.x, z: point.z + dz / steps })) point.z += dz / steps;
    }
    return point;
  }

  function withinReach(player, target) {
    return Math.hypot(player.x - target.x, player.z - target.z) <= 2.4;
  }

  return { BOUNDS, START, OBSTACLES, TARGETS, canStand, move, withinReach };
});
