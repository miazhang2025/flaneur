# Flâneur — Design System (Skeuomorphic Build)

*Sound Atlas · v1 · Manhattan*

This document captures the visual + interaction tokens for the hardware-skeuomorphic direction: a warm-grey control device sitting over a vintage paper map, with green phosphor LCD readouts and a single orange accent. It is meant to sit alongside the existing `DESIGN_SYSTEM.md` as the concrete spec for SwiftUI implementation. Creative decisions (final map art, photography, copy) stay with you; this defines the skeleton, tokens, and the tricky parts of reproducing the look in SwiftUI.

---

## 1. Design Tokens

### Color

| Token | Hex | Use |
|---|---|---|
| `panel` | `#D6D2CA` | Device body base (mid) |
| `panelHi` | `#E1DED7` | Panel gradient top |
| `panelLo` | `#CAC6BE` | Panel gradient bottom |
| `tileHi` | `#D2CFC7` | Control-tile gradient top (transport / volume / ambience / layers cards) |
| `tileLo` | `#BDB9B1` | Control-tile gradient bottom |
| `raiseHi` | `#F4F2EC` | Raised element highlight (gradient top) |
| `raiseLo` | `#CBC8C1` | Raised element shadow side (gradient bottom) |
| `ink` | `#4A463F` | Primary text / icon on panel |
| `inkSoft` | `#8A857B` | Labels, captions, secondary |
| `accent` | `#E8511E` | Single accent — play, active, markers (project `#DC5639` is interchangeable; we run slightly warmer) |
| `accentLo` | `#C23C11` | Accent gradient bottom / pressed |
| `led` | `#41D18A` | Green status LED / waveform low band |
| `amber` | `#F0A020` | Mid-level waveform / "you-are-here" pin |
| `lcdBg` | `#283230` | LCD glass background (gradient to `#2F3A37`) |
| `lcdInk` | `#7DF0B0` | LCD phosphor text/graphics |
| **Paper map** | | |
| `paper` | `#E9E1D0` | Map base |
| `paperInk` | `#7A6F58` | Printed labels / compass |
| `mapStreet` | `#C4B694` | Streets |
| `mapAve` | `#B0A07C` | Avenues / Broadway |
| `mapWater` | `#AEBEB2` | Rivers |
| `mapPark` | `#C4CDA2` | Parks |

> Accent rule: exactly one accent in the whole UI. Everything else is neutral warm-grey or LCD-green. This is what keeps skeuomorphism from looking cheap.

```swift
extension Color {
    static let panel    = Color(hex: 0xD6D2CA)
    static let panelHi  = Color(hex: 0xE1DED7)
    static let panelLo  = Color(hex: 0xCAC6BE)
    static let tileHi   = Color(hex: 0xD2CFC7)
    static let tileLo   = Color(hex: 0xBDB9B1)
    static let raiseHi  = Color(hex: 0xF4F2EC)
    static let raiseLo  = Color(hex: 0xCBC8C1)
    static let ink      = Color(hex: 0x4A463F)
    static let inkSoft  = Color(hex: 0x8A857B)
    static let accent   = Color(hex: 0xE8511E)
    static let accentLo = Color(hex: 0xC23C11)
    static let led      = Color(hex: 0x41D18A)
    static let amber    = Color(hex: 0xF0A020)
    static let lcdBg    = Color(hex: 0x283230)
    static let lcdInk   = Color(hex: 0x7DF0B0)
    // …paper tokens
    init(hex: UInt) {
        self.init(.sRGB,
                  red:   Double((hex >> 16) & 0xFF)/255,
                  green: Double((hex >> 8) & 0xFF)/255,
                  blue:  Double(hex & 0xFF)/255)
    }
}
```

### Typography

| Role | Face | Notes |
|---|---|---|
| Hardware labels (`TRANSPORT`, `LEVEL`, `LAYERS`) | SF Pro / system | 8–9 pt, weight 800, `tracking ≈ 0.2em`, uppercase, `inkSoft` |
| Brand plate (`FLÂNEUR`) | system | 15 pt, weight 800, `tracking 0.16em` |
| LCD readout | SF Mono (monospaced) | 18 pt place name, 10 pt meta; color `lcdInk` with soft glow |
| Map labels / poetic text | **Crimson Text**, italic | the one place the project's serif lives; ties the device to the brand |

Type pairing intent: monospaced = the machine talking; serif italic = the city talking. Keep them apart — never mix mono into the map or serif into the controls.

### Spacing & Radius

- Base unit: **4 pt**. Card padding 12–16, gaps 14.
- Radius: device shell `30`, cards `16`, LCD `12`, small buttons `13–14`, pills/switches fully rounded.
- Tap targets: **44×44 pt minimum** (knob/fader caps are larger; pad invisible hit areas around them).

### Elevation (the skeuomorphic core)

Two recipes do 90% of the work. Reuse them everywhere.

**Raised** (button, knob, switch nub):
- light from top-left, shadow to bottom-right
- outer: `+x +y` dark shadow + `−x −y` white shadow
- inner: 1px top white highlight

