# Flâneur
### *The city writes its poems in music.*

---

## Vision

Flâneur is a location-aware music experience for walkers. As you move through a city, the app plays music that belongs to where you are — not algorithmically generic, but culturally rooted, atmospherically specific, and emotionally resonant.

The name comes from the 19th-century French concept of the urban wanderer — someone who moves through the city not to get somewhere, but to *feel* it. Flâneur gives that experience a soundtrack.

The origin of this idea: sitting on a school bus crossing the Brooklyn Bridge, passing through Chinatown, with *In the Mood for Love* playing through headphones. The city and the music collapsed into one feeling. That's the experience Flâneur is designed to reproduce — not occasionally, but every time you walk out the door.

---

## Product Summary

| | |
|---|---|
| **Platform** | iOS (Swift / SwiftUI), v1 |
| **City Coverage (v1)** | New York City — Manhattan |
| **Music Source** | Spotify API (user's existing account) |
| **Core Interaction** | Passive — walk, listen, let the city lead |
| **Target User** | Urban walkers who treat the city as an aesthetic experience |

---

## Core Design Philosophy

> **Music leads. Geography follows.**

The app never interrupts a song. Location changes are acknowledged only when the music naturally ends — at the end of a track, or when the user skips. The city updates your playlist on its own time, not yours.

This single rule shapes everything: the UX, the technical architecture, and the emotional texture of the experience.

---

## Neighborhood Scoring System

Each neighborhood has a "sound identity" built from four weighted dimensions:

| Dimension | Label | Weight | Description |
|---|---|---|---|
| **Historical/Cultural** | **History** | 35% | What community built this place? What music is part of its DNA? |
| **Spatial/Atmospheric** | **Atmosphere** | 35% | What does this street *feel* like? Industrial, sacred, open, dense? |
| **Current Demographics** | **People** | 20% | What's popular here now? Last.fm regional charts (`geo.getTopTracks`) |
| **Time of Day** | *(system only)* | 10% | Morning vs. late night — same block, different world. Runs silently in background, no user control. |

### User Dimension Controls

Users can toggle **History**, **Atmosphere**, and **People** on or off in settings. Time always runs silently.

When dimensions are toggled, the active weights renormalize — the ratio between enabled dimensions stays the same:

| State | History | Atmosphere | People |
|---|---|---|---|
| All on | 35% | 35% | 20% |
| People off | 50% | 50% | 0% |
| Atmosphere off | 63.6% | 0% | 36.4% |
| History only | 100% | 0% | 0% |

This lets users tune whether they want the music to reflect what a place *was*, what it *feels like*, or who's *here now* — or any combination.

### Data Sources
- **Last.fm API**: recommendation engine — `track.getSimilar` (History), `tag.getTopTracks` (Atmosphere), `geo.getTopTracks` (People). Free, no enterprise gate.
- **Spotify API**: playback (App Remote) + search (name → playable URI) only. Not used for recommendation.
- **POI data**: Google Places API — used to infer spatial atmosphere / assign mood tags (gallery district, religious institutions, nightlife, parks)
- **Manual + AI curation**: hand/AI-picked anchor tracks and mood tags for each named neighborhood
- **User crowdsourcing**: community-submitted location + song + feeling tags (see Social Layer)

---

## Music Recommendation Logic

> **Architecture note (2025):** Spotify deprecated its `/recommendations`, Related Artists, and Audio Features endpoints for all new apps on 2024-11-27. Flâneur therefore does **not** use Spotify for recommendation. Spotify is used only for **playback** (App Remote) and **search** (resolving track names → playable URIs). Recommendation is powered by the **Last.fm API**, whose `track.getSimilar`, `tag.getTopTracks`, and `geo.getTopTracks` endpoints remain open and free.

### Three-Source Mixing (the toggles made real)

Each neighborhood draws from up to three distinct Last.fm sources. The three user-facing layer toggles (**History / Atmosphere / People**) each control one source, and their normalized weights set the mix ratio.

| Toggle | Weight | Last.fm Source | What it pulls |
|---|---|---|---|
| **History** | 35% | `track.getSimilar` seeded by the neighborhood's anchor tracks | Songs sonically/behaviorally similar to the neighborhood's cultural DNA — new tracks, not just the seeds |
| **Atmosphere** | 35% | `tag.getTopTracks` for the neighborhood's mood tags | Songs matching the *feel* (e.g. `jazz`, `ambient`, `dreamy`, `shoegaze`) |
| **People** | 20% | `geo.getTopTracks` (regional popularity) | What's currently popular in the area |
| *(Time)* | 10% | system modifier | Shifts which sub-pool is favored by hour of day |

**How a neighborhood playlist is built when the user enters:**

1. For each **enabled** toggle, query its Last.fm source → a candidate list
2. Normalize the enabled toggles' weights (same ratio rule as before — see Scoring System)
3. Sample from each source proportional to its normalized weight → a mixed pool
4. (Optional, light touch) Re-rank lightly by the user's Spotify top tracks so personal taste nudges order without overriding geography
5. Resolve each chosen track → Spotify URI via Spotify Search (graceful skip if not on Spotify)
6. Queue → play until the next neighborhood trigger

**Geography stays dominant.** The sources are all defined by *place* (the neighborhood's seeds, tags, and region). User taste only lightly re-ranks in step 4 — it never generates the pool. This is the inverse of a personalized-recommendations app: the place picks the music, you only tilt it.

### Per-neighborhood data required

Each curated neighborhood now needs three inputs (not just seed tracks):
- **anchorTracks** — a few hand/AI-picked songs that define the cultural core (feeds History)
- **moodTags** — Last.fm tags describing the atmosphere, e.g. Greenwich Village → `jazz`, `folk`, `acoustic` (feeds Atmosphere)
- **region** — a Last.fm geo country code (feeds People)

> **Known v1 limitation — People dimension:** `geo.getTopTracks` resolves by country, so all Manhattan neighborhoods share the same US chart and the People source won't differentiate between them in v1. Options: keep People at low weight for v1, or defer it (toggle present but lightly weighted) until a finer-grained popularity signal is available. Revisit before launch.

### Dynamic by design

`getSimilar` and `tag.getTopTracks` each return dozens–hundreds of tracks, and Last.fm's data shifts over time. Combined with random sampling and the time-of-day modifier, the same neighborhood yields a different walk every time — dynamic without depending on any deprecated algorithmic endpoint.

This means the same Chinatown sounds different on different walks, and different again to someone whose History anchors lean Wong Kar-wai vs. Cantopop. The neighborhood has an identity; the mix keeps it alive.

---

## Neighborhood Trigger Logic

```
Song is playing
    ↓
User crosses neighborhood boundary
    ↓
[Nothing happens — music continues]
    ↓
Song ends naturally  OR  user presses skip
    ↓
System checks current GPS location
    ↓
If location = new neighborhood:
    → Haptic feedback (single pulse)
    → Neighborhood name appears briefly on map, then fades
    → New neighborhood playlist begins
Else:
    → Continue current neighborhood playlist
```

**Key principle**: The boundary is detected in real time, but the *acknowledgment* is deferred to the music's natural rhythm.

---

## Manhattan v1 — Neighborhood Map

| Neighborhood | Sound Identity | Notes |
|---|---|---|
| Chinatown | Cantonese pop, HK film scores, Wong Kar-wai era | Seed: 花样年华 OST, Beyond, Faye Wong |
| Greenwich Village | Jazz, folk, 60s singer-songwriter | Seed: Miles Davis, Bob Dylan, Bill Evans |
| Harlem | Hip-hop, soul, gospel | Seed: Biggie, Nina Simone, Mahalia Jackson |
| Lower East Side | Punk, indie rock, underground | Seed: Talking Heads, Yeah Yeah Yeahs, Velvet Underground |
| East Village | Indie, art rock, downtown NYC | Seed: LCD Soundsystem, Patti Smith |
| Washington Heights | Latin, reggaeton, merengue | Seed: Bad Bunny, Marc Anthony |
| Upper West Side | Classical, chamber music | Seed: Bernstein, Yo-Yo Ma |
| Tribeca | Ambient, minimal, art-adjacent | Seed: Brian Eno, Nils Frahm |
| SoHo | Fashion-forward, electronic, French pop | Seed: Air, Daft Punk, Sébastien Tellier |
| Midtown | *POI-driven fallback* | No strong cultural identity — defer to atmosphere data |
| Financial District | *POI-driven fallback* | Same |

---

## Visual Design Direction

**Aesthetic**: Hardware-skeuomorphic. A warm-grey control device (Braun / Dieter Rams lineage) floating over a vintage paper map. Green phosphor LCD readouts. Single orange accent. The UI looks like a piece of precision audio equipment, not a software app.

**Reference prototype**: `flaneur-paper.html` — fully interactive HTML prototype with all tokens, shadows, and interactions implemented. All SwiftUI specs derive from this.

**Full spec**: `FLANEUR_DESIGN_SYSTEM.md`

### UI Layer Stack
```
z0  Map — full-screen vintage paper (static raster tiles, MKTileOverlay)
z1  Pins, walked trail, you-are-here stamp, neighborhood label
z2  FABs (top-left menu, top-right settings) + LIVE · GPS pill
z3  Neighborhood transition overlay (serif stamp, fades in/out)
z4  Bottom sheet — hardware panel (peek 46% / full 95%)
z5  Settings — slides in from left
```

### Key UI Decisions
- **Map style**: Vintage paper — warm `#E9E1D0` base, ink-grey streets, hand-drawn feel. Pre-rendered as raster tiles for v1. Not MapKit default.
- **Bottom sheet**: Two detents — peek (LCD + transport visible) and full (knob + fader + layer switches). Never dismissible — persistent hardware panel.
- **One accent color**: `#E8511E` orange. Play button active, you-are-here marker, layer switch nubs, knob tick. Everything else is warm grey or LCD green.
- **Typography**: SF Mono (the machine talking) on LCD and controls. Crimson Text italic (the city talking) on map labels, neighborhood names, transition overlay.
- **Layer switches**: Three custom hardware-style toggles — History, Atmosphere, People. Not system `Toggle`. Springy animation, orange nub when on.
- **Live waveform**: Recessed LCD canvas, center-mirrored bars. Bands recolor by amplitude: green → amber → orange. Faux envelope driven by beat oscillator for v1.

---

## Transition Experience

- **No crossfade, no audio manipulation**
- Song plays to its natural end
- On neighborhood change: single haptic pulse (`UIImpactFeedbackGenerator .soft`) + neighborhood name in Crimson Text italic, centered, `opacity 0→1→1→0` over 3.2s
- Map shows no neighborhood boundaries during normal use
- Boundary visualization appears *only* at the moment of transition, then disappears

---

## Social Layer — Crowdsourced Memory

Users can submit: **location + song + optional one-line feeling**

Example: *Brooklyn Bridge → 花样年华 OST → "felt like I was in a movie"*

These submissions:
- Feed into the neighborhood track pool as weighted signals
- Accumulate into a **collective sonic memory** of each place
- Can be browsed in the neighborhood detail panel ("What others heard here")

This is not a feed, not a social network. It's a city-wide archive of musical moments.

---

## v1 Scope (MVP)

**In scope:**
- GPS-based neighborhood detection (Manhattan)
- Spotify OAuth login + playback
- Manual curation for 9 core neighborhoods
- POI fallback for uncurated zones
- Bottom music panel — play/pause/skip/queue
- Rotary volume knob + ambience fader
- History / Atmosphere / People layer toggles with weight renormalization
- Live waveform level meter (faux envelope)
- Neighborhood transition (haptic + name overlay)
- Basic user submission (location + song tag)
- Vintage paper map with custom tile style
- Settings panel (Spotify status, haptics, location, reduce motion)

**Out of scope for v1:**
- Android
- Other cities
- Full social feed / browsing other users' submissions
- Offline mode
- Beat-accurate waveform (Spotify Audio Analysis sync)
- Vision model atmosphere scoring

---

## Future Directions

- **v2**: Paris, Shanghai — expand with local curators per city
- **v2**: Vision model (Street View) for automated atmosphere scoring
- **v3**: Collaborative playlists — walk with a friend, share one soundtrack
- **Long term**: Commission original music for specific locations

---

*"You are not listening to music in a city. You are listening to the city."*
