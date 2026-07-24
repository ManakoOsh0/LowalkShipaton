export type Point = {
  x: number;
  y: number;
};

/** Angle at `middle` formed by segments first→middle and middle→last (degrees). */
export function calculateAngle(first: Point, middle: Point, last: Point): number {
  const vectorA = {
    x: first.x - middle.x,
    y: first.y - middle.y,
  };
  const vectorB = {
    x: last.x - middle.x,
    y: last.y - middle.y,
  };

  const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;
  const magnitudeA = Math.hypot(vectorA.x, vectorA.y);
  const magnitudeB = Math.hypot(vectorB.x, vectorB.y);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const cosine = Math.max(-1, Math.min(1, dotProduct / (magnitudeA * magnitudeB)));
  return Math.acos(cosine) * (180 / Math.PI);
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
