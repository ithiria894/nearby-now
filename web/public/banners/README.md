# enoki category banners — AI image set

Drop images here named `<category-key>.jpg` (16:9-ish, ≥1024px wide, center-safe
composition — banners crop to a wide strip via `cover`). Any missing file falls
back to the tint + icon watermark automatically.

Expected files: `food.jpg` `games.jpg` `outdoors.jpg` `music.jpg` `drinks.jpg`
`sports.jpg` `fitness.jpg` `movies.jpg` `study.jpg` `shopping.jpg` `photo.jpg`
`other.jpg`

## Style guide (why these constraints)

- **Golden-hour / warm natural light** — harmonizes with the cream paper UI.
- **No people** — enoki is anonymous-first; objects and places, never faces.
- **No text, no logos, no watermarks** — text in images fights the UI type.
- Cozy, slightly nostalgic, uncluttered; subject in the lower two-thirds so the
  wide crop keeps it visible.

## Shared style suffix (append to every prompt)

> …, warm golden-hour natural light, cozy nostalgic mood, photorealistic, soft
> film grain, no people, no text, no logos, uncluttered composition, muted warm
> tones that pair with a cream/beige interface, landscape 16:9

## Per-category prompts

| File           | Prompt (before the shared suffix)                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sports.jpg`   | A soccer ball and a pair of worn cleats resting on grass in front of an empty goal on a neighborhood pitch at sunset, trees and houses in the distance |
| `food.jpg`     | A bubbling hotpot on a shared table with plates, chopsticks and fresh ingredients, gentle steam rising, warm restaurant lamplight                      |
| `games.jpg`    | A board game mid-play on a wooden table — dice, cards, colorful wooden pieces, a scorepad and snacks around the edges                                  |
| `outdoors.jpg` | A grassy hiking trail winding through green hills with a small daypack and water bottle resting on a rock in the foreground                            |
| `music.jpg`    | An acoustic guitar leaning against a stool beside a microphone stand in a warm rehearsal room, fairy lights softly out of focus                        |
| `drinks.jpg`   | Two latte cups and a small pour-over kettle on a sunlit café windowsill table, condensation and crumbs, street softly blurred outside                  |
| `fitness.jpg`  | Running shoes, a towel and a water bottle on an outdoor track at sunrise, long soft shadows across the lanes                                           |
| `movies.jpg`   | A cozy row of empty cinema seats with a striped popcorn box on an armrest, warm projector glow hanging in the air                                      |
| `study.jpg`    | Open notebooks, a laptop and a mug of tea on a big library table by a window, pencil shavings and sticky notes                                         |
| `shopping.jpg` | A warm street-market lane with striped awnings, crates of fruit and hanging tote bags, late-afternoon light                                            |
| `photo.jpg`    | A vintage film camera with scattered printed photographs and a half-open camera bag on a wooden table                                                  |
| `other.jpg`    | A park bench under a big tree with a folded picnic blanket and a thermos on it, dappled evening light on the grass                                     |

Phase-2 creator uploads (`img:` banners) will render through the same
component; these platform assets are the curated default set.
