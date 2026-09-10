import { VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE } from "./shaders"

export interface ProgramInfo {
  attributeLocation: number;
  program: WebGLProgram;
  uniforms: {
    angle: WebGLUniformLocation;
    cellSize: WebGLUniformLocation;
    containerSize: WebGLUniformLocation;
    devicePixelRatio: WebGLUniformLocation;
    lineColor: WebGLUniformLocation;
    time: WebGLUniformLocation;
    viewportSize: WebGLUniformLocation;
  };
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)

  if (!shader) {
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  }

  gl.deleteShader(shader)
  return null
}

export function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

  if (!vertexShader || !fragmentShader) {
    return null
  }

  const program = gl.createProgram()

  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program
  }

  gl.deleteProgram(program)
  return null
}

export function getProgramInfo(gl: WebGLRenderingContext, program: WebGLProgram): ProgramInfo | null {
  const attributeLocation = gl.getAttribLocation(program, "a_position")
  const angle = gl.getUniformLocation(program, "u_angle")
  const cellSize = gl.getUniformLocation(program, "u_cell_size")
  const containerSize = gl.getUniformLocation(program, "u_container_size")
  const devicePixelRatio = gl.getUniformLocation(program, "u_device_pixel_ratio")
  const lineColor = gl.getUniformLocation(program, "u_line_color")
  const time = gl.getUniformLocation(program, "u_time")
  const viewportSize = gl.getUniformLocation(program, "u_viewport_size")

  if (
    attributeLocation < 0 ||
    !angle ||
    !cellSize ||
    !containerSize ||
    !devicePixelRatio ||
    !lineColor ||
    !time ||
    !viewportSize
  ) {
    return null
  }

  return {
    attributeLocation,
    program,
    uniforms: {
      angle,
      cellSize,
      containerSize,
      devicePixelRatio,
      lineColor,
      time,
      viewportSize,
    },
  }
}

let colorResolveContext: CanvasRenderingContext2D | null | undefined

function getColorResolveContext(): CanvasRenderingContext2D | null | undefined {
  if (colorResolveContext !== undefined) {
    return colorResolveContext
  }

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  colorResolveContext = canvas.getContext("2d", {
    willReadFrequently: true,
  })

  return colorResolveContext
}

export function resolveLineColor(color: string, element: HTMLElement): Float32Array {
  const resolver = document.createElement("span")
  resolver.style.color = color
  resolver.style.opacity = "0"
  resolver.style.pointerEvents = "none"
  resolver.style.position = "absolute"
  element.appendChild(resolver)

  const resolvedColor = getComputedStyle(resolver).color
  resolver.remove()
  const context = getColorResolveContext()

  if (!context) {
    return new Float32Array([0.5, 0.5, 0.5, 1]);
  }

  context.clearRect(0, 0, 1, 1)
  context.fillStyle = resolvedColor
  context.fillRect(0, 0, 1, 1)
  const pixel = context.getImageData(0, 0, 1, 1).data

  return new Float32Array([
    pixel[0] / 255,
    pixel[1] / 255,
    pixel[2] / 255,
    pixel[3] / 255,
  ]);
}

export function isDarkMode(_colorScheme: MediaQueryList): boolean {
  return false
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
