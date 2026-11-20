import * as THREE from 'three';
import {FullScreenQuad} from 'three/examples/jsm/postprocessing/Pass.js';

// The render pipeline: an accumulation renderer. Every output frame is the average of N full renders,
// and each render jitters the shutter time, the lens position on the aperture disc, the sub-pixel
// offset and the two shadow-casting lights. That gives real motion blur, real depth of field with
// correct occlusion, clean edges, soft-box penumbras and dome ambient occlusion from one mechanism,
// instead of stacking screen-space passes that break at silhouettes.

export const W = 1080;
export const H = 1920;

const halton = (i: number, base: number) => {
  let f = 1, r = 0;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
};

export type Lens = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  roll: number;
  fov: number;
  focus: number;
  // Aperture radius in world units.
  aperture: number;
};

export type Rig = {
  keyDir: THREE.Vector3;
  keySize: number;
  keyLevel: number;
  domeLevel: number;
  exposure: number;
  // World-space centre the shadow frusta follow.
  focusPoint: THREE.Vector3;
  shadowRadius: number;
};

const FINAL_FRAG = /* glsl */ `
uniform sampler2D tSum;
uniform float count;
uniform float exposure;
varying vec2 vUv;

// Khronos PBR Neutral: keeps pastel base colours true and only rolls off the highlights.
vec3 neutral(vec3 c) {
  const float start = 0.8 - 0.04;
  const float desat = 0.15;
  float x = min(c.r, min(c.g, c.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= offset;
  float peak = max(c.r, max(c.g, c.b));
  if (peak < start) return c;
  float d = 1.0 - start;
  float np = 1.0 - d * d / (peak + d - start);
  c *= np / peak;
  float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0);
  return mix(c, vec3(np), g);
}

vec3 srgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

float noise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec3 c = texture2D(tSum, vUv).rgb / count * exposure;
  vec2 q = vUv - 0.5;
  c *= 1.0 - 0.22 * smoothstep(0.32, 0.95, length(q * vec2(0.9, 1.1)));
  c = srgb(neutral(c));
  // Interleaved-gradient dither hides banding in the soft backdrop gradients after H.264.
  c += (noise(gl_FragCoord.xy) - 0.5) / 255.0 * 1.5;
  gl_FragColor = vec4(c, 1.0);
}
`;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export class Studio {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 300);
  key = new THREE.DirectionalLight(0xffffff, 1);
  dome = new THREE.DirectionalLight(0xffffff, 1);
  private target: THREE.WebGLRenderTarget;
  private sum: [THREE.WebGLRenderTarget, THREE.WebGLRenderTarget];
  private accMat: THREE.ShaderMaterial;
  private finalMat: THREE.ShaderMaterial;
  private quad: FullScreenQuad;
  private count = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance', alpha: false});
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(W, H, false);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.getContext().getExtension('EXT_color_buffer_float');

    this.target = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true});
    const make = () => new THREE.WebGLRenderTarget(W, H, {type: THREE.FloatType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false});
    this.sum = [make(), make()];

    this.accMat = new THREE.ShaderMaterial({
      uniforms: {tPrev: {value: null}, tNew: {value: null}},
      vertexShader: VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D tPrev; uniform sampler2D tNew; varying vec2 vUv;
        void main() { gl_FragColor = texture2D(tPrev, vUv) + vec4(min(texture2D(tNew, vUv).rgb, vec3(24.0)), 1.0); }
      `,
      depthTest: false,
      depthWrite: false,
    });
    this.finalMat = new THREE.ShaderMaterial({
      uniforms: {tSum: {value: null}, count: {value: 1}, exposure: {value: 1}},
      vertexShader: VERT,
      fragmentShader: FINAL_FRAG,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    this.quad = new FullScreenQuad(this.accMat);

    this.setupLight(this.key, 2048);
    this.setupLight(this.dome, 1024);
    this.scene.add(this.key, this.key.target, this.dome, this.dome.target);
  }

  private setupLight(light: THREE.DirectionalLight, size: number) {
    light.castShadow = true;
    light.shadow.mapSize.set(size, size);
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.012;
    light.shadow.radius = 3;
  }

  // The point on the aperture disc for sample `index`, unit radius. Labels that must stay sharp at
  // any depth use it to ride along with the lens.
  jitter(index: number) {
    const i = index + 1;
    const a = Math.sqrt(halton(i, 2));
    const th = 2 * Math.PI * halton(i, 3);
    return {x: Math.cos(th) * a, y: Math.sin(th) * a};
  }

  begin() {
    this.count = 0;
    const r = this.renderer;
    for (const t of this.sum) {
      r.setRenderTarget(t);
      r.setClearColor(0x000000, 0);
      r.clear(true, false, false);
    }
  }

  // One jittered render. `index` selects the sample's point in the low-discrepancy sets.
  sample(index: number, lens: Lens, rig: Rig) {
    const i = index + 1;
    const cam = this.camera;
    const r = this.renderer;

    cam.fov = lens.fov;
    cam.up.set(0, 1, 0);
    cam.position.copy(lens.position);
    cam.lookAt(lens.target);
    cam.rotateZ(lens.roll);
    cam.updateProjectionMatrix();

    // Thin lens: move the eye across the aperture and shear the frustum so the focus plane stays put.
    const jit = this.jitter(index);
    const dx = jit.x * lens.aperture;
    const dy = jit.y * lens.aperture;
    cam.translateX(dx);
    cam.translateY(dy);
    cam.updateMatrixWorld(true);
    const p = cam.projectionMatrix.elements;
    const pix = 1 / W, piy = 1 / H;
    p[8] = -(p[0] * dx) / lens.focus + (halton(i, 5) - 0.5) * pix * 2;
    p[9] = -(p[5] * dy) / lens.focus + (halton(i, 7) - 0.5) * piy * 2;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

    // Key: a point on the soft box.
    const R = rig.shadowRadius;
    const c = rig.focusPoint;
    const k = rig.keyDir.clone().normalize();
    const u = new THREE.Vector3(0, 1, 0).cross(k).normalize();
    const v = k.clone().cross(u);
    const ka = Math.sqrt(halton(i, 11)) * rig.keySize;
    const kt = 2 * Math.PI * halton(i, 13);
    const dir = k.clone().addScaledVector(u, Math.cos(kt) * ka).addScaledVector(v, Math.sin(kt) * ka).normalize();
    this.aim(this.key, dir, c, R, rig.keyLevel);

    // Dome: uniform over the upper hemisphere, kept off the horizon so its shadows stay contact-sized.
    const y = 0.28 + 0.72 * halton(i, 17);
    const ph = 2 * Math.PI * halton(i, 19);
    const s = Math.sqrt(1 - y * y);
    this.aim(this.dome, new THREE.Vector3(Math.cos(ph) * s, y, Math.sin(ph) * s), c, R, rig.domeLevel);

    r.setRenderTarget(this.target);
    r.render(this.scene, cam);

    this.accMat.uniforms.tPrev.value = this.sum[0].texture;
    this.accMat.uniforms.tNew.value = this.target.texture;
    this.quad.material = this.accMat;
    r.setRenderTarget(this.sum[1]);
    this.quad.render(r);
    this.sum.reverse();
    this.count++;
  }

  private aim(light: THREE.DirectionalLight, dir: THREE.Vector3, c: THREE.Vector3, R: number, level: number) {
    light.intensity = level;
    light.target.position.copy(c);
    light.position.copy(c).addScaledVector(dir, R * 2);
    const cam = light.shadow.camera;
    cam.left = -R;
    cam.right = R;
    cam.top = R;
    cam.bottom = -R;
    cam.near = 0.1;
    cam.far = R * 4;
    cam.updateProjectionMatrix();
    light.target.updateMatrixWorld();
    light.updateMatrixWorld();
  }

  present(exposure: number) {
    this.finalMat.uniforms.tSum.value = this.sum[0].texture;
    this.finalMat.uniforms.count.value = Math.max(1, this.count);
    this.finalMat.uniforms.exposure.value = exposure;
    this.quad.material = this.finalMat;
    this.renderer.setRenderTarget(null);
    this.quad.render(this.renderer);
  }

  get samples() {
    return this.count;
  }
}

// Soft-box environment for reflections: a pale room with large white cards, so gloss shows long
// studio highlights rather than a generic sky gradient.
export const softboxEnvironment = (renderer: THREE.WebGLRenderer, tint = 0xf1ecf6) => {
  const room = new THREE.Scene();
  room.background = new THREE.Color(tint).multiplyScalar(0.55);
  const card = (w: number, h: number, pos: [number, number, number], level: number, color = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(level), side: THREE.DoubleSide}));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  card(14, 9, [0, 12, 2], 6);
  card(5, 12, [-11, 4, 5], 7);
  card(3, 12, [11, 3, 3], 4, 0xffe9dc);
  card(10, 3, [0, 2, -12], 3, 0xdfe6ff);
  card(8, 2.2, [2, -6, 8], 1.2, 0xffd9e4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.025).texture;
  pmrem.dispose();
  return env;
};
