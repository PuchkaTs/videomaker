import {createContext, useContext} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {TimeContext, lin} from './time';

// Distance from the eye to the focal plane, in px. Objects at the camera's z
// render 1:1; nearer ones grow, farther ones shrink.
export const PERSPECTIVE = 1600;

export type Cam = {x: number; y: number; z: number; yaw: number; pitch: number; roll: number};

const CamContext = createContext<Cam>({x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0});
export const useCam = () => useContext(CamContext);

// Orbit camera: the world pivots around the focal point (x, y, z).
export const World = ({cam, children}: {cam: Cam; children: ReactNode}) => (
  <AbsoluteFill style={{perspective: PERSPECTIVE, perspectiveOrigin: '50% 50%', overflow: 'hidden'}}>
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 0,
        height: 0,
        transformStyle: 'preserve-3d',
        transform: `rotateZ(${cam.roll}deg) rotateX(${cam.pitch}deg) rotateY(${cam.yaw}deg) translate3d(${-cam.x}px, ${-cam.y}px, ${-cam.z}px)`,
      }}
    >
      <CamContext.Provider value={cam}>{children}</CamContext.Provider>
    </div>
  </AbsoluteFill>
);

type ObjProps = {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  s?: number;
  o?: number;
  blur?: number;
  preserve?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
  name?: string;
};

// An element centred on a world point. It fades out before it reaches the eye,
// because CSS has no near clipping plane.
export const Obj = ({x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, o = 1, blur = 0, preserve, style, children, name}: ObjProps) => {
  const cam = useCam();
  const toward = z - cam.z;
  const near = 1 - lin(toward, PERSPECTIVE - 700, PERSPECTIVE - 250);
  const opacity = o * near;
  if (opacity <= 0.002) return null;
  return (
    <div
      data-name={name}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0',
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s}) translate(-50%, -50%)`,
        transformStyle: preserve ? 'preserve-3d' : undefined,
        opacity: opacity < 0.999 ? opacity : undefined,
        filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Depth-of-field blur for decor: grows with distance from the focal plane.
export const dof = (z: number, cam: Cam, strength = 1) => Math.min(18, (Math.abs(z - cam.z) / 260) * strength);

// Sub-frame motion blur: renders the frame at `samples` times across the shutter
// and averages them by stacking with 1/(i+1) opacity. Static pixels are unchanged.
export const MotionBlur = ({t, samples, shutter, render}: {t: number; samples: number; shutter: number; render: () => ReactNode}) => {
  if (samples <= 1) return <TimeContext.Provider value={t}>{render()}</TimeContext.Provider>;
  return (
    <AbsoluteFill>
      {Array.from({length: samples}, (_, i) => (
        <AbsoluteFill key={i} style={{opacity: i === 0 ? undefined : 1 / (i + 1)}}>
          <TimeContext.Provider value={t + shutter * (i / (samples - 1) - 0.5)}>{render()}</TimeContext.Provider>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};
