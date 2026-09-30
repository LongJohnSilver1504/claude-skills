# Cold-start moods

Use only when the ladder in the skill reached the bottom: no codebase tokens, no assets, no reference, no anchor. The goal is a matched set chosen from the product idea, so the user redirects a proposal instead of answering a questionnaire.

## Classify the product

| Mood | Signals in the brief |
| --- | --- |
| **Premium / confident** | fintech, B2B SaaS, analytics, enterprise, legal, insurance, ops dashboards, "for teams" |
| **Warm / approachable** | wellness, health, coaching, community, parenting, nonprofit, education, food, hobby marketplaces |
| **Technical / builder** | developer tool, API, CLI, infra, devops, database, monitoring, open source |
| **Playful / consumer** | games, creator tools, youth audience, dating, music, social, anything explicitly "fun" |
| **Elegant / editorial** | publishing, portfolio, luxury, fashion, gallery, boutique, agency, "premium but soft" |

When the brief states the mood ("playful app for teens"), use it. When the idea spans two moods with no lean, ask which should dominate — that is the one question worth asking.

## Product type → mood

The signal lists above leave too much room: "a booking tool for a spa" and "a booking tool for a freight yard" read the same through them and must not land in the same lane. Look the product type up here first, and fall back to the signals only for something genuinely not on the list.

The third column is the point of the table. Every lane has a version of itself that a model reaches for by reflex, and the product type is what pulls it off that default — without it this is a preset catalogue, which is the thing we are not building.

| Product type | Mood | Pull it off the lane's default |
| --- | --- | --- |
| B2B SaaS, "for teams" | Premium | the accent belongs on one action per view, not on the nav, the logo and every heading |
| Fintech, banking, payments | Premium | numbers are the interface: tabular figures and a real data type role before any brand decision |
| Analytics, BI, reporting | Premium | the chart palette is a separate decision from the brand accent, and it is categorical, not a ramp |
| Insurance, legal, compliance | Premium | density reads as seriousness here; airy layouts read as a marketing site for a product that is not one |
| Enterprise admin, ops console | Premium | dark-native is a request, not a default — operators mostly sit in bright rooms |
| CRM, sales tooling | Premium | the row is the unit; design the table before the dashboard |
| HR, payroll, people ops | Premium → Warm | the warmest thing in a payroll product should be the copy, not the palette |
| Healthcare, patient-facing | Warm | warm never means soft contrast; clinical information carries the strictest contrast in the product |
| Medical, clinician-facing | Premium | this is an ops console with lives attached — density and zero ambiguity beat reassurance |
| Wellness, fitness, meditation | Warm | resist the gradient; this lane's tell is a purple-to-pink hero |
| Coaching, therapy, mental health | Warm | one quiet accent and generous measure; enthusiasm in this lane reads as a sales pitch |
| Education, courses, e-learning | Warm | progress and state need their own color meanings before the brand gets one |
| Parenting, family, childcare | Warm | warm, not childish — the buyer is an exhausted adult, not the child |
| Nonprofit, civic, community | Warm | photography of real people carries this lane; illustration reads as a stock template |
| Food delivery, restaurants | Warm | the food is the art direction; keep the interface quiet enough to let imagery run |
| Hobby marketplace, local services | Warm | seller-supplied images will be inconsistent — design the frame that makes them look deliberate |
| Developer tool, API, CLI | Technical | mono is for code, data and timestamps; a mono body is the lane's costume, not its craft |
| Infrastructure, devops, monitoring | Technical | status color is the whole product; fix the status ramps before the accent |
| Database, data platform | Technical | the empty state and the ten-thousand-row state are the two real designs |
| Security, cybersecurity | Technical | severity needs an ordered scale, not four unrelated hues; and never a matrix-green hero |
| AI product, agent, LLM tooling | Technical | streaming, partial and failed output are the primary states — design those first |
| Open source project site | Technical | the install command is the hero; treat everything above it as overhead |
| Games, game adjacent | Playful | the game supplies the spectacle; the UI around it stays quiet or it competes |
| Creator tools, editors | Playful → Technical | the canvas takes the color budget; the chrome goes neutral |
| Music, audio, podcasts | Playful | artwork is the palette — pull accents from the content, do not impose one on it |
| Dating, social, community feed | Playful | one vivid hue on a quiet base; a second saturated hue turns the feed into noise |
| Youth, student, consumer app | Playful | the base still has to survive daylight on a cheap phone screen |
| Publishing, editorial, news | Elegant | measure, hierarchy and the byline scale carry it; a card grid flattens an argument into a catalogue |
| Portfolio, personal site | Elegant | the work is the design; a strong frame around weak work fools nobody |
| Agency, studio, consultancy | Elegant | one signature move executed exactly, or it reads as a template with better fonts |
| Luxury retail, fashion, beauty | Elegant | restraint is the signal: fewer weights, more space, no shadows |
| Gallery, museum, archive | Elegant | the image outline rule matters more here than anywhere else |
| Real estate, property | Elegant → Premium | photography quality decides this lane; design the bad-photo case |
| Travel, hospitality, booking | Warm → Elegant | dates, prices and availability are dense data wearing a warm coat — do not let the coat win |
| Logistics, fleet, field ops | Technical → Premium | built for gloves, glare and one hand; hit areas and contrast beat every other decision |
| Job board, recruiting | Premium → Warm | scanning is the job; the row's information hierarchy is the whole design |
| Marketplace, multi-vendor | Premium | two audiences, two surfaces — do not let the seller console inherit the buyer's art direction |
| CMS, internal content tooling | Technical | the editing surface should disappear; every control the writer does not need is a cost |

