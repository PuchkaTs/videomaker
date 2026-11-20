import {Composition, Folder} from 'remotion';
import {AGENT_SCENES, KUBLAI_AGENTS_DURATION, KublaiAgents, withBackdrop} from './kublai-agents/KublaiAgents';
import {KUBLAI_AGENTS_V2_DURATION, KublaiAgentsV2} from './kublai-agents-v2/KublaiAgentsV2';
import {EMPIRE_R1_DURATION, EmpireR1} from './empire-r1/EmpireR1';
import {EMPIRE_R3_DURATION, EmpireR3} from './empire-r3/EmpireR3';
import {FITZONE_DURATION, FITZONE_FPS, Fitzone} from './fitzone/Fitzone';
import {FITZONE_V2_DURATION, FitzoneV2} from './fitzone-v2/FitzoneV2';
import {FITZONE_H01_DURATION, FITZONE_H01_FPS, FitzoneH01} from './fitzone-h01/FitzoneH01';
import {GATES_REEL_DURATION, GATES_REEL_FPS, GatesAiReel} from './gates-ai-reel/GatesAiReel';
import {SPACEX_REEL_DURATION, SPACEX_REEL_FPS, SpacexReel} from './spacex-reel/SpacexReel';
import {ABUNDANCE_REEL_DURATION, ABUNDANCE_REEL_FPS, AbundanceReel} from './abundance-reel/AbundanceReel';
import {JENSEN_REEL_DURATION, JENSEN_REEL_FPS, JENSEN_REEL_SHORT_DURATION, JensenReel, JensenReelShort} from './jensen-reel/JensenReel';
import {ALTMAN_EP1_DURATION, ALTMAN_EP1_FPS, AltmanEp1} from './altman-ep1/AltmanEp1';
import {ALTMAN_EP2_DURATION, ALTMAN_EP2_FPS, AltmanEp2} from './altman-ep2/AltmanEp2';
import {ALTMAN_EP3_DURATION, ALTMAN_EP3_FPS, AltmanEp3} from './altman-ep3/AltmanEp3';
import {BONSAI_REEL_DURATION, BONSAI_REEL_FPS, BonsaiReel} from './bonsai-reel/BonsaiReel';
import {AGENT_VIDEO_REEL_FPS, AGENT_VIDEO_REEL_IDS, AgentVideoReel, agentVideoReelDuration} from './agent-video-reel/AgentVideoReel';
import {LISTING_REEL_DEMO, LISTING_REEL_FPS, ListingReel, listingReelFrames} from './listing-reel/ListingReel';
import {GANAA_REEL_DURATION, GANAA_REEL_FPS, GanaaReel} from './ganaa-reel/GanaaReel';
import {GANAA_REEL_V2_DURATION, GANAA_REEL_V2_FPS, GanaaReelV2} from './ganaa-reel-v2/GanaaReelV2';
import {GANAA_HOUSE_DURATION, GANAA_HOUSE_FPS, GanaaHouse} from './ganaa-house/GanaaHouse';
import {PYTHON_VARIABLES_DURATION, PythonVariables} from './python-variables/PythonVariables';
import {Starter} from './Starter';
import {Video1Draft, VIDEO1_DURATION} from './Video1Draft';
import {KublaiGuide, KUBLAI_FPS, KUBLAI_GUIDE_DEFAULTS, kublaiGuideDuration} from './kublai/KublaiGuide';

