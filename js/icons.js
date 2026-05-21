const SHAPE_ICONS = {
  circle: `<span class="segment-shape segment-shape--circle" aria-hidden="true"></span>`,
  triangle: `<span class="segment-shape segment-shape--triangle" aria-hidden="true"></span>`,
  square: `<span class="segment-shape segment-shape--square" aria-hidden="true"></span>`,
};

export function getSegmentIconHtml(type) {
  return SHAPE_ICONS[type] ?? SHAPE_ICONS.triangle;
}