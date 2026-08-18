/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { GradientBackground } from "./ui/noisy-gradient-backgrounds";

// 16-bit color palette (reduced color options)
const STAR_COLORS = [
  "#FFFFFF", // White
  "#FFFFAA", // Light yellow
  "#AAAAFF", // Light blue
  "#FFAAAA", // Light red
  "#AAFFAA", // Light green
  "#FFAAFF", // Light purple
  "#AAFFFF", // Light cyan
] as const;

// Configuration constants
const starDensity = 0.00004; // Reduced density for larger stars
const twinkleProbability = 0.7;
const minTwinkleSpeed = 2;
const maxTwinkleSpeed = 4;
const pixelSize = 5;
const starRegenerationInterval = 5000; // Interval to regenerate stars (in ms)
const percentToRegenerate = 0.15; // Percentage of stars to regenerate at each interval

// Shooting star configuration
const shootingStarPixelSize = 2;
const targetFps = 16; // 16 FPS for that retro feel

// Type definitions
type BackgroundStar = {
  x: number;
  y: number;
  color: string;
  baseOpacity: number;
  currentOpacity: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleDirection: number; // -1 fading out, 1 fading in
  twinkleTimer: number;
};

type TrailPoint = {
  x: number;
  y: number;
  opacity: number;
};

type ShootingStar = {
  id: number;
  x: number;
  y: number;
  angle: number;
  scale: number;
  speed: number;
  distance: number;
  trail: TrailPoint[];
};

type StartPoint = {
  x: number;
  y: number;
  angle: number;
};