export const Root = () => (
  <>
  <Composition id="ListingReel" component={ListingReel} durationInFrames={listingReelFrames(LISTING_REEL_DEMO)} fps={LISTING_REEL_FPS} width={1080} height={1920} defaultProps={{cues: LISTING_REEL_DEMO}} calculateMetadata={({props}) => ({durationInFrames: listingReelFrames(props.cues)})} />
  <Folder name="AgentVideoReel">
    {AGENT_VIDEO_REEL_IDS.map((v) => (
      <Composition key={v} id={`AgentVideoReel${v}`} component={AgentVideoReel} durationInFrames={agentVideoReelDuration(v)} fps={AGENT_VIDEO_REEL_FPS} width={1080} height={1920} defaultProps={{v}} />
    ))}
  </Folder>
  <Composition id="GanaaReel" component={GanaaReel} durationInFrames={GANAA_REEL_DURATION} fps={GANAA_REEL_FPS} width={1080} height={1920} />
  <Composition id="GanaaReelV2" component={GanaaReelV2} durationInFrames={GANAA_REEL_V2_DURATION} fps={GANAA_REEL_V2_FPS} width={1080} height={1920} />
  <Composition id="GanaaHouse" component={GanaaHouse} durationInFrames={GANAA_HOUSE_DURATION} fps={GANAA_HOUSE_FPS} width={1080} height={1920} />
  <Composition id="BonsaiReel" component={BonsaiReel} durationInFrames={BONSAI_REEL_DURATION} fps={BONSAI_REEL_FPS} width={1080} height={1920} />
  <Composition id="AltmanEp3" component={AltmanEp3} durationInFrames={ALTMAN_EP3_DURATION} fps={ALTMAN_EP3_FPS} width={1080} height={1920} />
  <Composition id="AltmanEp2" component={AltmanEp2} durationInFrames={ALTMAN_EP2_DURATION} fps={ALTMAN_EP2_FPS} width={1080} height={1920} />
  <Composition id="AltmanEp1" component={AltmanEp1} durationInFrames={ALTMAN_EP1_DURATION} fps={ALTMAN_EP1_FPS} width={1080} height={1920} />
  <Composition id="JensenReel" component={JensenReel} durationInFrames={JENSEN_REEL_DURATION} fps={JENSEN_REEL_FPS} width={1080} height={1920} />
  <Composition id="JensenReelShort" component={JensenReelShort} durationInFrames={JENSEN_REEL_SHORT_DURATION} fps={JENSEN_REEL_FPS} width={1080} height={1920} />
  <Composition id="PythonVariables" component={PythonVariables} durationInFrames={PYTHON_VARIABLES_DURATION} fps={60} width={1920} height={1080} />
  <Composition id="KublaiAgentsV2" component={KublaiAgentsV2} durationInFrames={KUBLAI_AGENTS_V2_DURATION} fps={60} width={1920} height={1080} defaultProps={{voice: 'narration' as const}} />
  <Composition id="KublaiAgentsV2Dialogue" component={KublaiAgentsV2} durationInFrames={KUBLAI_AGENTS_V2_DURATION} fps={60} width={1920} height={1080} defaultProps={{voice: 'dialogue' as const}} />
  <Composition id="EmpireR1" component={EmpireR1} durationInFrames={EMPIRE_R1_DURATION} fps={60} width={1080} height={1920} />
  <Composition id="FitzoneH01" component={FitzoneH01} durationInFrames={FITZONE_H01_DURATION} fps={FITZONE_H01_FPS} width={1080} height={1920} />
  <Composition id="AbundanceReel" component={AbundanceReel} durationInFrames={ABUNDANCE_REEL_DURATION} fps={ABUNDANCE_REEL_FPS} width={1080} height={1920} />
  <Composition id="SpacexReel" component={SpacexReel} durationInFrames={SPACEX_REEL_DURATION} fps={SPACEX_REEL_FPS} width={1080} height={1920} />
  <Composition id="EmpireR3" component={EmpireR3} durationInFrames={EMPIRE_R3_DURATION} fps={60} width={1080} height={1920} />
  <Composition id="FitzoneV2" component={FitzoneV2} durationInFrames={FITZONE_V2_DURATION} fps={60} width={1080} height={1920} />
  <Composition id="Fitzone" component={Fitzone} durationInFrames={FITZONE_DURATION} fps={FITZONE_FPS} width={1080} height={1920} />
  <Composition id="GatesAiReel" component={GatesAiReel} durationInFrames={GATES_REEL_DURATION} fps={GATES_REEL_FPS} width={1080} height={1920} />
  <Folder name="KublaiAgents-Scenes">
    {AGENT_SCENES.map(({id, component, duration}) => (
      <Composition key={id} id={id} component={withBackdrop(component)} durationInFrames={duration} fps={30} width={1920} height={1080} />
    ))}
  </Folder>
  </>
);
