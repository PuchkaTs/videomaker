# Fitzone reel v2: 2.5D neon HUD

**Brief (2026-10-31):** 2.5D. Thin glowing lines in 2–3 colours on near-black, HUD, grid and data, soft glow without overexposure. Lines draw, scan and pulse. No reflective floor, no flares. Very corporate, very clean, very branded. Text only while the presenter talks. Remove the cargo truck.

**Reference:** the Fleetory dashboard: thin stat numbers over small labels, a side-on vehicle hero, callouts on the product, a delivery-progress stepper with a tooltip, map with pins. Its layout language is used; the near-black brief overrides its light colours.

**Thread:** the heartbeat line from the logo. It sits in every rule and in the strip along the bottom, and at the end it draws the logo itself.

**Colour:** logo blue for lines, ice for type, mint only for a finished state.

| ID | Time | On screen | Options (chosen first) | Motion |
|---|---|---|---|---|
| A01 | 0–4.7 | 16 жилийн туршлага | **Text only** | Rule draws, number counts up |
| A02 | 4.7–11.3 | Хамтарч ажиллахад бэлэн | **Text only** | Words rise on her words; scan covers the footage's white flash at 10.5 s and the text stays |
| A03 | 11.3–20.4 | 7 project types | **Mongolia map with lines from Ulaanbaatar** · rack of icons · plain list · network graph | Border draws, each type draws a line and a pin on its word |
| A04 | 20.4–28.8 | 7 services, иж бүрэн нэг дор | **Delivery-style stepper with a video card** · vertical checklist · conveyor · timeline ruler | Tracker glides stop to stop, cards slide in depth; truck on «хүргэлт» |
| A05–A06 | 28.8–37.75 | 2011, 140+ | **Text only** | Rule draws, numbers count up |
| A07 | 37.75–40.35 | 2 500 м² агуулах | **Survey grid and brackets on the aerial** · floor plan · building outline · big number alone | Scan pass covers the 37.3 s flash; grid lays down on the ground, brackets snap to the warehouse |
| A08 | 40.35–43.9 | 600 м² шоурум | **Line traced along the building** · brackets again · floor plan · glass box | Line draws along the facade |
| A09 | 43.9–46.82 | Урьдчилан нөөцөлдөг | **Text in the sky over the grid** · shelf levels · stock bars · crates | Rule draws, words rise |
| A10 | 46.82–54.7 | Зураг хараад биш → өөрийн биеэр, 4 verbs | **Treadmill scanned as lines, then real, with callouts** · four icons · four screens · steps | Scan draws the outline, photo resolves, callouts draw on each verb |
| A11 | 54.7–59 | 2–3 сар, хүлээх шаардлагагүй | **Timeline, then a strike** · crossed calendar · shrinking bar · countdown | Bar fills to 3 months, mint strike on «шаардлагагүй» |
| A12 | 59–61.3 | Цаг, санхүү хэмнэнэ | **Two rings** · two gauges · two bars · scale | Rings draw on their words |
| A13 | 61.3–69.6 | 4 brands, албан ёсны онцгой эрхтэй | **Four cards in depth** · logo wall · single row · carousel | Cards draw on each name, check on «эрхтэй» |
| A14 | 69.6–77.46 | Таны фитнесийн найдвартай түнш | **The pulse draws the logo** · logo fade · reveal by mask · particle build | Pulse draws, bars grow on the downbeat, heartbeat in the glow |

## Sources

- **Truck and treadmill:** Higgsfield `gpt_image_2_5`, originals in `public/fitzone-v2/gen/`. Truck has no branding; the Fitzone logo is laid on it in the composition.
- **Brand logos and wordmark:** white-on-transparent masks made from the client's own cards in the footage.
- **Map:** Natural Earth 1:50m border. Pins mark project types, not real sites.
- **Score and effects:** `scripts/fitzone-v2-audio.mjs`. The clip is voice only and silent after 72.7 s.

## Replaced shots

- Cargo truck, 24.0–25.0 s.
- White flash and cycling shot, 10.5–12 s.
- White flash, 37.3 s.
