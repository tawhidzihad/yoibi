declare module "canvas-confetti" {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    flat?: boolean;
    ticks?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  interface CreateTypes {
    (options?: Options): Promise<null> | null;
    reset: () => void;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null> | null;
    reset: () => void;
    create: (canvas: HTMLCanvasElement, options?: GlobalOptions) => CreateTypes;
    shapeFromPath: (opts: { path: string; matrix?: number[] }) => unknown;
    shapeFromText: (opts: { text: string; scalar?: number; color?: string; fontFamily?: string }) => unknown;
  }

  const confetti: ConfettiFunction;
  export default confetti;

  export type { Options, GlobalOptions, CreateTypes };
}
