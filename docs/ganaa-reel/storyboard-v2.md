# Ganaa reel v2: her edits (2026-11-18, approved by the user; rendered 2026-11-18, not sent)

Гантуяа's feedback on v1 (`outputs/ganaa-reel.mp4`, sent 2026-11-17):

1. Don't animate her photo. Show it as a still photo, at the start and at the end only.
2. Write **RE/MAX WIN**.
3. Under the opening title: «Үл хөдлөх хөрөнгийн мэргэжилтэн / Силвер агент М.Гантуяа / 9099 9884».
4. Show the rest of her text as interesting illustrated cards (her full text, not our shortened titles).

v1 stays as it is (`outputs/ganaa-reel.mp4`, composition `GanaaReel`). v2 is a new composition `GanaaReelV2`, `src/ganaa-reel-v2/`, with its own voice folder `public/ganaa-reel-v2/vo/` (V1 and V3 hard-linked from v1), output `outputs/ganaa-reel-v2.mp4`. 65.2 s (her text is longer than estimated), 1080×1920, 60 fps, same navy/silver/red look.

## Scenes and on-screen copy

Her text with spelling fixed: аваараай → аваарай, дэлгэрэгүй → дэлгэрэнгүй, ажиллараай → ажиллаарай, тусална → туслана, Обьект → Объект, «М.Гантуяа-аас» → «М.Гантуяагаас».

| Scene | Picture | On screen |
|---|---|---|
| S1 opening, 0–4 s | Her still photo (the original cut-out, nothing on her moves), night city behind with slow parallax; RE/MAX WIN logo on top | **ЯАГААД ТАНД АГЕНТ ХЭРЭГТЭЙ ВЭ?**, and under it: «Үл хөдлөх хөрөнгийн мэргэжилтэн» · **СИЛВЕР АГЕНТ М.ГАНТУЯА** · red pill ☎ **9099-9884** |
| S2 | Two apartment cards swing in (sell / dream home); she is gone from here on | «Та орон сууцаа худалдах гэж байна уу?» · «Эсвэл мөрөөдлийн орон сууцаа хайж байна уу?» |
| 1/6 | Illustrated card: a flat with a value chart drawing over it | **ЗӨВ ҮНЭЛГЭЭ** · «Зах зээлийн судалгаанд үндэслэн зөв үнэлгээг тогтооно.» |
| 2/6 | Card: a filter funnel sorting flats, then ad, phone and key icons popping in | **ЦАГ ХЭМНЭНЭ** · «Зах зээлээс танд тохирох сонголтуудыг шүүж өгнө.» · chips «Зар сурталчилгаа» «Дуудлага авах» «Байр үзүүлэх» |
| 3/6 | Card: documents checked one by one, a shield and stamp | **ЭРСДЭЛЭЭС ХАМГААЛНА** · «Бичиг баримт, өмчлөгчтэй холбоотой асуудлыг бүгдийг шалгаж баталгаажуулна.» |
| 4/6 (new) | Card: a rising growth curve over a building, coins | **МЭРГЭЖЛИЙН ЗӨВЛӨГӨӨ** · «Зах зээлийн бодит үнэ цэнэ болон хөрөнгө оруулалтын өгөөжийг тайлбарлана.» |
| 5/6 | Card: a network of 1800 agent dots lighting up across the city | **МЭРГЭЖЛИЙН БАГ ХАМТ ОЛОН** · «1800 агенттай системд байршуулснаар зорилтод хэрэглэгчид хурдан хүрнэ.» |
| 6/6 ✅ | Card: two hands meeting over a key | **ХЭЛЭЛЦЭЭР ХИЙЖ ӨГНӨ** · «Үнэ болон нөхцөл дээр худалдан авагч, худалдагчийн хооронд зөвшилцөлд хүрэхэд туслана.» |
| S7 services | Six illustrated tiles fly in as a grid | «Үл хөдлөх хөрөнгөө худалдах болон түрээслэх бол хамтран ажиллаарай» · Орон сууц · Хаус · Оффис · Объект · Газар · **Аос (?)** |
| S8 end | Her still photo again, RE/MAX WIN logo above her name | «Илүү дэлгэрэнгүй мэдээллийг үл хөдлөх хөрөнгийн мэргэжилтэн» **СИЛВЕР АГЕНТ М.ГАНТУЯА**-аас аваарай · red pill ☎ **9099-9884** · **ТАНЫ ҮЛ ХӨДЛӨХ ХӨРӨНГӨ — МИНИЙ ХАРИУЦЛАГА** |

The counter becomes 1/6 … 6/6 (her five points plus the ✅ negotiation point).

## Voice script (Mandukai, follows her text)

V1 and V3 are unchanged from v1 and reused; the other eight are new (about 900 characters of ElevenLabs).

- **V1:** «Яагаад танд агент хэрэгтэй вэ?» (reuse)
- **V2:** «Та орон сууцаа худалдах гэж байна уу? Эсвэл мөрөөдлийн орон сууцаа хайж байна уу?»
- **V3:** «Нэгт, зах зээлийн судалгаанд үндэслэн зөв үнэлгээг тогтооно.» (reuse)
- **V4:** «Хоёрт, цаг хэмнэнэ. Танд тохирох сонголтуудыг шүүж, зар, дуудлага, байр үзүүлэхийг хариуцна.»
- **V5:** «Гуравт, эрсдэлээс хамгаална. Бичиг баримт, өмчлөгчтэй холбоотой асуудлыг бүгдийг шалгаж баталгаажуулна.»
- **V6:** «Дөрөвт, мэргэжлийн зөвлөгөө өгнө. Зах зээлийн бодит үнэ цэнэ, хөрөнгө оруулалтын өгөөжийг тайлбарлана.»
- **V7:** «Тавд, мэргэжлийн баг хамт олон ажиллана. Мянга найман зуун агенттай системд байршуулж, худалдан авагчид хурдан хүрнэ.»
- **V8:** «Мөн үнэ, нөхцөл дээр худалдан авагч, худалдагчийг зөвшилцөлд хүргэхэд туслана.»
- **V9:** «Үл хөдлөх хөрөнгөө худалдах, түрээслэх бол хамтран ажиллаарай.»
- **V10:** «Силвер агент Гантуяа. Таны үл хөдлөх хөрөнгө — миний хариуцлага.»

Her own words stay where she wrote them, including «систем» and «Хаус» (loanwords we would normally avoid).

## Status

- Script and copy approved 2026-11-18. Voices generated (Mandukai, take 1, 699 characters). «Аос» was not explained, so that tile is left out (five tiles); add it to `SERVICES` in `GanaaReelV2.tsx` once someone knows what it means.
- Commands: `npm run voice:ganaa-reel-v2`, `build:ganaa-reel-v2`, `stills:ganaa-reel-v2` (`KEEP=1` keeps the single frames), `render:ganaa-reel-v2` → `outputs/ganaa-reel-v2.mp4`.
