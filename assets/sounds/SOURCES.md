# Audio Sources

The ambient files (rain, fire) originate from Pixabay under the [Pixabay Content License](https://pixabay.com/service/license-summary/) — free for commercial use, no attribution required. The music tracks (`music-1`–`music-6`) are **original works created by a friend of the author**, granted free of charge for use in Covely (not from Pixabay). We list sources here for traceability.

Encoding: all files re-encoded for Covely (trimmed 30s slice for ambient, full length for music; bitrate / channels per SPEC §4 budget).

| File | Source URL | Pixabay ID | Author (Pixabay handle) | Encode | Slice (s) |
|---|---|---|---|---|---|
| `rain-1.mp3` | https://pixabay.com/sound-effects/nature-relaxing-rain-387677/ | 387677 | universfield | mono 96kbps | 30–60 |
| `rain-2.mp3` | https://pixabay.com/sound-effects/nature-relaxing-rain-sounds-437312/ | 437312 | dragon-studio | mono 96kbps | 30–60 |
| `rain-3.mp3` | https://pixabay.com/sound-effects/nature-gentle-rain-for-relaxation-and-sleep-337279/ | 337279 | eryliaa | mono 96kbps | 60–90 |
| `fire-1.mp3` | https://pixabay.com/sound-effects/nature-campfire-crackling-fireplace-sound-119594/ | 119594 | soundsforyou | mono 96kbps | 20–50 |
| `fire-2.mp3` | https://pixabay.com/sound-effects/nature-warm-camp-fire-high-quality-176816/ | 176816 | prem_adhikary | mono 96kbps | 30–60 |
| `fire-3.mp3` | https://pixabay.com/sound-effects/nature-fire-crackling-sound-499636/ | 499636 | soundreality | mono 96kbps | 15–45 |
| `music-1.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Calm Mattress.mp3`) | full |
| `music-2.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Calm Mattress2.mp3`) | full |
| `music-3.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Healing Waterfall1.mp3`) | full |
| `music-4.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Piano Saltwater.mp3`) | full |
| `music-5.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Piano Saltwater1.mp3`) | full |
| `music-6.mp3` | 原创作品（友人制作，非 Pixabay） | — | 作者友人，授权免费使用 | stereo 72kbps (`Pillow Mercury.mp3`) | full |

> **音乐授权**：`music-1`–`music-6` 为作者友人原创制作，已授权免费用于 Covely（非 Pixabay 来源）。⚠️ 公开分发（Chrome 商店 / 网页版）前，建议向作者确认授权是否涵盖「随产品打包并公开分发」。
>
> 体积：已统一重压为 72kbps 立体声（保留全长），6 个文件均 < 1.5MB，符合 SPEC §4 预算。

## Pixabay Content License — what it allows

- ✅ Commercial use, including bundling in distributed apps
- ✅ Modification (we re-encode and trim)
- ✅ No attribution required
- ❌ Cannot resell or redistribute the **unmodified** files as standalone audio products

This last point doesn't affect Covely because we bundle the files inside the product, not redistribute them as standalone assets.

## Re-encode commands (for reference / regeneration)

```bash
# Ambient (rain, fire): mono 96kbps mp3, 30s slice
ffmpeg -y -ss <START> -t 30 -i <SOURCE> -ac 1 -b:a 96k -ar 44100 <DEST>

# Music: stereo 96kbps mp3, full length
ffmpeg -y -i <SOURCE> -ac 2 -b:a 96k <DEST>
```
