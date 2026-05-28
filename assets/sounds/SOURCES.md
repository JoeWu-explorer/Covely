# Audio Sources

All files in this directory originate from Pixabay under the [Pixabay Content License](https://pixabay.com/service/license-summary/) — free for commercial use, no attribution required. We list authors here for traceability even though attribution is not legally required.

Encoding: all files re-encoded for Covely (trimmed 30s slice for ambient, full length for music; bitrate / channels per SPEC §4 budget).

| File | Source URL | Pixabay ID | Author (Pixabay handle) | Encode | Slice (s) |
|---|---|---|---|---|---|
| `rain-1.mp3` | https://pixabay.com/sound-effects/nature-relaxing-rain-387677/ | 387677 | universfield | mono 96kbps | 30–60 |
| `rain-2.mp3` | https://pixabay.com/sound-effects/nature-relaxing-rain-sounds-437312/ | 437312 | dragon-studio | mono 96kbps | 30–60 |
| `rain-3.mp3` | https://pixabay.com/sound-effects/nature-gentle-rain-for-relaxation-and-sleep-337279/ | 337279 | eryliaa | mono 96kbps | 60–90 |
| `fire-1.mp3` | https://pixabay.com/sound-effects/nature-campfire-crackling-fireplace-sound-119594/ | 119594 | soundsforyou | mono 96kbps | 20–50 |
| `fire-2.mp3` | https://pixabay.com/sound-effects/nature-warm-camp-fire-high-quality-176816/ | 176816 | prem_adhikary | mono 96kbps | 30–60 |
| `fire-3.mp3` | https://pixabay.com/sound-effects/nature-fire-crackling-sound-499636/ | 499636 | soundreality | mono 96kbps | 15–45 |
| `music-1.mp3` | https://pixabay.com/music/modern-classical-calm-soft-piano-music-378287/ | 378287 | sakartvelo | stereo 96kbps | full (~111s) |

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
