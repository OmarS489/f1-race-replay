import type { TrackBounds } from '../types';

export interface TransformParams {
  scale: number;
  tx: number;
  ty: number;
  cosRot: number;
  sinRot: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculate transform parameters to fit track within canvas with rotation
 */
export function calculateTransform(
  bounds: TrackBounds,
  canvasWidth: number,
  canvasHeight: number,
  rotation: number, // degrees
  leftMargin: number = 0,
  rightMargin: number = 0
): TransformParams {
  const padding = 0.05;
  const radians = (rotation * Math.PI) / 180;
  const cosRot = Math.cos(radians);
  const sinRot = Math.sin(radians);

  const worldCx = (bounds.x_min + bounds.x_max) / 2;
  const worldCy = (bounds.y_min + bounds.y_max) / 2;

  // Calculate rotated bounds
  const corners = [
    { x: bounds.x_min, y: bounds.y_min },
    { x: bounds.x_max, y: bounds.y_min },
    { x: bounds.x_max, y: bounds.y_max },
    { x: bounds.x_min, y: bounds.y_max },
  ];

  const rotatedCorners = corners.map((c) => {
    const tx = c.x - worldCx;
    const ty = c.y - worldCy;
    return {
      x: tx * cosRot - ty * sinRot + worldCx,
      y: tx * sinRot + ty * cosRot + worldCy,
    };
  });

  const rotatedXMin = Math.min(...rotatedCorners.map((c) => c.x));
  const rotatedXMax = Math.max(...rotatedCorners.map((c) => c.x));
  const rotatedYMin = Math.min(...rotatedCorners.map((c) => c.y));
  const rotatedYMax = Math.max(...rotatedCorners.map((c) => c.y));

  const rotatedW = rotatedXMax - rotatedXMin;
  const rotatedH = rotatedYMax - rotatedYMin;

  // Available space after margins
  const innerW = canvasWidth - leftMargin - rightMargin;
  const usableW = innerW * (1 - 2 * padding);
  const usableH = canvasHeight * (1 - 2 * padding);

  const scaleX = usableW / rotatedW;
  const scaleY = usableH / rotatedH;
  const scale = Math.min(scaleX, scaleY);

  const screenCx = leftMargin + innerW / 2;
  const screenCy = canvasHeight / 2;

  const tx = screenCx - scale * worldCx;
  const ty = screenCy - scale * worldCy;

  return { scale, tx, ty, cosRot, sinRot, centerX: worldCx, centerY: worldCy };
}

/**
 * Transform world coordinates to screen coordinates
 */
export function worldToScreen(
  x: number,
  y: number,
  params: TransformParams
): { x: number; y: number } {
  // Rotate around center
  const dx = x - params.centerX;
  const dy = y - params.centerY;
  const rx = dx * params.cosRot - dy * params.sinRot + params.centerX;
  const ry = dx * params.sinRot + dy * params.cosRot + params.centerY;

  // Scale and translate
  return {
    x: params.scale * rx + params.tx,
    y: params.scale * ry + params.ty,
  };
}

/**
 * Interpolate points for smoother track curves
 */
export function interpolatePoints(
  points: [number, number][],
  numPoints: number = 2000
): [number, number][] {
  if (points.length < 2) return points;

  const result: [number, number][] = [];
  const tOld = points.map((_, i) => i / (points.length - 1));
  const tNew = Array.from({ length: numPoints }, (_, i) => i / (numPoints - 1));

  for (const t of tNew) {
    // Find surrounding indices
    let idx = 0;
    for (let i = 0; i < tOld.length - 1; i++) {
      if (t >= tOld[i] && t <= tOld[i + 1]) {
        idx = i;
        break;
      }
    }

    // Linear interpolation
    const ratio = (t - tOld[idx]) / (tOld[idx + 1] - tOld[idx] || 1);
    const x = points[idx][0] + ratio * (points[idx + 1][0] - points[idx][0]);
    const y = points[idx][1] + ratio * (points[idx + 1][1] - points[idx][1]);
    result.push([x, y]);
  }

  return result;
}

/**
 * Format time in seconds to HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format wind direction to compass direction
 */
export function formatWindDirection(degrees: number | null): string {
  if (degrees === null) return 'N/A';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round((degrees % 360) / 22.5) % 16;
  return dirs[idx];
}

/**
 * Get track status color
 */
export function getTrackStatusColor(status: string): number {
  const colors: Record<string, number> = {
    GREEN: 0x969696,
    '1': 0x969696, // Green
    '2': 0xdcb400, // Yellow
    '4': 0xb46420, // Safety car
    '5': 0xc81e1e, // Red
    '6': 0xc88232, // VSC
    '7': 0xc88232, // VSC ending
  };
  return colors[status] ?? 0x969696;
}

/**
 * Get tyre compound name from number
 */
export function getTyreCompound(num: number): string {
  const compounds: Record<number, string> = {
    1: 'SOFT',
    2: 'MEDIUM',
    3: 'HARD',
    4: 'INTERMEDIATE',
    5: 'WET',
  };
  return compounds[num] ?? 'UNKNOWN';
}
