# Cinema-Grade AI Film Localization: UI/UX Design System & Interface Specification
**Document ID:** UI-UX-SPEC-2026-V1  
**Target Platform:** Cinema-Grade Multilingual Localization & Dubbing (BRAHMA AI / VAANI / ATMAN Inspired)  
**Parent Specifications:** [docs/MASTER_ARCHITECTURE.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/MASTER_ARCHITECTURE.md), [docs/ARCHITECTURE_GAP_ANALYSIS.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/ARCHITECTURE_GAP_ANALYSIS.md), [docs/SYSTEM_DESIGN.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/SYSTEM_DESIGN.md), [docs/DATA_STORAGE_DESIGN.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/DATA_STORAGE_DESIGN.md), [docs/API_CONTRACTS.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/API_CONTRACTS.md), [docs/FULL_MOVIE_PIPELINE.md](file:///c:/Users/acer/3D%20Objects/kavrai%20AI/docs/FULL_MOVIE_PIPELINE.md)  
**Status:** Canonical UI/UX Design Specification  

---

## 1. Executive Summary & Apple Pro Design Philosophy

The Studio QC Workbench is engineered for film directors, sound supervisors, dialogue editors, and lead VFX artists who require an interface matching the polish, fluid responsiveness, and ergonomic elegance of macOS and Apple Pro software (Final Cut Pro, Logic Pro, DaVinci Resolve).

### Core Design Principles
1. **Light-First Elegance:** The default aesthetic embraces a radiant, crystalline light palette (`#F5F5F7` canvas, pure white frosted surfaces, delicate 1px borders, and vibrant Apple accents). It delivers unparalleled clarity for long hours of script transcreation, library management, and acoustic editing.
2. **Theatrical Darkroom Switch:** A dedicated, single-click toggle instantly transforms the UI into high-contrast **Theatrical Darkroom Mode** (`#0D0E12` deep charcoal base, subdued ambient luminance), calibrated specifically for darkroom projection environments and color grading.
3. **Three-Zone Adaptive Ergonomics:** All primary film editing, transcreation inspection, and lip-sync review actions occur within an uncompromised three-zone viewport—eliminating disjointed modals and context switching.
4. **Physicality & Tactile Motion:** Interactive sliders, playhead scrubbing, drawer side-sheets, and syllable badges are animated using real-world **spring physics** (via Framer Motion), delivering continuous 60fps tactile feedback.
5. **Frame-Accurate Precision:** Displays SMPTE timecodes (`HH:MM:SS:FF`) in tabular monospaced typography with dedicated single-frame stepping controls (`J-K-L` editing shortcuts).

---

## 2. Design Tokens & Dual-Theme System (Light & Dark Specifications)

The interface uses standard CSS variables integrated with Tailwind CSS tokens. Every token is paired across the default **Light Studio Mode** and the optional **Theatrical Darkroom Mode**.

### 2.1 Core Color Tokens & CSS Variables

```css
:root {
  /* ==========================================================================
     LIGHT STUDIO MODE (DEFAULT)
     ========================================================================== */
  --canvas-bg: #F5F5F7;                 /* Apple Canvas Off-White */
  --surface-primary: #FFFFFF;           /* Pure White Card Base */
  --surface-secondary: #FAFAFC;         /* Elevated Surface */
  --surface-tertiary: #E8E8ED;          /* Subtle Recessed Well */
  --surface-glass: rgba(255, 255, 255, 0.72); /* Frosted Acrylic */
  
  --border-subtle: rgba(0, 0, 0, 0.06); /* Hairline Divider */
  --border-regular: rgba(0, 0, 0, 0.12); /* Card Border */
  --border-active: #0071E3;             /* Focus / Active Ring */

  --text-primary: #1D1D1F;              /* Deep Slate (Highest Contrast) */
  --text-secondary: #6E6E73;            /* Studio Gray Metadata */
  --text-tertiary: #86868B;             /* Inactive / Placeholder */
  --text-inverse: #FFFFFF;

  /* Studio Accents (Vibrant Apple Pro Spectrum) */
  --accent-primary: #0071E3;            /* Apple System Blue */
  --accent-hover: #0077ED;
  --accent-success: #34C759;            /* Theatrical Pass Green */
  --accent-warning: #FF9500;            /* Syllable Warning Amber */
  --accent-danger: #FF3B30;             /* Consent Revoked / Desync Red */
  --accent-purple: #AF52DE;             /* Bilabial Viseme [p, b, m] */
  --accent-cyan: #32ADE6;               /* Labiodental Viseme [f, v] */

  /* Timeline & Waveform Accents */
  --timeline-track-bg: #E5E5EA;
  --timeline-playhead: #FF3B30;         /* Classic Film Playhead Red */
  --timeline-waveform-start: #0071E3;
  --timeline-waveform-end: #5AC8FA;

  /* Glassmorphism & Elevation */
  --glass-blur: blur(24px) saturate(180%);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.12);
}

[data-theme="darkroom"] {
  /* ==========================================================================
     THEATRICAL DARKROOM MODE (DARK THEME)
     ========================================================================== */
  --canvas-bg: #0D0E12;                 /* Theatrical Abyss Black */
  --surface-primary: #18191E;           /* Deep Charcoal Card */
  --surface-secondary: #22242B;         /* Elevated Surface */
  --surface-tertiary: #131418;          /* Recessed Track Well */
  --surface-glass: rgba(24, 25, 30, 0.75); /* Smoked Glass */

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-regular: rgba(255, 255, 255, 0.10);
  --border-active: #5E5CE6;

  --text-primary: #F5F5F7;              /* High-Contrast White */
  --text-secondary: #A1A1A6;            /* Secondary Slate */
  --text-tertiary: #636366;             /* Muted Metadata */
  --text-inverse: #0D0E12;

  --accent-primary: #5E5CE6;            /* Luminous Indigo */
  --accent-hover: #6D6BEB;
  --accent-success: #30D158;
  --accent-warning: #FF9F0A;
  --accent-danger: #FF453A;
  --accent-purple: #BF5AF2;
  --accent-cyan: #64D2FF;

  --timeline-track-bg: #15161B;
  --timeline-playhead: #FF453A;
  --timeline-waveform-start: #5E5CE6;
  --timeline-waveform-end: #64D2FF;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.7);
}
```

---

## 3. Typography & Hierarchical Scale

The typography relies on Apple's system fonts: **SF Pro Display** for prominent headlines, **SF Pro Text** for dense data and controls, and **SF Mono** (or **JetBrains Mono**) with tabular numbers for SMPTE timecodes.

| Style Role | Font Family | Size (px) | Line Height | Weight | Letter Spacing | CSS Equivalent |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Display Title** | SF Pro Display | 32 px | 40 px | Bold (700) | -0.02em | `text-3xl font-bold tracking-tight` |
| **Headline 1** | SF Pro Display | 24 px | 32 px | Semibold (600) | -0.015em | `text-2xl font-semibold` |
| **Headline 2** | SF Pro Text | 18 px | 24 px | Semibold (600) | -0.01em | `text-lg font-semibold` |
| **Body (Default)** | SF Pro Text | 14 px | 20 px | Regular (400) | 0.0em | `text-sm font-normal` |
| **Body Emphasized**| SF Pro Text | 14 px | 20 px | Medium (500) | 0.0em | `text-sm font-medium` |
| **Subhead / Pill** | SF Pro Text | 12 px | 16 px | Medium (500) | +0.01em | `text-xs font-medium` |
| **SMPTE Timecode** | SF Mono | 13 px | 16 px | Semibold (600) | +0.05em | `font-mono text-[13px] font-semibold tabular-nums` |
| **Micro Caption** | SF Pro Text | 11 px | 14 px | Regular (400) | +0.02em | `text-[11px] text-secondary` |

---

## 4. Studio Application Views & User Workflows

### View 1: Cinematic Dashboard
The high-level studio executive portal providing live status across ongoing film localizations, GPU render cluster utilization, and pending director sign-offs.

```
+----------------------------------------------------------------------------------------------------+
|  [Apple Logo]  KAVRAI AI STUDIO   Projects   Reels   Worker Cluster   QC Reviews   [Profile] [Theme]|
+----------------------------------------------------------------------------------------------------+
|  STUDIO OVERVIEW                                                    [+ New Localization Project]   |
|  Active Theatrical Projects: 4   |   Total Processed Frames: 1,842,910   |   Cluster Status: Online |
+----------------------------------------------------------------------------------------------------+
|  +----------------------------------+ +----------------------------------+ +----------------------+ |
|  | ACTIVE FILM: DUNE: PART TWO      | | ACTIVE FILM: OPPENHEIMER         | | GPU CLUSTER HEALTH   | |
|  | Target: Hindi (hi-IN) - Reel 02  | | Target: Spanish (es-ES) - Reel 01| | Nodes: 8x (32x L40S)  | |
|  | Progress: [██████████░░░░] 74.2% | | Progress: [████████████] 100.0%  | | VRAM Load: 58.4%     | |
|  | Pending QC Approvals: 3 Shots    | | Status: LOCKED & CONFORMED       | | Render FPS: 184 FPS  | |
|  | [Open QC Workbench]              | | [Download Theatrical IMF Master] | | [Inspect Queues]     | |
|  +----------------------------------+ +----------------------------------+ +----------------------+ |
+----------------------------------------------------------------------------------------------------+
|  RECENT QC AUDIT NOTIFICATIONS                                                                     |
|  • Shot 142 (Oppenheimer): Christopher Nolan flagged lip-sync desync on frame 3442 (+2 frames pa). |
|  • Reel 01 (Dune: Part Two): Hindi 5.1 dialogue loudness normalized to -24.0 LKFS (+/- 0.2 dB).    |
+----------------------------------------------------------------------------------------------------+
```

---

### View 2: Movie Library (Project Explorer)
A visual gallery presenting studio feature films with film strip posters, multi-language release flags, and SMPTE duration meters.

```
+----------------------------------------------------------------------------------------------------+
|  PROJECT LIBRARY  |  Search films...               [Filter: All Studios]  [Sort: Recently Modified]|
+----------------------------------------------------------------------------------------------------+
|  +------------------------+  +------------------------+  +------------------------+                |
|  | [MOVIE POSTER ARTWORK] |  | [MOVIE POSTER ARTWORK] |  | [MOVIE POSTER ARTWORK] |                |
|  | "Oppenheimer" (2023)   |  | "Dune: Part Two" (2024)|  | "Interstellar" (2014)  |                |
|  | 2h 49m | 24.000 fps    |  | 2h 46m | 24.000 fps    |  | 2h 49m | 23.976 fps    |                |
|  | Audio: 5.1 | ACEScc    |  | Audio: 7.1 | ACEScg    |  | Audio: 5.1 | Rec.709   |                |
|  | Targets: [HI] [ES] [DE]|  | Targets: [HI] [FR] [JA]|  | Targets: [ES] [IT]     |                |
|  | Status: 92% Complete   |  | Status: In Review      |  | Status: Exported Master|                |
|  +------------------------+  +------------------------+  +------------------------+                |
+----------------------------------------------------------------------------------------------------+
```

---

### View 3: S3 Direct Multipart Upload Workflow
A drag-and-drop ingestion interface supporting 20GB–100GB ProRes 422 HQ / 4444 files with live 64MB part progress rings and automated scene cut trigger options.

```
+----------------------------------------------------------------------------------------------------+
|  UPLOAD THEATRICAL MASTER  | Project: Oppenheimer | Reel 01                                        |
+----------------------------------------------------------------------------------------------------+
|  +-----------------------------------------------------------------------------------------------+ |
|  |                                                                                               | |
|  |                                [ Cloud Arrow Upload Icon ]                                    | |
|  |                           Drag & Drop Master Video or Browse Stems                            | |
|  |               Supports: Apple ProRes 422 HQ / 4444, Avid DNxHR, IMF / DCP Packages           | |
|  |                                                                                               | |
|  +-----------------------------------------------------------------------------------------------+ |
|  ACTIVE MULTIPART TRANSFER: oppenheimer_reel_01_prores4444.mov (48.3 GB)                          |
|  Uploading Part 242 of 720: [██████████████████████████░░░░░░░░░░░░░░░] 33.6% (16.2 GB / 48.3 GB)  |
|  Transfer Speed: 142 MB/s | Direct to S3: s3://cinema-vault-raw/... | Est. Remaining: 3m 45s       |
|  [x] Auto-trigger PySceneDetect cut detection upon upload completion                               |
|  [x] Auto-extract dialogue & 5.1 M&E stems via Meta Hybrid Demucs v4                              |
+----------------------------------------------------------------------------------------------------+
```

---

### View 4: Three-Zone Film Editing & QC Workspace
The core workhorse interface of the platform: dual-viewport player and script inspector in the upper zone, anchored over the 60fps multi-track audio/viseme timeline in the lower zone.

```
+----------------------------------------------------------------------------------------------------+
|  [Back to Projects]  Dune: Part Two | Reel 02 | Target: Hindi (hi-IN)    [Darkroom Mode]  [Export]     |
+----------------------------------------------------------------------------------------------------+
|  UPPER ZONE (LEFT: Dual Viewport A/B Video Player)  | UPPER ZONE (RIGHT: Script & Viseme Inspector)|
|  +-----------------------+ +-----------------------+ | Active Shot: #142 (00:14:22:10 - 00:14:25:04) |
|  | [VIEWPORT A: Original]| | [VIEWPORT B: Localized| | Character: Paul Atreides (Timothée Chalamet)|
|  |                       | |        Hindi Sync]    | | Performer Consent: [SAG-AFTRA VERIFIED ✓]     |
|  |   Original Actor 4K   | |   ATMAN Lip-Sync 4K   | | --------------------------------------------- |
|  |                       | |                       | | Source (EN): "We cannot cross the perimeter"  |
|  |                       | |                       | | Target (HI): "हम शाम से पहले सीमा पार..."     |
|  +-----------------------+ +-----------------------+ | Syllables: [11 / 11 EXACT MATCH (Green)]      |
|  SMPTE: 00:14:23:12 | Split-Wipe: [ 50% ] | Heatmap | Lip Sync Error: LSE-C: 9.14 (Target >= 8.2)   |
|  [◄ Prev Shot]  [Play (Space)]  [Next Shot ►]        | [Nudge Viseme -1f] [Nudge +1f] [Re-render]    |
+----------------------------------------------------------------------------------------------------+
|  LOWER ZONE: 60FPS MULTI-TRACK AUDIO & VISEME TIMELINE                                             |
|  Tracks         | 00:14:20:00        00:14:22:00        00:14:24:00        00:14:26:00             |
|  Video Track    | [ Shot 141 ] [      Shot 142 (Active Speech)      ] [ Shot 143 ]                 |
|  Dialogue (EN)  |              |-- "We cannot cross the perimeter" -|                              |
|  Dialogue (HI)  |              |-- "हम शाम से पहले सीमा पार..." ---|                              |
|  Viseme Closures|              |   [p] (bilabial)       [m] (bilabial)|                            |
|  M&E Bed (5.1)  | ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ |
|  Timeline Zoom: [───●────────] 4x | Jump to Frame: [ 3442 ] | Grid: 24.000 fps SMPTE               |
+----------------------------------------------------------------------------------------------------+
```

---

### View 5: Render Queue & GPU Worker Monitor
Tracks parallel shot jobs across the Kubernetes cluster with live progress dials, current frame rates, and node assignment.

```
+----------------------------------------------------------------------------------------------------+
|  GPU CLUSTER MONITOR | Active Workers: 32x NVIDIA L40S | Queue Depth: 48 Shots | Thruput: 184 FPS  |
+----------------------------------------------------------------------------------------------------+
|  Job ID        Shot ID   Tier       Model       Node           Progress      FPS    Est. Remaining |
|  #job_456      Shot 142  MASTER     LatentSync  g-node-01-gpu2 [████████░░]  6.2    3.4s           |
|  #job_457      Shot 144  MASTER     LatentSync  g-node-02-gpu1 [████░░░░░░]  6.4    8.1s           |
|  #job_458      Shot 145  PREVIEW    MuseTalk    g-node-03-gpu0 [██████████]  32.0   COMPLETE       |
|  #job_459      Shot 148  PREVIEW    MuseTalk    g-node-03-gpu1 [████████░░]  31.4   0.8s           |
+----------------------------------------------------------------------------------------------------+
|  [Pause All Low Priority]    [Preempt Batch with Interactive QC]    [Download Render Diagnostics]  |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Editing Timeline & Video Player Interaction Design

### 5.1 High-Performance Canvas/WebGL Multi-Track Waveform
To guarantee 60fps responsiveness across 150,000+ frames:
- The multi-track timeline is rendered onto an **HTML5 OffscreenCanvas** backed by WebGL.
- Audio waveforms are pre-computed as multi-resolution peak level pyramids (`min/max` buffers at $1\times, 4\times, 16\times, 64\times$ zoom levels), eliminating CPU spikes during high-speed scrubbing.
- The red playhead (`--timeline-playhead`) is rendered on a dedicated top canvas layer animated via `requestAnimationFrame`.

### 5.2 Dual-Viewport Player Interaction Modes
Directors can toggle three synchronized video inspection modes:
1. **Side-by-Side Locked View:** Original master plate on the left, localized AI synced plate on the right, locked to the exact same frame.
2. **Split-Wipe Slider:** A vertical draggable split bar across a single 4K player. Dragging left/right reveals the original vs. AI localized plate seamlessly.
3. **Difference Heatmap Overlay:** Highlights modified pixels in neon green/amber. Visualizes exactly where ATMAN generated new mouth/jaw pixels while verifying that eyes, forehead, hair, and background plates remain identical ($SSIM \ge 0.992$).

---

## 6. Multilingual Dubbing & Lip-Sync Controls

### 6.1 Interactive Syllable Delta Pill
Positioned prominently above the translated text editor:
- **Green Pill (`Exact Match`):** Target syllable count matches source ($\Delta = 0$).
  ```html
  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
    11 / 11 Syllables (Exact Match)
  </span>
  ```
- **Amber Pill (`+1 Warning`):** Minor variance ($\Delta = \pm 1$). Lip-sync engine can stretch/compress naturally via WSOLA.
- **Red Pill (`+3 Error`):** Significant mismatch ($\Delta \ge 2$). Triggers an AI re-prompt suggestion: *"Phrase too long for mouth flap window. Try: 'हम शाम से पहले नहीं जा सकते' (11 syllables)."*

### 6.2 Viseme Anchor Nudging Handles
On the timeline viseme track:
- Bilabial closures (`[p, b, m]`) are marked with purple diamond badges (`#AF52DE`).
- Clicking and dragging a diamond badge nudges the closure anchor by $\pm 1$ frame, updating the constraint in the underlying transcreation record without manual timestamp typing.

---

## 7. Reusable Component Specification (Radix UI + Tailwind)

Every interactive UI element is built upon headless, accessible **Radix UI Primitives** styled with Tailwind CSS tokens.

### 7.1 Primary Studio Action Button
```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] shadow-sm",
        secondary: "bg-[var(--surface-primary)] border border-[var(--border-regular)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] shadow-sm",
        glass: "bg-[var(--surface-glass)] backdrop-blur-md border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-regular)] shadow-sm",
        theatrical: "bg-[var(--accent-success)] text-white hover:opacity-90 font-semibold"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
```

### 7.2 Glassmorphic Card Surface
```html
<div class="bg-[var(--surface-primary)]/80 backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl p-6 shadow-[var(--shadow-md)] transition-all hover:border-[var(--border-regular)]">
  <!-- Content -->
</div>
```

---

## 8. Motion, Physics & Animation System (Framer Motion)

Interface transitions use real-world spring physics to mimic macOS Sonoma/Sequoia system interactions.

### 8.1 Standardized Spring Physics Configurations
```typescript
export const studioSprings = {
  // Quick, tactile spring for buttons, badge pills, and frame stepper
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 35,
    mass: 0.8
  },
  // Smooth, elegant spring for side-drawers, dialog sheets, and card expansions
  smooth: {
    type: "spring",
    stiffness: 350,
    damping: 30,
    mass: 1.0
  },
  // Playhead dampening to prevent jarring stops during high-speed scrubbing
  playhead: {
    type: "spring",
    stiffness: 400,
    damping: 28
  }
};
```

---

## 9. Accessibility (WCAG 2.1 AA) & Keyboard Navigation

### 9.1 Contrast Ratios
- **Light Studio Mode:** High-contrast text (`#1D1D1F` on `#FFFFFF`) delivers an **11.4:1** contrast ratio (exceeding WCAG AAA requirement of 7:1).
- **Darkroom Mode:** Luminous text (`#F5F5F7` on `#18191E`) delivers a **13.8:1** contrast ratio.
- Secondary metadata (`#6E6E73` on `#FFFFFF`) maintains **4.8:1** (exceeding WCAG AA requirement of 4.5:1).

### 9.2 Studio Keyboard Shortcuts (Final Cut Pro / DaVinci Resolve Standard)

| Shortcut Key | Action | Function |
| :--- | :--- | :--- |
| `Space` | Play / Pause | Starts or pauses locked dual-viewport playback |
| `J` | Reverse Playback | Steps playback backward ($1\times, 2\times, 4\times$) |
| `K` | Halt Playback | Freezes playhead on the current exact SMPTE frame |
| `L` | Forward Playback | Steps playback forward ($1\times, 2\times, 4\times$) |
| `Left Arrow (←)` | Step -1 Frame | Nudges playhead backward by exactly 1 frame |
| `Right Arrow (→)`| Step +1 Frame | Nudges playhead forward by exactly 1 frame |
| `Shift + ← / →` | Step $\pm 1$ Second | Nudges playhead by 24 frames |
| `Up Arrow (↑)` | Previous Shot | Jumps playhead to previous shot cut boundary |
| `Down Arrow (↓)` | Next Shot | Jumps playhead to next shot cut boundary |
| `R` | Re-render Preview | Triggers instant Tier 1 MuseTalk preview render for current shot |
| `Cmd / Ctrl + L` | Lock Shot | Director lock approval on active render version |
| `D` | Toggle Theme | Switches between Light Studio Mode and Theatrical Darkroom Mode |

---

## 10. Responsive Layouts & Breakpoint Specifications

| Device / Display Profile | Resolution Target | Layout Adaptation |
| :--- | :--- | :--- |
| **Studio Pro Display (Default)** | **$2560 \times 1440$ / $3840 \times 2160$** | Full three-zone layout: Dual 4K viewports at native 100% zoom, side-by-side with full inspector and 8-track timeline. |
| **Studio Laptop Display** | **$1728 \times 1117$ / $1440 \times 900$** | Dual viewports scale to 70%; inspector collapses to an expandable slide-out drawer on the right. |
| **Tablet Director Review** | **$1024 \times 768$ (iPad Pro)** | Single active viewport with swipe toggle between original and localized sync; timeline simplified to 2 tracks (Video + Dubbed Audio). |

---

## 11. System Verification & Sign-Off

This document constitutes the binding UI/UX Design System specification for the frontend engineering team. All React components, Tailwind tokens, animations, keyboard handlers, and layout structures must adhere strictly to the visual tokens, spatial models, and accessibility standards defined herein.
