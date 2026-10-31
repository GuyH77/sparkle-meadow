# Number Bonds v2: Rethink & Plan

## 1. Why v1 disappointed

| Problem | In v1 |
|---|---|
| Tiny, fixed content | 6 levels, ~16 activities, **3 hand-written rounds each**. Finished in one sitting, and replays ask exactly the same questions. |
| Looks like a web form | Emoji and CSS gradients on flat HTML. There's no world, no characters that move, no sense of place. |
| Shallow interaction | Almost everything is "tap the right number". No dragging, building, or anything physical. |
| No adaptivity | The same difficulty for everyone. It doesn't notice that 7+3 is solid but 6+4 isn't. |
| Weak reward loop | Stars only. Nothing to collect, build or come back for. |
| Robotic voice | Browser text-to-speech. For a 6-year-old who is still learning to read, the voice is the main way she's told what to do. |

## 2. Vision

**An animal sanctuary she builds with maths.** On day one she adopts a baby pet companion. Together they travel a map of habitats that have lost their colour. Each skill she masters brings a habitat back to life: grey trees bloom, rivers flow, and animals move in and come to live in her sanctuary. Her progress shows up as a world filling with animals, not as numbers on a screen.

Design pillars:
1. **Hands-on maths.** She drags, slides, stacks, splits and hops real-feeling objects. Answers are built, not picked.
2. **Concrete → Pictorial → Abstract (CPA).** Each skill starts with objects, moves to drawings like ten-frames, then to plain numerals. This is the same approach UK schools use (White Rose / maths mastery), so it matches what she does in class.
3. **Endless and adaptive.** Questions are generated, never hand-written. The game tracks every individual fact and keeps practising the shaky ones.
4. **Never punishing.** A wrong answer leads to a hint, never a "fail" screen. No timers unless she picks a speed game.
5. **No reading required.** Every instruction is spoken with a natural voice. Icons and characters carry the rest.
6. **10–15 minute sessions** that end on a high, with a reason to come back tomorrow.

## 3. Learning scope (UK Year 1 → Year 2 number strand)

Number bonds stay at the heart of the game, widened to the whole number-fluency strand she'll meet at 6–7.

| Realm | Skills | Key representations |
|---|---|---|
| 1. Meadow | Subitising to 10, bonds to 5 and to 10, "one more / one less" | Dot patterns, ten-frame, fingers |
| 2. Forest | Add/subtract within 10, fact families, missing numbers (7 + ? = 10) | Part-whole "cherry" model, bar model |
| 3. River | Teen numbers, bonds to 20, bridging through 10 (8+5 = 8+2+3) | Double ten-frame, bead string, number line |
| 4. Mountains | Doubles, halves, near doubles (6+7) | Mirror/symmetry, domino pairs |
| 5. Sky Castle | Place value to 100, tens bonds to 100 (30+70) | Base-ten rods/cubes, hundred square |
| 6. Ocean | 2-digit ± 1-digit, bonds to 100 (64+36), comparing < > = | Number line jumps, balance scale |
| 7. Stars (stretch) | Counting in 2s/5s/10s → early multiplication | Arrays, equal groups |

Each realm has 8–12 map nodes, a boss challenge, and an endless practice pool. Shape, time and measurement are left out on purpose. They could be a later expansion.

## 4. Mini-games (each one can teach many skills)

| Mini-game | Interaction | Skills |
|---|---|---|
| **Ten-Frame Fill** | Drag counters into frames; frames "click" full | Bonds to 10/20, subitising |
| **Cherry Split** | Pull a number apart into two parts, or join two parts | Part-whole, fact families |
| **Bead Slider** | Slide beads on a two-colour bead string | Bonds, bridging through 10 |
| **Frog Hop** | Drag a frog along a number line in jumps | Add/subtract, bridging, counting on |
| **Balance Scales** | Add weights until it balances (7+3 = 6+?) | Equivalence, missing numbers |
| **Feed the Creature** | Drag the food that "makes 10" to a hungry creature | Bonds recall |
| **Bubble Pairs** | Pop two floating bubbles that make the target (optional speed mode) | Fluency |
| **Builder** | Snap base-ten rods/cubes together to build a number | Place value |
| **Memory Match** | Flip cards to find bond pairs | Recall |
| **Market Stall** | Pay with coins to make 10p, 20p, £1 | Applied bonds |
| **Boss: Storm Clearing** | A mix of the realm's mini-games; each correct answer clears part of the cloud | Realm review |

Hints come in three steps, triggered by a wrong answer or by hesitating: (1) the voice repeats the question, (2) a visual hint appears (the frame shows the gap), (3) the companion demonstrates, then she does it.

## 5. Adaptive engine (the brain)

- **Skill graph:** skills, each with a set of facts (bonds to 10 = 11 facts), plus which skills must come first.
- **Per-fact record:** attempts, correct, response time, Leitner box. A fact counts as fluent when it's answered correctly in under ~3s on 3 separate days.
- **Question mix:** about 70% current skill, 20% review of facts that are due, 10% stretch.
- **Representation fading:** the same fact moves from counters → ten-frame → numerals as accuracy rises, and drops back down if she struggles.
- **Unlocks** follow mastery, but she can always replay anything and there's always something new.
- Unit tests cover the generator and the scheduler (the parts most likely to go quietly wrong).

