import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  /** Whether confetti is active */
  active: boolean;
  /** Duration in ms before stopping (default: 3000) */
  duration?: number;
  /** Number of particles (default: 100) */
  particleCount?: number;
  /** Callback when confetti animation completes */
  onComplete?: () => void;
}

const COLORS = [
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Sky blue
  '#96CEB4', // Sage
  '#FFEAA7', // Cream yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
];

function createParticles(count: number, width: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }
  return particles;
}

/**
 * Confetti component for celebrating achievements.
 *
 * Features:
 * - Uses Canvas API for high-performance 60fps animation
 * - GPU-accelerated rendering
 * - Respects prefers-reduced-motion for accessibility
 * - Automatic cleanup on unmount
 */
export function Confetti({
  active,
  duration = 3000,
  particleCount = 100,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  // Keep callback ref up to date
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle active state changes
  useEffect(() => {
    if (!active || prefersReducedMotion) {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      isAnimatingRef.current = false;

      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    // Start animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particlesRef.current = createParticles(particleCount, canvas.width);
    startTimeRef.current = performance.now();
    isAnimatingRef.current = true;

    // Animation loop
    const animate = (timestamp: number) => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return;

      const ctx = currentCanvas.getContext('2d');
      if (!ctx) return;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Clear canvas
      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

      // Update and draw particles
      let hasVisibleParticles = false;
      const gravity = 0.15;

      particlesRef.current.forEach((particle) => {
        // Apply gravity
        particle.vy += gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;

        // Add slight horizontal drift
        particle.vx *= 0.99;

        // Fade out towards the end
        if (progress > 0.7) {
          particle.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
        }

        // Check if particle is still visible
        if (particle.y < currentCanvas.height + 50 && particle.opacity > 0) {
          hasVisibleParticles = true;

          // Draw particle
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.globalAlpha = particle.opacity;
          ctx.fillStyle = particle.color;

          // Draw rectangle confetti
          ctx.fillRect(
            -particle.size / 2,
            -particle.size / 4,
            particle.size,
            particle.size / 2
          );

          ctx.restore();
        }
      });

      // Continue animation if there are visible particles and duration hasn't exceeded
      if (hasVisibleParticles && progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        onCompleteRef.current?.();
      }
    };

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      isAnimatingRef.current = false;
    };
  }, [active, prefersReducedMotion, particleCount, duration]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isAnimatingRef.current) return;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Skip rendering entirely if reduced motion is preferred
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}

export type { ConfettiProps };
