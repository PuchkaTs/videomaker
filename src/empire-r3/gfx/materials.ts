import * as THREE from 'three';

// Palette and surfaces. Pastels throughout; the one deep colour is the ink of the type, taken from
// the Empire logo navy and warmed a little so it sits with the pastels.

export const COL = {
  ink: '#262B63',
  berry: '#C2436F',
  pearl: '#FFFDF8',
  gum: '#F6A4B0',
  tongue: '#F48FA2',
  plaque: '#F4D283',
  sage: '#BCCF98',
  mint: '#93E8D2',
  lilac: '#BBA3EA',
  sky: '#A6CBF6',
  peach: '#FBBE9C',
  butter: '#FBE19A',
  rose: '#F4AEC4',
  silver: '#D9DEE8',
  navy: '#111735',
};

// Key and dome lights are sampled dozens of times per frame, so their mirror highlights would show
// as a scatter of dots. They only contribute diffuse light; gloss comes from the soft-box environment.
// `rim` adds a Fresnel lift that stands in for light scattering through soft, thick forms.
const soften = <T extends THREE.MeshPhysicalMaterial>(m: T, rim: THREE.ColorRepresentation = 0x000000, power = 2.6): T => {
  const uRim = {value: new THREE.Color(rim)};
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uRim;
    shader.uniforms.uRimPower = {value: power};
    shader.fragmentShader = `uniform vec3 uRim; uniform float uRimPower;\n${shader.fragmentShader}`.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `#include <lights_fragment_end>
      reflectedLight.directSpecular *= 0.0;
      #ifdef USE_CLEARCOAT
        clearcoatSpecularDirect *= 0.0;
      #endif
      #ifdef USE_SHEEN
        sheenSpecularDirect *= 0.0;
      #endif
      totalEmissiveRadiance += uRim * pow(1.0 - saturate(dot(normal, geometryViewDir)), uRimPower);`,
    );
  };
  m.userData.uRim = uRim;
  return m;
};

type P = THREE.MeshPhysicalMaterialParameters;

export const gloss = (color: THREE.ColorRepresentation, extra: P = {}, rim?: THREE.ColorRepresentation) => soften(new THREE.MeshPhysicalMaterial({color, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.13, ...extra}), rim);

export const matte = (color: THREE.ColorRepresentation, extra: P = {}, rim?: THREE.ColorRepresentation) => soften(new THREE.MeshPhysicalMaterial({color, roughness: 0.62, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.6), ...extra}), rim);

export const chrome = (color: THREE.ColorRepresentation = COL.silver, roughness = 0.18) => soften(new THREE.MeshPhysicalMaterial({color, metalness: 1, roughness, envMapIntensity: 2.2}));

// A surface that only shows its reflections, for glass.
export const glass = () => soften(new THREE.MeshPhysicalMaterial({color: 0x000000, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.4, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide}), 0x667088, 2.2);

export const MAT = () => ({
  pearl: gloss('#F9F4EA', {roughness: 0.16, clearcoatRoughness: 0.08, envMapIntensity: 1.5, emissive: '#FFE3D2', emissiveIntensity: 0.05}, '#7A5A50'),
  gum: gloss(COL.gum, {roughness: 0.36, emissive: '#F06A80', emissiveIntensity: 0.08}, '#E9506A'),
  tongue: gloss(COL.tongue, {roughness: 0.42, emissive: '#EC5A78', emissiveIntensity: 0.08}, '#E9506A'),
  plaque: matte(COL.plaque, {emissive: '#F2B24C', emissiveIntensity: 0.08}, '#6E5014'),
  // Type must keep its colour at any angle, so it reflects far less of the soft boxes.
  ink: gloss(COL.ink, {roughness: 0.36, clearcoat: 0.5, envMapIntensity: 0.4}, '#1C2056'),
  berry: gloss(COL.berry, {roughness: 0.36, clearcoat: 0.5, envMapIntensity: 0.45}, '#7A1E44'),
  white: gloss('#FFFFFF', {roughness: 0.3}),
  mint: gloss(COL.mint, {}, '#2FA488'),
  lilac: gloss(COL.lilac, {}, '#5A3FB0'),
  sky: gloss(COL.sky, {}, '#3672C0'),
  peach: gloss(COL.peach, {}, '#D0602C'),
  butter: gloss(COL.butter, {}, '#C08820'),
  rose: gloss(COL.rose, {}, '#C03A70'),
  matteLilac: matte('#D7CBF1'),
  matteSky: matte('#C6DCF8'),
  mattePeach: matte('#FBD3BC'),
  matteMint: matte('#BFEFE1'),
  chrome: chrome(),
});

export type Mats = ReturnType<typeof MAT>;
