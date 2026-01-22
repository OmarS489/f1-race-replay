import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { TrackData, RaceFrame, TrackStatus } from '../../types';
import {
  calculateTransform,
  worldToScreen,
  interpolatePoints,
  getTrackStatusColor,
} from '../../utils/trackGeometry';
import { usePlaybackStore } from '../../stores/playbackStore';

interface TrackCanvasProps {
  trackData: TrackData;
  frames: RaceFrame[];
  driverColors: Record<string, string>;
  trackStatuses: TrackStatus[];
  circuitRotation: number;
}

export default function TrackCanvas({
  trackData,
  frames,
  driverColors,
  trackStatuses,
  circuitRotation,
}: TrackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const graphicsRef = useRef<{
    trackInner: PIXI.Graphics;
    trackOuter: PIXI.Graphics;
    drsZones: PIXI.Graphics;
    drivers: Map<string, PIXI.Graphics>;
    labels: Map<string, PIXI.Text>;
  } | null>(null);

  const {
    frameIndex,
    tick,
    setTotalFrames,
    selectedDrivers,
    showDriverLabels,
    showDrsZones,
  } = usePlaybackStore();

  // Initialize Pixi application
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0x15151e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    // Create graphics containers
    const trackInner = new PIXI.Graphics();
    const trackOuter = new PIXI.Graphics();
    const drsZones = new PIXI.Graphics();
    const driversContainer = new PIXI.Container();
    const labelsContainer = new PIXI.Container();

    app.stage.addChild(trackInner);
    app.stage.addChild(trackOuter);
    app.stage.addChild(drsZones);
    app.stage.addChild(driversContainer);
    app.stage.addChild(labelsContainer);

    graphicsRef.current = {
      trackInner,
      trackOuter,
      drsZones,
      drivers: new Map(),
      labels: new Map(),
    };

    // Set total frames
    setTotalFrames(frames.length);

    // Animation loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      tick(deltaTime);
    };
    app.ticker.add(animate);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !appRef.current) return;
      appRef.current.renderer.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true, { children: true, texture: true });
    };
  }, [frames.length, setTotalFrames, tick]);

  // Draw track and update every frame
  useEffect(() => {
    if (!appRef.current || !graphicsRef.current || !trackData) return;

    const app = appRef.current;
    const graphics = graphicsRef.current;
    const width = app.renderer.width / app.renderer.resolution;
    const height = app.renderer.height / app.renderer.resolution;

    // Calculate transform
    const transform = calculateTransform(
      trackData.bounds,
      width,
      height,
      circuitRotation,
      320, // left margin for UI
      260  // right margin for UI
    );

    // Interpolate points for smoother curves
    const innerPoints = interpolatePoints(trackData.inner_points);
    const outerPoints = interpolatePoints(trackData.outer_points);

    // Get current track status
    const currentFrame = frames[Math.floor(frameIndex)] || frames[0];
    const currentTime = currentFrame?.t || 0;
    let trackStatus = '1'; // Green
    for (const status of trackStatuses) {
      if (
        status.start_time <= currentTime &&
        (status.end_time === null || currentTime < status.end_time)
      ) {
        trackStatus = status.status;
        break;
      }
    }
    const trackColor = getTrackStatusColor(trackStatus);

    // Draw inner track
    graphics.trackInner.clear();
    graphics.trackInner.lineStyle(4, trackColor, 1);
    const innerScreenPoints = innerPoints.map(([x, y]) =>
      worldToScreen(x, y, transform)
    );
    if (innerScreenPoints.length > 0) {
      graphics.trackInner.moveTo(innerScreenPoints[0].x, innerScreenPoints[0].y);
      for (let i = 1; i < innerScreenPoints.length; i++) {
        graphics.trackInner.lineTo(innerScreenPoints[i].x, innerScreenPoints[i].y);
      }
    }

    // Draw outer track
    graphics.trackOuter.clear();
    graphics.trackOuter.lineStyle(4, trackColor, 1);
    const outerScreenPoints = outerPoints.map(([x, y]) =>
      worldToScreen(x, y, transform)
    );
    if (outerScreenPoints.length > 0) {
      graphics.trackOuter.moveTo(outerScreenPoints[0].x, outerScreenPoints[0].y);
      for (let i = 1; i < outerScreenPoints.length; i++) {
        graphics.trackOuter.lineTo(outerScreenPoints[i].x, outerScreenPoints[i].y);
      }
    }

    // Draw DRS zones
    graphics.drsZones.clear();
    if (showDrsZones) {
      graphics.drsZones.lineStyle(6, 0x00ff00, 1);
      for (const zone of trackData.drs_zones) {
        const startIdx = Math.floor(
          (zone.start_index / trackData.outer_points.length) * outerScreenPoints.length
        );
        const endIdx = Math.floor(
          (zone.end_index / trackData.outer_points.length) * outerScreenPoints.length
        );
        if (startIdx < endIdx && startIdx < outerScreenPoints.length) {
          graphics.drsZones.moveTo(
            outerScreenPoints[startIdx].x,
            outerScreenPoints[startIdx].y
          );
          for (let i = startIdx + 1; i <= endIdx && i < outerScreenPoints.length; i++) {
            graphics.drsZones.lineTo(outerScreenPoints[i].x, outerScreenPoints[i].y);
          }
        }
      }
    }

    // Draw finish line
    if (outerScreenPoints.length > 0 && innerScreenPoints.length > 0) {
      const finishOuter = outerScreenPoints[0];
      const finishInner = innerScreenPoints[0];

      // Draw checkered line
      const numSquares = 8;
      const dx = (finishOuter.x - finishInner.x) / numSquares;
      const dy = (finishOuter.y - finishInner.y) / numSquares;

      for (let i = 0; i < numSquares; i++) {
        const isWhite = i % 2 === 0;
        graphics.drsZones.lineStyle(0);
        graphics.drsZones.beginFill(isWhite ? 0xffffff : 0x000000, 0.7);
        const x = finishInner.x + dx * i;
        const y = finishInner.y + dy * i;
        const size = Math.max(Math.abs(dx), Math.abs(dy));
        graphics.drsZones.drawRect(x - 2, y - 2, size + 2, 4);
        graphics.drsZones.endFill();
      }
    }

    // Draw drivers
    if (currentFrame) {
      // Remove old driver graphics
      for (const [code, graphic] of graphics.drivers) {
        if (!currentFrame.drivers[code]) {
          graphic.destroy();
          graphics.drivers.delete(code);
        }
      }
      for (const [code, label] of graphics.labels) {
        if (!currentFrame.drivers[code]) {
          label.destroy();
          graphics.labels.delete(code);
        }
      }

      // Sort drivers by position (draw leaders last so they appear on top)
      const sortedDrivers = Object.entries(currentFrame.drivers).sort(
        ([, a], [, b]) => b.position - a.position
      );

      for (const [code, data] of sortedDrivers) {
        const screenPos = worldToScreen(data.x, data.y, transform);
        const colorHex = driverColors[code] || '#ffffff';
        const colorNum = parseInt(colorHex.replace('#', ''), 16);
        const isSelected = selectedDrivers.includes(code);
        const isInPit = data.in_pit;

        // Get or create driver dot
        let driverGraphic = graphics.drivers.get(code);
        if (!driverGraphic) {
          driverGraphic = new PIXI.Graphics();
          app.stage.addChild(driverGraphic);
          graphics.drivers.set(code, driverGraphic);
        }

        driverGraphic.clear();

        // Draw glow effect for selected drivers
        if (isSelected) {
          driverGraphic.beginFill(colorNum, 0.25);
          driverGraphic.drawCircle(0, 0, 18);
          driverGraphic.endFill();
          driverGraphic.beginFill(colorNum, 0.15);
          driverGraphic.drawCircle(0, 0, 24);
          driverGraphic.endFill();
        }

        // Draw position ring for top 3
        if (data.position <= 3 && !isInPit) {
          const ringColor = data.position === 1 ? 0xffd700 : data.position === 2 ? 0xc0c0c0 : 0xcd7f32;
          driverGraphic.lineStyle(2, ringColor, 0.9);
          driverGraphic.drawCircle(0, 0, isSelected ? 11 : 9);
          driverGraphic.lineStyle(0);
        }

        // Main driver dot
        const dotAlpha = isInPit ? 0.5 : 1;
        driverGraphic.beginFill(colorNum, dotAlpha);
        driverGraphic.drawCircle(0, 0, isSelected ? 8 : 6);
        driverGraphic.endFill();

        // DRS active indicator (green glow on top)
        if (data.drs >= 10 && !isInPit) {
          driverGraphic.beginFill(0x00ff00, 0.8);
          driverGraphic.drawCircle(0, -(isSelected ? 11 : 9), 3);
          driverGraphic.endFill();
        }

        driverGraphic.x = screenPos.x;
        driverGraphic.y = screenPos.y;

        // Handle labels
        if (showDriverLabels || isSelected) {
          let label = graphics.labels.get(code);
          if (!label) {
            label = new PIXI.Text(code, {
              fontFamily: 'Arial',
              fontSize: 12,
              fill: colorNum,
              fontWeight: 'bold',
            });
            app.stage.addChild(label);
            graphics.labels.set(code, label);
          }
          label.visible = true;
          label.x = screenPos.x + 12;
          label.y = screenPos.y - 6;
          label.alpha = isInPit ? 0.5 : 1;
        } else {
          const label = graphics.labels.get(code);
          if (label) {
            label.visible = false;
          }
        }
      }
    }
  }, [
    trackData,
    frames,
    frameIndex,
    driverColors,
    trackStatuses,
    circuitRotation,
    selectedDrivers,
    showDriverLabels,
    showDrsZones,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}