An arrow means the first mood sets type and shape while the second adjusts palette and density. A product type that is genuinely absent gets classified by the signals above, and the row that would have covered it gets added here.

## Type pairing per mood

All Google Fonts. Pair for contrast, not similarity; the pairing is a starting point, not a mandate.

| Mood | Display + body | Alternative |
| --- | --- | --- |
| Premium | Unbounded + Albert Sans | Geist + Geist, tight heading tracking |
| Warm | Zain + Nunito | Epilogue + Baskervville (literary) |
| Technical | Archivo + IBM Plex Sans (Plex Mono for code/data only) | Geist + Geist Mono for data |
| Playful | Urbanist + Open Sans | Fredoka + Nunito |
| Elegant | Gloock + Inter | EB Garamond + DM Mono (bylines, dates) |

Body copy is never monospace, even for the technical mood — mono is for code, data, timestamps and short technical labels.

## Shape and density per mood

| Mood | Radius | Depth | Density | Avoid |
| --- | --- | --- | --- | --- |
| Premium | 4–8px | flat or hairline, minimal shadow | balanced–dense | gradients as a crutch, a second saturated color |
| Warm | 12–20px | soft shadows welcome, illustration-friendly | airy | corporate blue, harsh contrast |
| Technical | 0–4px | visible grid and hairlines over shadows | dense | rounded-full buttons, pastels, playful illustration |
| Playful | 16px+ | layered depth, motion-friendly | balanced | everything loud at once — keep a quiet base |
| Elegant | 0–4px | hairline rules between sections, no cards | airy, generous margins | rounded-full buttons, tight measure |

## Palette per mood

Generate, do not copy. Take the mood's hue range and character, then build ramps with the color-system skill (constant hue, even perceived lightness steps, vividness peaking mid-ramp, denser light end) and measure every pairing in the contract.

| Mood | Neutral | Accent character | Appearance default |
| --- | --- | --- | --- |
| Premium | cool-tinted or zero-chroma | one deep, confident hue (indigo, teal, oxblood) | light |
| Warm | warm-tinted (toward orange) | terracotta, olive, ochre | light |
| Technical | zero-chroma or cool | one saturated signal color used sparingly | dark-native |
| Playful | tinted toward the accent | one vivid hue on a quiet base; extra stops only in illustration | light |
| Elegant | warm-tinted, paper-like | a metallic or earth accent, tiny footprint | light |

Two checks that fail most often: the label on the accent solid (an accent that looks fine as a swatch can fail as a button fill — measure it), and the accent's visibility against a dark page (3:1 floor for the fill itself).

## Spacing scale

4px base. Named steps with jobs; skip the in-between values unless an alignment genuinely needs them.

| Token | Value | Use |
| --- | --- | --- |
| 1 | 4px | icon-to-label, badge padding |
| 2 | 8px | label and its value, stacked related lines |
| 3 | 12px | compact component internals, dense rows |
| 4 | 16px | standard component padding |
| 6 | 24px | group separation; **content-card padding floor** |
| 8 | 32px | showcase-card padding; gap between groups in a section |
| 12 | 48px | compact section padding; hero internals |
| 16 | 64px | default section padding; connective sections on a landing page |
| 24 | 96px | weighty sections |
| 32–48 | 128–192px | pivotal landing-page sections (hero, primary proof), desktop only — step down one or two tiers on mobile |

Governing rule: **space around a group ≥ space within it.** Card padding never exceeds the gap between cards.

## Non-Latin scripts

CJK and Korean products do not take the two-family pairing model. Lock one well-built family across a weight scale (Pretendard for Korean, loaded from its own CDN and verified; Noto Sans JP / SC as unvetted starting points), `letter-spacing: 0`, `word-break: keep-all` on UI text, and line-heights looser than the Latin display floor. Verify Latin product names inside CJK copy visually; they read smaller at the same nominal size.
