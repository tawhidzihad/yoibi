"use client";
import React, { useEffect, useRef, useState } from "react"

import { cn } from "@/shared/lib"
import { ANIMATION_DURATION_SECONDS, PERSPECTIVE_PX } from "./shaders"
import { createProgram, getProgramInfo, resolveLineColor, isDarkMode, clamp } from "./webgl"
import type { ProgramInfo } from "./webgl"

const MAX_ANGLE = 89
const MAX_DEVICE_PIXEL_RATIO = 2
const MIN_ANGLE = 1
const FALLBACK_ANIMATION_NAME = "retro-grid-fallback-scroll"
const FALLBACK_STYLES = `
@keyframes ${FALLBACK_ANIMATION_NAME} {
  from {
    transform: translateY(-50%);
  }

  to {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-retro-grid-scroll="true"] {
    animation: none !important;
    transform: translateY(-50%) !important;
  }
}
`

function createFallbackGridStyle(cellSize: number, lineColor: string): React.CSSProperties {
  return {
    animation: `${FALLBACK_ANIMATION_NAME} ${ANIMATION_DURATION_SECONDS}s linear infinite`,
    backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 0), linear-gradient(to bottom, ${lineColor} 1px, transparent 0)`,
    backgroundRepeat: "repeat",
    backgroundSize: `${cellSize}px ${cellSize}px`,
    transform: "translateY(-50%)",
  }
}

interface RetroGridProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
  style?: React.CSSProperties;
}

export function RetroGrid({
  className,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
  style,
  ...props
}: RetroGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWebGlReady, setIsWebGlReady] = useState(false)
  const angleRef = useRef<number>(angle)
  const cellSizeRef = useRef<number>(cellSize)
  const darkLineColorRef = useRef<string>(darkLineColor)
  const lightLineColorRef = useRef<string>(lightLineColor)
  const syncSceneRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    angleRef.current = angle
    cellSizeRef.current = cellSize
    darkLineColorRef.current = darkLineColor
    lightLineColorRef.current = lightLineColor
    syncSceneRef.current?.()
  }, [angle, cellSize, darkLineColor, lightLineColor])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) {
      return
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")

    let animationFrameId: number | null = null
    let currentWidth = 0
    let currentHeight = 0
    let currentDevicePixelRatio = 1
    let gl: WebGLRenderingContext | null = null
    let isVisible = true
    let isContextLost = false
    let lineColor: Float32Array = resolveLineColor(lightLineColorRef.current, container)
    let positionBuffer: WebGLBuffer | null = null
    let programInfo: ProgramInfo | null = null

    const getContext = () => {
      const nextGl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      })

      if (!nextGl || !nextGl.getExtension("OES_standard_derivatives")) {
        return null
      }

      return nextGl
    }

    const releasePipeline = (shouldDeleteResources: boolean) => {
      if (shouldDeleteResources && gl) {
        if (positionBuffer) {
          gl.deleteBuffer(positionBuffer)
        }

        if (programInfo) {
          gl.deleteProgram(programInfo.program)
        }
      }

      positionBuffer = null
      programInfo = null

      if (shouldDeleteResources) {
        gl = null
      }
    }

    const initializePipeline = () => {
      const nextGl = getContext()

      if (!nextGl) {
        releasePipeline(false)
        return false
      }

      gl = nextGl
      releasePipeline(true)
      gl = nextGl

      const program = createProgram(nextGl)

      if (!program) {
        return false
      }

      const nextProgramInfo = getProgramInfo(nextGl, program)

      if (!nextProgramInfo) {
        nextGl.deleteProgram(program)
        return false
      }

      const nextPositionBuffer = nextGl.createBuffer()

      if (!nextPositionBuffer) {
        nextGl.deleteProgram(program)
        return false
      }

      nextGl.bindBuffer(nextGl.ARRAY_BUFFER, nextPositionBuffer)
      nextGl.bufferData(
        nextGl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        nextGl.STATIC_DRAW
      )

      positionBuffer = nextPositionBuffer
      programInfo = nextProgramInfo

      return true
    }

    const updateLineColor = () => {
      const activeColor = isDarkMode(colorScheme)
        ? darkLineColorRef.current
        : lightLineColorRef.current
      lineColor = resolveLineColor(activeColor, container)
    }

    const resizeCanvas = () => {
      currentWidth = Math.floor(container.clientWidth)
      currentHeight = Math.floor(container.clientHeight)

      if (currentWidth === 0 || currentHeight === 0 || !gl) {
        return
      }

      currentDevicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)

      canvas.width = Math.floor(currentWidth * currentDevicePixelRatio)
      canvas.height = Math.floor(currentHeight * currentDevicePixelRatio)
      canvas.style.width = `${currentWidth}px`
      canvas.style.height = `${currentHeight}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const draw = (timestamp: number) => {
      if (
        currentWidth === 0 ||
        currentHeight === 0 ||
        !gl ||
        !positionBuffer ||
        !programInfo ||
        isContextLost
      ) {
        return
      }

      gl.useProgram(programInfo.program)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.enableVertexAttribArray(programInfo.attributeLocation)
      gl.vertexAttribPointer(programInfo.attributeLocation, 2, gl.FLOAT, false, 0, 0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(programInfo.uniforms.angle, clamp(angleRef.current, MIN_ANGLE, MAX_ANGLE))
      gl.uniform1f(programInfo.uniforms.cellSize, Math.max(cellSizeRef.current, 1))
      gl.uniform2f(programInfo.uniforms.containerSize, currentWidth, currentHeight)
      gl.uniform1f(programInfo.uniforms.devicePixelRatio, currentDevicePixelRatio)
      gl.uniform4fv(programInfo.uniforms.lineColor, lineColor)
      gl.uniform1f(programInfo.uniforms.time, reducedMotion.matches ? 0 : timestamp / 1000)
      gl.uniform2f(programInfo.uniforms.viewportSize, window.innerWidth, window.innerHeight)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    const frame = (timestamp: number) => {
      draw(timestamp)

      if (!reducedMotion.matches && isVisible) {
        animationFrameId = requestAnimationFrame(frame)
        return
      }

      animationFrameId = null
    }

    const syncScene = () => {
      if (isContextLost) {
        stopAnimation()
        setIsWebGlReady(false)
        return
      }

      if (!gl || !positionBuffer || !programInfo) {
        if (!initializePipeline()) {
          stopAnimation()
          setIsWebGlReady(false)
          return
        }
      }

      resizeCanvas()

      if (currentWidth === 0 || currentHeight === 0) {
        stopAnimation()
        return
      }

      updateLineColor()
      draw(performance.now())
      setIsWebGlReady(true)

      if (reducedMotion.matches || !isVisible) {
        stopAnimation()
        return
      }

      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(frame)
      }
    }

    syncSceneRef.current = syncScene

    const resizeObserver = new ResizeObserver(() => {
      syncScene()
    })
    resizeObserver.observe(container)

    const handleWindowResize = () => {
      syncScene()
    }

    const intersectionObserver = new IntersectionObserver(([entry]: IntersectionObserverEntry[]) => {
      isVisible = entry?.isIntersecting ?? false

      if (isVisible) {
        syncScene()
        return
      }

      stopAnimation()
    })
    intersectionObserver.observe(container)

    const themeObserver = new MutationObserver(() => {
      syncScene()
    })
    themeObserver.observe(document.documentElement, {
      attributeFilter: ["class"],
      attributes: true,
    })

    const handleMotionChange = () => {
      syncScene()
    }

    const handleColorSchemeChange = () => {
      syncScene()
    }

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      isContextLost = true
      stopAnimation()
      releasePipeline(false)
      setIsWebGlReady(false)
    }

    const handleContextRestored = () => {
      isContextLost = false
      syncScene()
    }

    reducedMotion.addEventListener("change", handleMotionChange)
    colorScheme.addEventListener("change", handleColorSchemeChange)
    window.addEventListener("resize", handleWindowResize)
    canvas.addEventListener("webglcontextlost", handleContextLost)
    canvas.addEventListener("webglcontextrestored", handleContextRestored)

    syncScene()

    return () => {
      stopAnimation()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      themeObserver.disconnect()
      reducedMotion.removeEventListener("change", handleMotionChange)
      colorScheme.removeEventListener("change", handleColorSchemeChange)
      window.removeEventListener("resize", handleWindowResize)
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      canvas.removeEventListener("webglcontextrestored", handleContextRestored)
      syncSceneRef.current = null
      releasePipeline(!isContextLost)
    };
  }, [])

  const gridStyles: React.CSSProperties = {
    ...style,
    opacity
  }
  const normalizedAngle = clamp(angle, MIN_ANGLE, MAX_ANGLE)
  const normalizedCellSize = Math.max(cellSize, 1)
  const fallbackProjectionStyles: React.CSSProperties = {
    perspective: `${PERSPECTIVE_PX}px`
  }
  const fallbackRotationStyles: React.CSSProperties = {
    transform: `rotateX(${normalizedAngle}deg)`
  }
  const lightFallbackGridStyles = createFallbackGridStyle(normalizedCellSize, lightLineColor)
  const darkFallbackGridStyles = createFallbackGridStyle(normalizedCellSize, darkLineColor)

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute size-full overflow-hidden", className)}
      style={gridStyles}
      {...props}>
      <style>{FALLBACK_STYLES}</style>
      {!isWebGlReady ? (
        <div className="absolute inset-0" style={fallbackProjectionStyles}>
          <div className="absolute inset-0" style={fallbackRotationStyles}>
            <div
              data-retro-grid-scroll="true"
              className="absolute inset-[0%_0px] ml-[-200%] h-[300vh] w-[600vw] origin-[100%_0_0] dark:hidden"
              style={lightFallbackGridStyles} />
            <div
              data-retro-grid-scroll="true"
              className="absolute inset-[0%_0px] ml-[-200%] hidden h-[300vh] w-[600vw] origin-[100%_0_0] dark:block"
              style={darkFallbackGridStyles} />
          </div>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 size-full", isWebGlReady ? "opacity-100" : "opacity-0")} />
      <div
        className="absolute inset-0 bg-linear-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  );
}
