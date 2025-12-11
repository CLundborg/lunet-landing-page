'use client';

import { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

export default function InfinitySnake() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hue, setHue] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [pathD, setPathD] = useState<string>('');
  const [headPoint, setHeadPoint] = useState<Point | null>(null);
  const trailRef = useRef<Point[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Generate smooth path from trail using quadratic bezier curves
  const generatePath = (): { path: string; headPoint: Point | null } => {
    if (trailRef.current.length < 2) {
      return { path: '', headPoint: trailRef.current[0] || null };
    }

    // Calculate points for 1000px trail
    let totalDistance = 0;
    const targetLength = 1000;
    const rawPoints: Point[] = [];

    // Start from the most recent position (head)
    for (let i = trailRef.current.length - 1; i >= 0; i--) {
      if (rawPoints.length === 0) {
        rawPoints.push(trailRef.current[i]);
      } else {
        const prevPoint = rawPoints[rawPoints.length - 1];
        const currentPoint = trailRef.current[i];
        const dx = prevPoint.x - currentPoint.x;
        const dy = prevPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (totalDistance + distance <= targetLength) {
          totalDistance += distance;
          rawPoints.push(currentPoint);
        } else {
          // Interpolate to get exact length
          const remaining = targetLength - totalDistance;
          const ratio = remaining / distance;
          const interpolatedX = prevPoint.x - dx * ratio;
          const interpolatedY = prevPoint.y - dy * ratio;
          rawPoints.push({ x: interpolatedX, y: interpolatedY });
          break;
        }
      }
    }

    // Reverse to get head to tail order
    rawPoints.reverse();

    if (rawPoints.length === 0) {
      return { path: '', headPoint: null };
    }

    if (rawPoints.length === 1) {
      return { path: `M ${rawPoints[0].x} ${rawPoints[0].y}`, headPoint: rawPoints[0] };
    }

    // Generate smooth curve using quadratic bezier curves
    let path = `M ${rawPoints[0].x} ${rawPoints[0].y}`;
    
    if (rawPoints.length === 2) {
      // Simple line for just 2 points
      path += ` L ${rawPoints[1].x} ${rawPoints[1].y}`;
    } else {
      // Calculate control points for smooth curves
      for (let i = 1; i < rawPoints.length; i++) {
        const curr = rawPoints[i];
        const next = rawPoints[Math.min(i + 1, rawPoints.length - 1)];
        
        // Control point is the current point, end point is midpoint to next
        const endX = i === rawPoints.length - 1 ? curr.x : (curr.x + next.x) / 2;
        const endY = i === rawPoints.length - 1 ? curr.y : (curr.y + next.y) / 2;
        
        if (i === 1) {
          // First curve: use current point as control
          path += ` Q ${curr.x} ${curr.y} ${endX} ${endY}`;
        } else {
          // Use smooth quadratic continuation (T command)
          // This automatically calculates control point for smooth curve
          path += ` T ${endX} ${endY}`;
        }
      }
    }

    return { path, headPoint: rawPoints[rawPoints.length - 1] };
  };

  useEffect(() => {
    // Handle window resize
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      // Add to trail if moved enough distance
      const lastPoint = trailRef.current[trailRef.current.length - 1];
      if (!lastPoint) {
        trailRef.current.push({ x: e.clientX, y: e.clientY });
      } else {
        const dx = e.clientX - lastPoint.x;
        const dy = e.clientY - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only add point if moved at least 1px (more points = smoother curve)
        if (distance > 1) {
          trailRef.current.push({ x: e.clientX, y: e.clientY });
        }
      }

      // Limit trail size to prevent memory issues
      if (trailRef.current.length > 1000) {
        trailRef.current = trailRef.current.slice(-800);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Slowly change colors (hue rotation)
    const colorInterval = setInterval(() => {
      setHue((prev) => (prev + 0.3) % 360);
    }, 50);

    // Animation loop to update rendering
    const animate = () => {
      setRenderTrigger((prev) => prev + 1);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(colorInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update path when renderTrigger changes (refs accessed in effect, not render)
  useEffect(() => {
    // Defer state update to avoid synchronous setState warning
    const rafId = requestAnimationFrame(() => {
      const result = generatePath();
      setPathD(result.path);
      setHeadPoint(result.headPoint);
    });
    return () => cancelAnimationFrame(rafId);
  }, [renderTrigger]);

  // Create gradient colors based on hue
  const color1 = `hsl(${hue}, 100%, 50%)`;
  const color2 = `hsl(${(hue + 60) % 360}, 100%, 50%)`;
  const color3 = `hsl(${(hue + 120) % 360}, 100%, 50%)`;

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="50%" stopColor={color2} />
          <stop offset="100%" stopColor={color3} />
        </linearGradient>
      </defs>
      {pathD && (
        <>
          <path
            d={pathD}
            fill="none"
            stroke="url(#snakeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Add head circle for snake effect */}
          {headPoint && (
            <circle
              cx={headPoint.x}
              cy={headPoint.y}
              r="14"
              fill={color1}
            />
          )}
        </>
      )}
    </svg>
  );
}
