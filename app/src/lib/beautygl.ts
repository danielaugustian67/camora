/**
 * WebGL2 beauty pass:
 *  - edge-preserving (bilateral) skin smoothing, restricted to a feathered face mask
 *    multiplied by a per-pixel skin-tone likelihood, with some micro texture re-added
 *  - skin brightening with a soft mid-tone curve
 *  - lipstick by luminance-preserving color transfer + specular gloss
 */
const VS = `#version 300 es
in vec2 p; out vec2 v;
void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`

const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D uSrc, uSkin, uLip;
uniform vec2 uTexel;
uniform float uRadius, uSmooth, uBright, uLipAmt, uGloss;
uniform vec3 uLipCol;

float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float skinLikelihood(vec3 c){
  float y = luma(c);
  float cb = 0.5 + (-0.168736*c.r - 0.331264*c.g + 0.5*c.b);
  float cr = 0.5 + (0.5*c.r - 0.418688*c.g - 0.081312*c.b);
  float a = smoothstep(0.24, 0.30, cb) * (1.0 - smoothstep(0.52, 0.58, cb));
  float b = smoothstep(0.50, 0.54, cr) * (1.0 - smoothstep(0.70, 0.76, cr));
  return a * b * smoothstep(0.06, 0.18, y);
}

void main(){
  vec3 c = texture(uSrc, v).rgb;
  float m = texture(uSkin, v).r;
  float lm = texture(uLip, v).r * uLipAmt;
  vec3 col = c;

  if (m > 0.004 && uSmooth > 0.0) {
    vec3 sum = c; float ws = 1.0;
    const int N = 32;
    float sig = 0.08 + 0.07 * uSmooth;
    for (int i = 0; i < N; i++) {
      float fi = float(i) + 0.5;
      float r = uRadius * sqrt(fi / float(N));
      float a = fi * 2.39996323;
      vec3 s = texture(uSrc, v + vec2(cos(a), sin(a)) * r * uTexel).rgb;
      vec3 d = s - c;
      float w = exp(-dot(d, d) / (2.0 * sig * sig)) * exp(-(r*r) / (2.0 * uRadius * uRadius * 0.45));
      sum += s * w; ws += w;
    }
    vec3 sm = sum / ws;
    float k = m * skinLikelihood(c) * uSmooth * 0.9;
    vec3 detail = c - sm;
    col = sm + detail * (1.0 - k) + detail * k * 0.15; // keep a bit of pore texture
    col = mix(c, col, step(0.0001, k));
  }

  if (uBright > 0.0) {
    float k = m * uBright;
    col += k * 0.22 * col * (1.0 - col);            // mid-tone lift
    col = mix(col, col * vec3(1.02, 1.0, 0.99), k);  // tiny warmth, keeps it alive
  }

  if (lm > 0.002) {
    float L = luma(col);
    // lipstick = pigment colour modulated by the lip's own shading (keeps creases, shadows, highlights)
    float shade = clamp(L / 0.42, 0.25, 1.35);
    vec3 pigment = uLipCol * shade;
    // tame chroma: real lipstick on skin reads less saturated than the swatch
    pigment = mix(vec3(luma(pigment)), pigment, 0.68);
    // keep part of the natural lip tone showing through the pigment
    vec3 lip = mix(pigment, col, 0.3);
    // satin/gloss highlight follows the brightest areas of the original lip
    float spec = smoothstep(0.45, 0.8, L) * uGloss;
    lip = mix(lip, vec3(1.0, 0.97, 0.97), spec * 0.35);
    col = mix(col, clamp(lip, 0.0, 1.0), lm);
  }
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

export class BeautyGL {
  canvas = document.createElement('canvas')
  private gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private tex: WebGLTexture[] = []
  private u: Record<string, WebGLUniformLocation | null> = {}

  static create(): BeautyGL | null {
    try { return new BeautyGL() } catch (e) { console.warn('WebGL2 beauty unavailable', e); return null }
  }

  private constructor() {
    const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true })
    if (!gl) throw new Error('no webgl2')
    this.gl = gl
    const sh = (t: number, s: string) => {
      const x = gl.createShader(t)!; gl.shaderSource(x, s); gl.compileShader(x)
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x) || 'shader')
      return x
    }
    const p = gl.createProgram()!
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link')
    this.prog = p
    gl.useProgram(p)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(p, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    for (const n of ['uSrc', 'uSkin', 'uLip', 'uTexel', 'uRadius', 'uSmooth', 'uBright', 'uLipAmt', 'uGloss', 'uLipCol']) this.u[n] = gl.getUniformLocation(p, n)
    for (let i = 0; i < 3; i++) {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      this.tex.push(t)
    }
    gl.uniform1i(this.u.uSrc, 0); gl.uniform1i(this.u.uSkin, 1); gl.uniform1i(this.u.uLip, 2)
  }

  run(src: HTMLCanvasElement, skin: HTMLCanvasElement, lip: HTMLCanvasElement, o: {
    radius: number; smooth: number; bright: number; lip: [number, number, number] | null; lipAmt: number; gloss: number
  }) {
    const gl = this.gl
    const w = src.width, h = src.height
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h }
    gl.viewport(0, 0, w, h)
    gl.useProgram(this.prog)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    ;[src, skin, lip].forEach((img, i) => {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, this.tex[i])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    })
    gl.uniform2f(this.u.uTexel, 1 / w, 1 / h)
    gl.uniform1f(this.u.uRadius, o.radius)
    gl.uniform1f(this.u.uSmooth, o.smooth)
    gl.uniform1f(this.u.uBright, o.bright)
    gl.uniform1f(this.u.uLipAmt, o.lip ? o.lipAmt : 0)
    gl.uniform1f(this.u.uGloss, o.gloss)
    gl.uniform3f(this.u.uLipCol, ...(o.lip ?? [0, 0, 0]))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    return this.canvas
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
