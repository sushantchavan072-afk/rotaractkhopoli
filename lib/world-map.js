import DottedMap from 'dotted-map';

/**
 * Places locations on the dotted world map (the same projection as public/images/world-dots.svg,
 * built by scripts/build-world-map.mjs). Runs only on the server, at build time, so visitors never
 * download dotted-map.
 */
let map;
export const MAP_SIZE = { width: 198, height: 100 };

export function placeOnMap({ lat, lng, ...rest }) {
  map ??= new DottedMap({ height: 100, grid: 'diagonal' });
  const pin = map.getPin({ lat, lng });
  return { ...rest, x: pin.x, y: pin.y };
}
