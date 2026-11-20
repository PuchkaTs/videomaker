# PythonVariables: lesson 4.1 «Хувьсагч гэж юу вэ?»

Students' explainer for the author's Python book. 1920×1080, 60 fps, 135 s, no voiceover (the author
records it). Built for fast rendering: CSS 3D only, no WebGL, no blur filters, no motion-blur passes
(about 4.5 min for the full film on the 16 GB Mac).

**Through-line:** a variable is a box with a name tag. Values are cards that drop in and fly out; the
name stays. Every scene changes one thing about the box (its value, where it lives, a lock, its name,
its type) so the idea builds up step by step.

Timing lives in `src/python-variables/cues.json` (scene `start`/`dur`, event offsets `t`). Scene starts
sit on the 2.5 s bar of the 96 BPM score. To fit the recorded voice, change `start`/`dur`/`t` there,
then `npm run audio:python-variables` so the sounds follow.

| # | Time | Book text | Chosen staging | Alternatives considered |
|---|---|---|---|---|
| S01 | 0–7.5 | 4.1 title | «4.1» and the title letters fly in from depth; box `x` drops in with «?» | title written by code typing; box assembles from faces |
| S02 | 7.5–22.5 | definition; one value at a time | `onoo = 5 / 12 / 7` typed; each value card lands, the old one flies out; chip «Аль ч мөчид зөвхөн нэг утга» | counter dial; chalkboard rewrite |
| S03 | 22.5–35 | stored in memory, used later | match cut on the same box, camera pulls back to a grid of memory cells with addresses | shelf of drawers; RAM chip zoom |
| S04 | 35–47.5 | Тэмдэглэл: constants | locked violet boxes `True` үнэн, `False` худал, `pi` 3.14159; a «4» card bounces off pi | frozen ice blocks; stone tablets |
| S05 | 47.5–65 | chapter 1 rectangle program | code types `input()` lines; rectangle grows 8×5 on the floor, 40 squares fill; three boxes `urt`, `orgon`, `talbai`; «3 хувьсагч» | calculator; split screen run |
| S06 | 65–72.5 | name and type | camera orbits `talbai` to show the name tag, then the `int` stamp on its side | ID card; luggage tag |
| S07 | 72.5–90 | naming rules; meaningful names | keycaps a–z / 0–9 / _; names checked: `urt1` ✓, `niit_dun` ✓, `1urt` ✗, `yalgavar` ✓ (дискриминант) | conveyor gate; spell checker |
| S08 | 90–100 | case matters | boxes `urt`=5 and `Urt`=9, big «urt ≠ Urt» with the first letters coloured | mirror; twins |
| S09 | 100–110 | Тэмдэглэл: use by name | `print(x1)` typed; a copy of «3» arcs from the box to the screen, the original stays | magnifier; phone call |
| S10 | 110–125 | reserved words | wall of the 35 keywords; tag `for` flies to an empty box and is knocked away ✗; «нөөцлөгдсөн үг · үйлчилгээний үг · түлхүүр үг», «1-р хавсралт» | locked vault; stamps |
| S11 | 125–135 | summary | box with утга / нэр / төрөл labels, four bullet points | quiz; checklist |

Sound: soft electric piano (Fmaj7–Dm7–B♭maj7–C), bass and light drums at -27 LUFS, sound effects at
-28 LUFS (drops, typing, ✓ chime, ✗ buzz, whooshes on seams), mixed about -26 LUFS so the voice sits
on top. Stems: `public/python-variables/stems/`.

Open for the author: Mongolian wording on screen (native check); variable names `onoo`, `urt`, `orgon`,
`talbai`, `niit_dun`, `yalgavar` (match them to the book's chapter 1 names if they differ).
