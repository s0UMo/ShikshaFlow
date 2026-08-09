import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

export interface DarkVeilProps {
  hueShift?: number;
  noiseIntensity?: number;
  scanlineIntensity?: number;
  speed?: number;
  scanlineFrequency?: number;
  warpAmount?: number;
  resolutionScale?: number;
  className?: string;
  style?: React.CSSProperties;
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uHueShift;
uniform float uNoiseIntensity;
uniform float uScanlineIntensity;
uniform float uScanlineFrequency;
uniform float uWarpAmount;
uniform vec2 uResolution;

out vec4 fragColor;

vec3 hueRotate(vec3 col, float angle) {
  float rad = angle * 3.14159265 / 180.0;
  vec3 k = vec3(0.57735);
  float cosAngle = cos(rad);
  return col * cosAngle + cross(k, col) * sin(rad) + k * dot(k, col) * (1.0 - cosAngle);
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  
  vec2 warpUv = uv;
  float n = snoise(uv * 2.5 + vec2(uTime * 0.15)) * uWarpAmount;
  warpUv += vec2(sin(uTime * 0.2 + uv.y * 4.0), cos(uTime * 0.15 + uv.x * 4.0)) * 0.06 * uWarpAmount;
  warpUv += vec2(n * 0.04);

  // Darker ShikshaFlow Brand Colors
  vec3 col1 = vec3(0.01, 0.04, 0.03); // Near-black emerald base
  vec3 col2 = vec3(0.035, 0.16, 0.11); // Dark brand green (#3ecf8e subtle glow)
  vec3 col3 = vec3(0.01, 0.08, 0.12); // Dark cyan-teal (#06b6d4 accent)
  
  float vPattern = snoise(warpUv * 2.0 + uTime * 0.1);
  float vPattern2 = snoise(warpUv * 3.5 - uTime * 0.12);
  
  vec3 baseColor = mix(col1, col2, smoothstep(-0.4, 0.6, vPattern));
  baseColor = mix(baseColor, col3, smoothstep(-0.2, 0.8, vPattern2));
  
  baseColor = hueRotate(baseColor, uHueShift);

  if (uScanlineIntensity > 0.0) {
    float scanline = sin(gl_FragCoord.y * (uScanlineFrequency * 0.05)) * 0.5 + 0.5;
    baseColor *= (1.0 - (scanline * uScanlineIntensity * 0.25));
  }
  
  if (uNoiseIntensity > 0.0) {
    float rnd = (random(gl_FragCoord.xy + uTime) - 0.5) * uNoiseIntensity;
    baseColor += rnd;
  }
  
  float dist = distance(uv, vec2(0.5));
  baseColor *= (1.0 - dist * 0.75);

  fragColor = vec4(baseColor, 1.0);
}
`;

export const DarkVeil: React.FC<DarkVeilProps> = ({
  hueShift = 55,
  noiseIntensity = 0,
  scanlineIntensity = 1,
  speed = 0.3,
  scanlineFrequency = 32,
  warpAmount = 1,
  resolutionScale = 1,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, 2) * resolutionScale,
        alpha: true,
        premultipliedAlpha: false,
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';

    container.appendChild(canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uHueShift: { value: hueShift },
        uNoiseIntensity: { value: noiseIntensity },
        uScanlineIntensity: { value: scanlineIntensity },
        uScanlineFrequency: { value: scanlineFrequency },
        uWarpAmount: { value: warpAmount },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    }

    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;
    let totalTime = 0;
    let lastTime = performance.now();

    function update(t: number) {
      animationFrameId = requestAnimationFrame(update);
      const delta = (t - lastTime) * 0.001;
      lastTime = t;
      totalTime += delta * speed;
      program.uniforms.uTime.value = totalTime;
      program.uniforms.uHueShift.value = hueShift;
      program.uniforms.uNoiseIntensity.value = noiseIntensity;
      program.uniforms.uScanlineIntensity.value = scanlineIntensity;
      program.uniforms.uScanlineFrequency.value = scanlineFrequency;
      program.uniforms.uWarpAmount.value = warpAmount;

      renderer.render({ scene: mesh });
    }

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount, resolutionScale]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={style}
    />
  );
};

export default DarkVeil;
