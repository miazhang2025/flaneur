# Flâneur — Promo Site · Dev Plan & Checklist

> Living checklist. Build is done **one item at a time**, checking this list each step.
> Nothing in "Build Checklist" starts until you confirm this plan.

---

## Confirmed decisions
- **Stack:** Vite (vanilla JS) + ES modules. GSAP (ScrollTrigger) + Three.js (WebGL) + Lenis smooth scroll.
- **3D walkman:** real Three.js WebGL, procedural model styled to the UI. Hover = small rotation offset; play button gates audio; a "next location" button advances.
- **Music audio:** videos muted by default; first press of the walkman play button enables sound; switching location fades to that location's song.
- **About → Music transition:** the green LCD scales up to fullscreen on scroll and *becomes* the screen the location videos play inside.

## Assets you'll provide (placeholders used until then)
1. `WEIRT-TRIAL` font file (.otf/.ttf) → drop in `public/fonts/`
2. 5 location videos (Chinatown / Lower East Side / SoHo / Greenwich Village / Harlem) → `public/videos/`
3. 5 location songs (audio) → `public/audio/`
4. Waitlist form URL
5. Your contact info (for CTA + footer)
6. Optional: logo / favicon

---

## Site structure (Header + 5 sections + Footer)

### Header
Fixed, minimal. Wordmark **Flâneur** (WEIRT-TRIAL) left; section anchors + accent **Join waitlist** button right. Transparent over hero, fades into panel material on scroll. Mobile: collapsible.

### Section 1 — Hero
- Background: the provided **Mapbox iframe**, full-bleed, pointer-events off, with a warm wash to match palette.
- Foreground: **FLÂNEUR** in WEIRT-TRIAL + two short sentences. **Dynamic grain** effect over the foreground (animated film-grain canvas, blended).
- Entrance: GSAP title mask-reveal + lines fade-up + scroll cue.
- Copy: *"The city writes its poems in music."* / *"A geo-location based app plays the song that belongs to every street you walk."*

### Section 2 — About (poetic title, not "About")
- Title draft: **"Sound Follows Footsteps"** (eyebrow `01 · ORIGIN`). Alt options: "The Wanderer's Ear" / "A Soundtrack for Wandering" / "Where the City Speaks".
- Style: skeuomorphic UI palette — warm-grey panel, recessed cards, LCD-green accents.
- Narrative (drafted from the LinkedIn post): Brooklyn Bridge → Chinatown → *In the Mood for Love* → built the app; explain the **etymology of *flâneur*** (the 19th-century French term for the urban wanderer who walks to feel the city, not to arrive). No "music leads, geography follows" line here — that idea lives in Section 4. Flowing, literary.
- Animated **LCD** (place / coords / live mini-waveform) + layer switches (History/Atmosphere/People) — this LCD is the one that zooms to fullscreen into Section 3.
- CTA button **Try it / Join waitlist** → form URL (placeholder).

### Section 3 — Music (pinned, the centerpiece)
- ScrollTrigger **pins** the section; scroll scrubs through 5 subsections, crossfading **video + text** each step. Videos play **inside the LCD screen frame** carried from Section 2.
- **Three.js walkman**, styled to the UI (LCD, transport buttons, knob). Hover → small rotation offset. Play button → enable/switch audio. Next button → advances to next location (programmatic scroll). Walkman LCD mirrors the current place.
- 5 locations (scroll order): **Chinatown → Lower East Side → SoHo → Greenwich Village → Harlem**, each with coords, one-line poetic text, genre/mood tag, song, video.
- Audio: muted video loops; walkman play gates sound; song crossfades on location change.

### Section 4 — Technical
- Dark green-LCD / terminal interface. Explains the recommendation engine: 4 weighted dimensions (**History 35 · Atmosphere 35 · People 20 · Time 10**), Last.fm sources, pipeline *"neighborhood identity → your taste → curated blend → the track that belongs here"*, Spotify = playback only.
- Visuals: monospace phosphor-green console, animated weight bars, pipeline diagram, typewriter / scroll-reveal.

### Section 5 — CTA
- **Coming soon to iOS** · **Add to wishlist** (form URL) · **contact info**.
- Tagline in serif italic: *"You are not listening to music in a city. You are listening to the city."*

### Footer
Wordmark, tagline, contact links, © 2026.

### Cross-cutting
- Smooth scroll (Lenis + ScrollTrigger). `prefers-reduced-motion` disables grain/waveform/heavy scrub (design-system requirement). Responsive w/ mobile fallbacks (lighter or static walkman on small screens). Lazy-load videos; dispose Three.js. Fonts: WEIRT-TRIAL, Crimson Text (Google), SF Mono / ui-monospace.

---

## Build Checklist (do in order, one at a time)

**Phase 0 — Scaffold** ✅
- [x] 0.1 Init Vite vanilla project; install `gsap`, `three`, `lenis`; `index.html` shell, `vite.config.js`
- [x] 0.2 Design tokens CSS (from design system) + base styles + font loading (WEIRT placeholder)
- [x] 0.3 Section skeleton w/ anchors, Header + Footer, Lenis + ScrollTrigger smooth-scroll wiring

**Phase 1 — Hero** ✅
- [x] 1.1 Mapbox iframe background + warm overlay
- [x] 1.2 Hero foreground (WEIRT title + 2 sentences) + entrance animation + scroll parallax
- [x] 1.3 Dynamic grain effect on foreground (animated, full-hero, reduced-motion aware)

**Phase 2 — About + LCD** ✅
- [x] 2.1 About skeuomorphic layout + flowing narrative copy (two-column)
- [x] 2.2 Animated LCD waveform + hardware layer switches
- [x] 2.3 CTA button (waitlist placeholder → #wishlist, `data-waitlist` for later URL swap)
- [x] 2.4 Scroll transition: green screen grows to fullscreen → Music backdrop

**Phase 3 — Music (pinned)** ✅
- [x] 3.1 Tall scroll section + 5 stage panels + `neighborhoods` data
- [x] 3.2 Fullscreen screen (from About LCD) + hold-then-crossfade video/text per location
- [x] 3.3 Three.js walkman: procedural model styled to UI (LCD/buttons/knob) + lighting
- [x] 3.4 Walkman interactions: hover tilt, play (audio gate, LCD PLAYING), next (scrolls to next location)
- [x] 3.5 Audio manager: per-location song, crossfade on switch, gated by play (silent until files added)

**Phase 4 — Technical** ✅
- [x] 4.1 Dark terminal/LCD layout + typewriter console pipeline + animated weight bars (History/Atmosphere/People/Time) + "Music leads. Geography follows." law

**Phase 5 — CTA + Footer** ✅
- [x] 5.1 CTA ("Take the city for a walk" / coming soon / wishlist / contact + grain) + footer (wordmark, tagline, links, ©)

**Phase 6 — Polish** ✅ (engineering) · ⏳ (assets from you)
- [x] 6.1 Responsive / mobile audit — all 5 sections verified at phone width
- [x] 6.2 `prefers-reduced-motion` (content stays visible) + a11y (sr-only walkman prev/play/next, aria labels)
- [x] 6.3 Perf: code-split Three.js + mapbox → initial JS 2.5 MB → **148 KB** (gzip 56 KB). Font + videos wired.
- [x] 6.4 Final QA: every section screenshotted + interactions tested
- [ ] **Pending your assets** → drop in & I wire instantly:
      • 5 songs → `public/audio/` (`chinatown.mp3`, `les.mp3`, `soho.mp3`, `greenwich.mp3`, `harlem.mp3`)
      • Waitlist URL + contact (email / IG) → `src/config.js`
