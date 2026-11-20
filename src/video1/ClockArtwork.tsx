import {ease} from './motion';

/** One fixed clock face: both hands rotate about the same pin in SVG coordinates. */
export const ClockArtwork = ({frame, dark}: {frame: number; dark: boolean}) => {
  const ink = dark ? '#F3EFE3' : '#0A3028';
  const gold = '#D6BA75';
  const progress = ease(frame, 16, 65);
  const minutes = 15 + 5 * progress;
  return <svg width="100%" height="100%" viewBox="0 0 960 540" role="img" aria-label="Clock illustrating 15 to 20 minutes">
    <g opacity={ease(frame, 0, 18)}>
      <circle id="clock-outline" cx={480} cy={267} r={180} fill={dark ? '#0A3028' : '#F3EFE3'} stroke={ink} strokeWidth={7}/>
      <g id="minute-marks" stroke={gold} strokeWidth={4} strokeLinecap="round">
        {Array.from({length: 12}, (_, i) => <path key={i} d="M480 125 V112" transform={`rotate(${i * 30} 480 267)`}/>)}
      </g>
      <g stroke={ink} strokeWidth={7} strokeLinecap="round" fill="none">
        <g id="clock-hand-long" transform={`rotate(${minutes * 6} 480 267)`}><path d="M480 267 V161"/></g>
        <g id="clock-hand-short" transform={`rotate(${minutes * .5} 480 267)`}><path d="M480 267 V183"/></g>
      </g>
      <circle id="clock-pivot" cx={480} cy={267} r={12} fill={gold}/>
      <path id="time-arc" d="M660 267 A180 180 0 0 1 635.884573 357" fill="none" stroke={gold} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-progress} opacity={progress > 0 ? 1 : 0}/>
    </g>
    <g id="milk-cue" opacity={ease(frame, 12, 26)} transform="translate(232 280) scale(0.48)">
      <path d="M0 -90 C-18 -58 -65 -14 -65 27 A65 65 0 0 0 65 27 C65 -14 18 -58 0 -90 Z" fill={dark ? '#F3EFE3' : '#124B3A'}/>
    </g>
  </svg>;
};
