import {Composition} from 'remotion';
import {Starter} from './Starter';
import {Video1Draft, VIDEO1_DURATION} from './Video1Draft';

export const Root = () => (
  <>
  <Composition
    id="Video1Draft"
    component={Video1Draft}
    durationInFrames={VIDEO1_DURATION}
    fps={30}
    width={1920}
    height={1080}
  />
  <Composition
    id="Starter"
    component={Starter}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{title: 'MAKE SOMETHING', subtitle: 'WORTH WATCHING.', videoFile: ''}}
  />
  </>
);