export const BackgroundPixelStars = memo(
  () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const [isLight, setIsLight] = useState<boolean>(() => {
      if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('light');
      }
      return false;
    });

    useEffect(() => {
      const checkTheme = () => {
        const light = document.documentElement.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('light');
        setIsLight(light);
      };
      
      checkTheme();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && (mutation.attributeName === 'data-theme' || mutation.attributeName === 'class')) {
            checkTheme();
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });

      return () => observer.disconnect();
    }, []);

    // State references
    const backgroundStarsRef = useRef<BackgroundStar[]>([]);
    const shootingStarsRef = useRef<ShootingStar[]>([]);
    const lastRenderTimeRef = useRef<number>(0);
    const frameInterval: number = 1000 / targetFps;

    // Get random starting point for shooting stars
    const getRandomStartPoint = useCallback((): StartPoint => {
      // Start from anywhere along the top edge
      const x = Math.random() * window.innerWidth;
      const angle = 45 + Math.random() * 90;
      return { x, y: 0, angle };
    }, []);

    // Create a new shooting star
    const createNewShootingStar = useCallback((): ShootingStar => {
      const { x, y, angle } = getRandomStartPoint();
      return {
        id: Date.now(),
        x,
        y,
        angle,
        scale: 1,
        speed: Math.random() * 5 + 8,
        distance: 0,
        trail: [],
      };
    }, [getRandomStartPoint]);

    // Initialize background stars
    const initBackgroundStars = useCallback((): void => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      backgroundStarsRef.current = [];

      const area = canvas.width * canvas.height;
      const numStars = Math.floor(area * starDensity);

      for (let i = 0; i < numStars; i++) {
        const shouldTwinkle = Math.random() < twinkleProbability;
        const gridX = Math.floor(Math.random() * (canvas.width / pixelSize)) * pixelSize;
        const gridY = Math.floor(Math.random() * (canvas.height / pixelSize)) * pixelSize;
        const colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
        const baseOpacity = Math.random() * 0.5 + 0.5;

        backgroundStarsRef.current.push({
          x: gridX,
          y: gridY,
          color: STAR_COLORS[colorIndex]!,
          baseOpacity,
          currentOpacity: baseOpacity,
          twinkle: shouldTwinkle,
          twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
          twinkleDirection: -1,
          twinkleTimer: 0,
        });
      }
    }, []);

    // Regenerate a portion of background stars
    const regenerateBackgroundStars = useCallback((): void => {
      if (!canvasRef.current || backgroundStarsRef.current.length === 0) return;

      const canvas = canvasRef.current;
      const numToRegenerate = Math.max(
        1,
        Math.floor(backgroundStarsRef.current.length * percentToRegenerate),
      );

      for (let i = 0; i < numToRegenerate; i++) {
        const randomIndex = Math.floor(Math.random() * backgroundStarsRef.current.length);

        const shouldTwinkle = Math.random() < twinkleProbability;
        const gridX = Math.floor(Math.random() * (canvas.width / pixelSize)) * pixelSize;
        const gridY = Math.floor(Math.random() * (canvas.height / pixelSize)) * pixelSize;
        const colorIndex = Math.floor(Math.random() * STAR_COLORS.length);
        const baseOpacity = Math.random() * 0.5 + 0.5;

        backgroundStarsRef.current[randomIndex] = {
          x: gridX,
          y: gridY,
          color: STAR_COLORS[colorIndex]!,
          baseOpacity,
          currentOpacity: baseOpacity,
          twinkle: shouldTwinkle,
          twinkleSpeed: minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed),
          twinkleDirection: -1,
          twinkleTimer: 0,
        };
      }
    }, []);

    // Main animation loop
    const animateCanvas = useCallback(
      (timestamp: number): void => {
        if (timestamp - lastRenderTimeRef.current < frameInterval) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        lastRenderTimeRef.current = timestamp;

        if (!canvasRef.current) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          animationFrameRef.current = requestAnimationFrame(animateCanvas);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        backgroundStarsRef.current.forEach((star) => {
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.currentOpacity;
          ctx.fillRect(star.x, star.y, pixelSize, pixelSize);

          if (star.twinkle) {
            star.twinkleTimer += 1 / targetFps;

            if (star.twinkleTimer >= star.twinkleSpeed) {
              star.twinkleTimer = 0;
              star.twinkleDirection *= -1;
            }

            const progress = star.twinkleTimer / star.twinkleSpeed;
            if (progress < 0.5) {
              star.currentOpacity =
                star.twinkleDirection < 0 ? star.baseOpacity : star.baseOpacity * 0.3;
            } else {
              star.currentOpacity =
                star.twinkleDirection < 0 ? star.baseOpacity * 0.3 : star.baseOpacity;
            }
          }
        });

        if (shootingStarsRef.current.length) {
          const activeStars: ShootingStar[] = [];
          for (let s = 0; s < shootingStarsRef.current.length; s++) {
            const star = shootingStarsRef.current[s]!;
            star.x += star.speed * Math.cos((star.angle * Math.PI) / 180);
            star.y += star.speed * Math.sin((star.angle * Math.PI) / 180);
            star.distance += star.speed;

            if (star.distance % 8 < star.speed) {
              star.trail.push({ x: star.x, y: star.y, opacity: 1.0 });
            }

            for (let t = star.trail.length - 1; t >= 0; t--) {
              star.trail[t]!.opacity -= 0.1;
              if (star.trail[t]!.opacity <= 0) {
                star.trail.splice(t, 1);
              }
            }

            if (
              star.x >= -30 &&
              star.x <= window.innerWidth + 30 &&
              star.y >= -30 &&
              star.y <= window.innerHeight + 30
            ) {
              activeStars.push(star);
            }
          }
          shootingStarsRef.current = activeStars;

          shootingStarsRef.current.forEach((star) => {
            star.trail.forEach((point) => {
              ctx.save();
              ctx.translate(point.x, point.y);
              ctx.rotate((star.angle * Math.PI) / 180);
              ctx.translate(-point.x, -point.y);

              ctx.fillStyle = `rgba(180, 242, 255, ${point.opacity})`;
              ctx.fillRect(point.x, point.y, shootingStarPixelSize, shootingStarPixelSize);

              ctx.restore();
            });

            const starWidth = 4;
            const starHeight = 2;

            ctx.save();
            ctx.translate(star.x, star.y);
            ctx.rotate((star.angle * Math.PI) / 180);
            ctx.translate(-star.x, -star.y);

            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 1.0;

            for (let y = 0; y < starHeight; y++) {
              for (let x = 0; x < starWidth; x++) {
                if ((x === 0 && y === 1) || (x === 3 && y === 0)) continue;

                ctx.fillRect(
                  star.x + x * shootingStarPixelSize,
                  star.y + y * shootingStarPixelSize,
                  shootingStarPixelSize,
                  shootingStarPixelSize,
                );
              }
            }

            ctx.restore();
          });
        }

        animationFrameRef.current = requestAnimationFrame(animateCanvas);
      },
      [frameInterval],
    );

    // Initialize the component
    useEffect(() => {
      if (isLight || !canvasRef.current) return;

      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      initBackgroundStars();
      animationFrameRef.current = requestAnimationFrame(animateCanvas);

      let shootingStarTimeoutId: NodeJS.Timeout;
      const createShootingStar = (): void => {
        const newStar = createNewShootingStar();
        shootingStarsRef.current = [...shootingStarsRef.current, newStar];

        const randomDelay = Math.random() * 4000 + 2000;
        shootingStarTimeoutId = setTimeout(createShootingStar, randomDelay);
      };

      createShootingStar();
      const regenerationInterval = setInterval(regenerateBackgroundStars, starRegenerationInterval);

      const handleResize = (): void => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
          initBackgroundStars();
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        clearInterval(regenerationInterval);
        clearTimeout(shootingStarTimeoutId);
        window.removeEventListener("resize", handleResize);
      };
    }, [isLight, animateCanvas, createNewShootingStar, initBackgroundStars, regenerateBackgroundStars]);

    if (isLight) {
      return (
        <GradientBackground
          gradientOrigin="bottom-middle"
          noiseIntensity={1.0}
          noisePatternSize={90}
          noisePatternRefreshInterval={2}
          noisePatternAlpha={50}
        />
      );
    }

    return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
  }
);

export default BackgroundPixelStars;