**Recessed / pressed / LCD / slots** (inset):
- inner top-left dark shadow + inner bottom-right white

```
raised:    drop( y:4 x:3 blur:8 #00000047 ) + drop( y:-2 x:-2 blur:6 #FFFFFFB3 ) + innerTopHighlight
inset:     innerShadow( y:3 x:3 blur:8 #000000B3 ) + innerShadow( y:-2 x:-2 blur:5 #FFFFFF99 )
```

SwiftUI (iOS 17+) supports inner shadows directly on a fill's `ShapeStyle`:

```swift
// Raised button
Circle()
    .fill(LinearGradient(colors: [.raiseHi, .raiseLo],
                         startPoint: .topLeading, endPoint: .bottomTrailing))
    .shadow(color: .black.opacity(0.28), radius: 6, x: 3, y: 4)
    .shadow(color: .white.opacity(0.7),  radius: 5, x: -2, y: -2)

// Recessed LCD glass
RoundedRectangle(cornerRadius: 12)
    .fill(LinearGradient(colors: [Color(hex:0x202825), Color(hex:0x2F3A37)],
                         startPoint: .top, endPoint: .bottom)
        .shadow(.inner(color: .black.opacity(0.7), radius: 6, y: 3))   // iOS 17 ShapeStyle inner shadow
    )
```

Pre-iOS 17 fallback for inner shadow: overlay a `RoundedRectangle().stroke(lineWidth:)` with a blur and mask to the shape. Given the stack targets current Xcode/iOS, prefer the native `.shadow(.inner(...))`.

---

## 2. Component Catalog

Each entry: what it is, key tokens, state, and SwiftUI build note.

### 2.1 Device Panel / Card
Warm-grey rounded container, raised. The sheet body is a `panelHi → panelLo` gradient (160°); inner control cards are a `tileHi → tileLo` gradient. Top corners `30` for the sheet, `16` for inner cards. Cards are slightly *recessed* (inset top highlight + bottom shadow) so controls feel set into them. The whole panel was lightened one step in v1.1 (warmer-white, same hue) — keep the value high and the hue warm; do not drift toward cool grey.

### 2.2 LCD Readout
Recessed dark-green glass. Contents: place name (mono 18, `lcdInk`, glow), meta row (coords · track · mini level bars). Scanline texture = a 2px repeating horizontal line overlay at ~10% black, 50% opacity.
- SwiftUI: `Canvas` or a tiled `Image` for scanlines; text uses `.font(.system(.body, design: .monospaced))` + `.shadow(color: .lcdInk.opacity(0.6), radius: 6)`.

### 2.3 Transport Buttons
Round raised buttons. Sizes: side `40`, center `54`. Pressed = inset shadow + 1px down. Center play button when playing = orange gradient fill, icon `#FFF4EE`.
- State: `idle / pressed / playing`. Icon swaps play ⟷ pause.
- SwiftUI: `Button` with `.buttonStyle` that applies the inset shadow on `configuration.isPressed`.

### 2.4 Rotary Knob (Volume)
70×70 raised disc, radial highlight at 50%/32%, inner ring inset, orange tick at top. Value 0–100 maps to −135°…+135° (`270°` sweep). Drag vertically to change.
- SwiftUI:
```swift
Circle().fill(knobGradient)
    .overlay(Capsule().fill(.accent).frame(width:4,height:14).offset(y:-26)) // tick
    .rotationEffect(.degrees(-135 + value/100 * 270))
    .gesture(DragGesture().onChanged { g in
        value = (startValue + (startY - g.location.y) * 0.6).clamped(0...100)
    })
```
Add a `sensoryFeedback(.selection, trigger:)` on integer value steps for a detented feel.

### 2.5 Vertical Fader (Ambience)
Recessed slot + raised cap (40×25). Fill below the cap glows orange. Value 0–100% → drives the field-recording blend under the music (your "spatial atmosphere" dimension made audible). Drag cap vertically; tap anywhere on the slot jumps to position.

### 2.6 Toggle Switch
60×31 pill. OFF = grey recessed; ON = dark-green recessed with orange nub + green "ON" text. Nub uses a springy ease (`cubic-bezier(.5,1.6,.4,1)`).
- SwiftUI: custom view, not the system `Toggle`. Animate nub `offset` with `.spring(response: 0.25, dampingFraction: 0.6)`.

### 2.7 Level Meter — **Live Waveform**
Recessed green LCD with a real-time, center-mirrored bar waveform. Amplitude bands recolor: `<0.5 led → <0.8 amber → else accent`. Flatlines on pause.
- SwiftUI:
```swift
TimelineView(.animation) { tl in
    Canvas { ctx, size in
        // push newest sample, shift buffer, draw mirrored rounded bars with .addFilter(.shadow)
    }
}
```
- Data source note: Spotify iOS SDK does **not** expose raw PCM. Two options:
  1. **Faux but believable** (recommended for v1): drive the envelope from playback position + a beat oscillator. Visually indistinguishable, zero audio pipeline.
  2. **Beat-accurate**: pre-fetch Spotify **Audio Analysis** (`segments[].loudness`, `beats[]`) for the current track and replay it in sync with `playbackPosition`. More work, but the bars actually breathe with the song.