## 6. Rewards and meta-game

- **World restoration:** the main reward. Mastered nodes visibly bring the map back to life.
- **Creature collection:** new creatures join after nodes and bosses. A sticker-book "creaturepedia".
- **Home garden:** she spends gems she has earned decorating a garden where her creatures live.
- **Companion growth:** the companion grows and gets outfits and accessories.
- **Daily gift:** a small surprise for playing today. Streaks are never punished.
- **Celebrations:** a fanfare, confetti and a creature dance. Big moments get bigger celebrations.

## 7. Presentation

- **Art:** one consistent illustrated style (soft painterly cartoon), drawn for an iPad in landscape. Layered parallax backgrounds per realm, characters animated with squash-and-stretch and idle "breathing", particle effects.
- **Art source** (decision needed):
  - **A. AI-generated set (recommended):** consistent style from fixed prompts and reference images, then cleaned up. Best visuals for the cost.
  - **B. Free CC0 packs (e.g. Kenney):** consistent and free, but generic-looking.
  - **C. Commission an illustrator:** best result, but costly and slow.
- **Voice:** about 300 pre-generated lines from a natural TTS voice. Numbers are recorded separately and stitched into templates ("What goes with ___ to make ___?"). *Fun option:* a parent records the companion's lines.
- **Music:** a gentle loop per realm, plus satisfying sound effects (pops, clicks, chimes, rising pitch on streaks).

## 8. Grown-up area (PIN-gated)

- A mastery heat-map of every fact (e.g. a grid of the sums to 10, coloured from red to green).
- Time played, accuracy trend, current focus skills.
- Settings: optional session time limit, sound and voice volume, profiles, export/import a backup.

## 9. Tech

- **Phaser 3 + TypeScript + Vite.** Phaser handles scenes, tweens, drag input, particles, audio and scaling, so there's one dependency instead of a stack of them.
- Installable PWA, fully offline. Saves to IndexedDB per profile.
- Content is data-driven: skills, realms and nodes live in JSON, so new content means no new code.
- Vitest for engine logic only.
- Built fresh on a `v2` branch. Nothing from v1 is carried over except the profile and offline ideas.

## 10. Milestones

| Milestone | Delivers | Gate to continue |
|---|---|---|
| **M0: Vertical slice** | Art direction locked; companion; Realm 1 map (3 nodes); **Ten-Frame Fill + Bubble Pairs at full polish**; voice; core adaptive engine | Playtest with her. **Does she ask to play again unprompted?** If not, rethink before scaling. |
| **M1: First two realms** | Realms 1–2 complete; 5 mini-games; hints; restoration; creature collection; grown-up dashboard | Plays happily for a week |
| **M2: Middle realms** | Realms 3–4; 8 mini-games; bosses; home garden; daily gift | Fact data shows real progress |
| **M3: Full game** | Realms 5–7; all mini-games; music; polish pass; install on her device | Done (then iterate on what she plays most) |

M0 is deliberately small and polished. v1 went wide and shallow; this time the fun gets proven before the game grows.

## 11. Decisions (agreed 2026-10-31)

| Decision | Choice | Effect on the plan |
|---|---|---|
| Device | **Android tablet** | Chrome PWA in landscape, installed to the home screen. Performance budget set for a mid-range tablet: texture atlases, ≤60 sprites on screen, test on the real device from M0. |
| Theme | **Animals / pets** | Becomes an **animal sanctuary**. Her companion is a baby pet from a basket. Each realm is a habitat whose animals she helps by mastering skills; the "home garden" becomes her sanctuary where the rescued animals live. Restoration now means bringing a habitat back for its animals. |
| Scope | **Full Y1–Y2 number strand** | All 7 realms as in section 3. |
| Art | **AI-generated** | Needs the image-generation connector signed in via `/mcp` before M0 art work. |
| Voice | **Generated natural voice** | About 300 pre-generated lines plus number clips. |
| School year | **Year 2 (a very young Y2)** | Realms 1–2 become a short, confidence-building consolidation of Year 1, with placement checks that skip nodes she already knows. The main focus is Realms 3–6; Realm 7 is the stretch. Pacing stays gentle: concrete stage first, longer, no speed modes until facts are secure. |

## Status

- **M0** done (2026-10-31).
- **M1** done (2026-10-31): Meadow + Forest (12 stops incl. 2 bosses), Ten-Frame, Bubble Pairs, Feed the Animal, Cherry Split, Pet Hop; sanctuary + sticker book; grown-ups dashboard. Live at https://guyh77.github.io/sparkle-meadow/ (auto-deploys from `v2`).
- **M2** done (2026-10-31): River (teens, bonds to 20, bridging) + Mountains (doubles, halves, near doubles); new games Bead Slider, Butterfly Doubles, Memory Match (8 total); ten-frame, hop, bubbles and feed go to 20; gems, daily gift, sanctuary shop with draggable decorations; grown-ups time limit and backup save/load.