### 2.8 Map Pins
Teardrop, ink-grey default, orange when active. Tap selects → updates LCD + hood label. Label is Crimson Text italic above the pin.

### 2.9 You-Are-Here Marker
Orange stamp dot with cream ring + slow pulse ring (`scale 0.6→3`, 2.6s). On paper it reads as an inked location stamp rather than a glowing GPS dot.

### 2.10 Floating Buttons (FAB)
Top-left = menu/settings, top-right = settings/account (`46×46`, radius `14`, raised). Mirror the Uber/DoorDash floating pattern. The "LIVE · GPS" pill sits centered between them.

### 2.11 Settings Page
Slides in from the left (`translateX -100% → 0`, 0.4s). Same panel material. Grouped recessed cards: **Connection** (Spotify status + Premium tag + green LED), **Playback** (Haptics, Background location), **Display** (Reduce motion), **About** (City, Version). Footer = the tagline in serif italic. Deliberately shallow — one screen, no nesting.

---

## 3. Layout & Interaction Specs

### 3.1 Screen Stack
```
z0  Map (full-screen paper)        — base navigation layer
z1  Pins, trail, you-are-here, hood label
z2  FABs + LIVE pill
z3  Transition overlay (neighborhood reveal)
z4  Bottom sheet (hardware panel)
z5  Settings (slides over everything)
```

### 3.2 Bottom Sheet Detents
- **Peek**: ~46% of screen visible (LCD + transport + level meter reachable).
- **Full**: ~95% (knob, fader, layers).
- Drag follows finger, snaps to nearest on release. Map stays interactive behind the peek.

```swift
.sheet(isPresented: .constant(true)) {
    PanelView()
        .presentationDetents([.fraction(0.46), .large])
        .presentationDragIndicator(.visible)
        .presentationBackgroundInteraction(.enabled(upThrough: .fraction(0.46)))
        .interactiveDismissDisabled()          // it's a persistent panel, never dismiss
}
```
If `.sheet` chrome fights the custom look, build a custom panel with an `offset` + `DragGesture` and two snap constants — that's what the HTML prototype does.

### 3.3 The Flâneur Transition (locked product rule)
Music leads, geography follows. The neighborhood-change indication fires **only** when a track ends naturally or the user skips — never mid-song, even if the GPS boundary was crossed earlier.

```
on trackDidEnd / userDidSkip:
    let hood = currentNeighborhood(from: location)
    if hood != lastAnnouncedHood {
        haptic(.impact(.soft))           // single pulse
        reveal(hood.name)                // serif stamp, ~3.2s fade
        lastAnnouncedHood = hood
    }
    play(nextTrack(for: hood))
```
- Haptics: `UIImpactFeedbackGenerator(style: .soft)` or `.sensoryFeedback(.impact, trigger: hoodChange)`.
- Reveal overlay: Crimson Text italic, center, `opacity 0→1→1→0` over 3.2s.

### 3.4 Layers = the scoring dimensions
The three "Layer" switches are the sound-identity weights made tangible:
- **History** 35% (历史 · 文化)
- **Atmosphere** 35% (空间 · 氛围)
- **People** 20% (当下 · 人群)
- *(Time 10% stays an automatic modifier — not a user switch.)*

Toggling a layer off removes its contribution from the seed-pool weighting before the Spotify `/recommendations` filter runs.

---

## 4. Reproducing the Paper Map in SwiftUI

MapKit's styling is too limited for the paper aesthetic (no paper grain, fold creases, or controllable ink palette). Two viable paths:

1. **Pre-rendered paper tiles (recommended for v1).** V1 is Manhattan only, 9 curated neighborhoods — a bounded area. Render the styled map once (Figma / Blender / cartography tool), export as raster tiles, serve via `MKTileOverlay` over a hidden base map, or just as a pannable `Image` with an overlay coordinate transform. Total art control, offline-friendly, and the fold/grain/labels are baked in.
2. **Mapbox.** Supports custom vector styles + raster texture layers if you later expand past Manhattan and need live tiles.

Live elements (you-are-here, pins, trail, hood label) are SwiftUI views positioned with a lat/long → screen-point transform on top of the static map layer — don't bake those into the tiles.

---

## 5. Build Checklist (quality floor)

- [ ] One accent color only; audit for stray colors.
- [ ] Every control has a pressed/active state with the inset-shadow recipe.
- [ ] 44 pt minimum hit areas (esp. knob, fader cap, pins).
- [ ] `Reduce Motion` disables waveform + radar/pulse animations.
- [ ] VoiceOver labels on transport, knob (`adjustable` trait), switches, FABs.
- [ ] Background location entitlement + `NSLocationAlwaysAndWhenInUseUsageDescription` (see existing project doc).
- [ ] Transition fires only on track-end/skip — never mid-song.
- [ ] LCD + waveform legible in sunlight (test outdoors; raise `lcdInk` contrast if needed).

---

*Reference prototype: `flaneur-paper.html` — all tokens, shadows, and interactions above are pulled from it 1:1.*
