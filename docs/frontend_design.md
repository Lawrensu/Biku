# Biku — Frontend Design System
> Design contract for implementation. Every decision here is intentional and justifiable. Reference this file when building components. Do not deviate from these tokens without updating this document first.

---

## 1. Design Philosophy

Biku is not a productivity tool. It is an intimate shared space for two people. Every design decision which are colour, typography, spacing, motion must serve that emotional context. The interface should feel like a private journal, not a dashboard.

**Core design principles:**
- **Warmth over efficiency** — generous spacing, soft colours, unhurried interactions
- **Intimacy over feature density** — never crowd the screen; let content breathe
- **Consistency over cleverness** — use the same patterns everywhere; surprise belongs in content, not UI
- **Emotion-first hierarchy** — the most emotionally significant element on any screen gets the most prominent position

---

## 2. Colour System

### 2.1 Design Rationale

The palette is built from two emotional axes. The warm axis — Linen, Powder Blush, Black Cherry — carries intimacy, warmth, and tenderness. The cool axis — Blue Slate, Carbon Black — provides grounding, calm, and readability. Neither axis dominates; they work together the way two people in a relationship do.

Black Cherry serves a dual role: it is both the destructive/error colour and the dark anchor of the warm family (text on Powder Blush surfaces). This is intentional — it keeps the palette minimal and coherent.

### 2.2 Base Tokens

These are the raw colour values. Never use these directly in components — always use the semantic tokens defined in Section 2.3.

```css
/* Raw palette — do not use directly in components */
--color-linen:        #FDFAF8; /* Warm off-white — sourced from Claude Design bundle for better contrast at small text sizes */
--color-carbon:       #1B1C20;
--color-blush:        #EDB1B0;
--color-slate:        #5B6E7D;
--color-cherry:       #5C0403;
--color-cherry-tint:  #F5E8E8; /* ~10% cherry on linen — error backgrounds, light mode */
```

### 2.3 Semantic Tokens

Semantic tokens are what components use. They map to base tokens differently per mode. This is the layer that makes dark mode work cleanly — components never need to know which mode they are in.

```css
:root {
    /* Surfaces */
    --surface-base:     #FDFAF8; /* Page background — warm off-white, never pure white */
    --surface-card:     #FFFFFF; /* Card, panel surfaces — slight lift over base */
    --surface-elevated: #F5EDE0; /* Modals, dropdowns */

    /* Text */
    --text-primary:     #1B1C20;
    --text-secondary:   #5B6E7D;
    --text-muted:       #8A9BA6;
    --text-on-blush:    #5C0403; /* Text sitting on Powder Blush surfaces */
    --text-on-dark:     #FAF1E8; /* Text sitting on Carbon Black / Slate surfaces */

    /* Brand */
    --accent-warm:      #EDB1B0; /* Powder Blush — primary brand accent */
    --accent-cool:      #5B6E7D; /* Blue Slate — secondary accent */

    /* Destructive / Error */
    --error-text:       #5C0403;
    --error-surface:    #F5E8E8;
    --error-border:     #D4A0A0;

    /* Interactive */
    --btn-primary-bg:       #EDB1B0;
    --btn-primary-text:     #5C0403;
    --btn-primary-hover-bg: #E4A09F;

    --btn-secondary-bg:     #1B1C20;
    --btn-secondary-text:   #FAF1E8;
    --btn-secondary-hover-bg: #2E2F35;

    /* Borders */
    --border-subtle:    rgba(27, 28, 32, 0.08);
    --border-default:   rgba(27, 28, 32, 0.15);
    --border-strong:    rgba(27, 28, 32, 0.30);

    /* Focus ring */
    --focus-ring:       #EDB1B0;
}

[data-theme='dark'] {
    /* Surfaces — warm-dark stack, three levels for elevation */
    --surface-base:     #1A1612; /* Page background — warm black */
    --surface-card:     #242019; /* Cards, panels */
    --surface-elevated: #2E2920; /* Modals, dropdowns */

    /* Text */
    --text-primary:     #FAF1E8; /* Linen inverted to foreground */
    --text-secondary:   #9E9890;
    --text-muted:       #6B6560;
    --text-on-blush:    #5C0403; /* Unchanged — blush surfaces exist in both modes */
    --text-on-dark:     #FAF1E8;

    /* Brand — unchanged, these are identity colours */
    --accent-warm:      #EDB1B0;
    --accent-cool:      #5B6E7D;

    /* Destructive / Error */
    --error-text:       #F0A0A0; /* Lightened for legibility on dark surface */
    --error-surface:    #2A1515;
    --error-border:     #5C2020;

    /* Interactive */
    --btn-primary-bg:       #EDB1B0;
    --btn-primary-text:     #5C0403;
    --btn-primary-hover-bg: #E4A09F;

    --btn-secondary-bg:     #FAF1E8;
    --btn-secondary-text:   #1B1C20;
    --btn-secondary-hover-bg: #EDE4D6;

    /* Borders */
    --border-subtle:    rgba(250, 241, 232, 0.06);
    --border-default:   rgba(250, 241, 232, 0.12);
    --border-strong:    rgba(250, 241, 232, 0.24);

    /* Focus ring */
    --focus-ring:       #EDB1B0;
}
```

### 2.4 Colour Usage Rules

- **Powder Blush (`--accent-warm`) on buttons:** text must always be `--text-on-blush` (`#5C0403`). Never Carbon Black, never white.
- **Black Cherry (`#5C0403`) as destructive:** only used for delete confirmations, error text, and text on blush surfaces. Never used decoratively.
- **Blue Slate (`--accent-cool`):** secondary information, muted labels, empty states, the "calm" partner to blush's warmth.
- **Linen (`--surface-base`) in light mode:** the page background is never pure white. `#FDFAF8` provides warmth while giving body text better contrast at small sizes than the rawer `#FAF1E8`.
- **Dark mode surfaces:** three levels. `--surface-base` for pages, `--surface-card` for cards and panels, `--surface-elevated` for modals. The surface colour difference alone provides elevation — shadows are suppressed in dark mode.

---

## 3. Typography

### 3.1 Font Pairing Rationale

**Plus Jakarta Sans** (headings/titles) is geometric and contemporary without feeling corporate. It has enough personality to carry Biku's identity without competing with content. Its clean terminals and balanced proportions read well at large display sizes.

**Lora** (body text) is a serif designed explicitly for screen reading. It carries warmth, literary weight, and a subtle romanticism, appropriate for an application where users read descriptions of memories and emotional notes. The contrast between a clean sans heading and a warm serif body mirrors the two-person dynamic the application serves.

### 3.2 Loading

```html
<!-- In index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

### 3.3 Type Scale

```css
/* Typography tokens */
--font-heading: 'Plus Jakarta Sans', sans-serif;
--font-body:    'Lora', Georgia, serif;

/* Scale */
--text-xs:   0.75rem;   /* 12px — labels, captions */
--text-sm:   0.875rem;  /* 14px — secondary body, metadata */
--text-base: 1rem;      /* 16px — primary body text */
--text-lg:   1.125rem;  /* 18px — lead paragraphs */
--text-xl:   1.25rem;   /* 20px — small headings */
--text-2xl:  1.5rem;    /* 24px — section headings */
--text-3xl:  1.875rem;  /* 30px — page headings */
--text-4xl:  2.25rem;   /* 36px — display / hero */

/* Weights */
--weight-regular: 400;
--weight-medium:  500;
--weight-semibold: 600;

/* Line heights */
--leading-tight:  1.25; /* Headings */
--leading-snug:   1.4;  /* Subheadings */
--leading-normal: 1.6;  /* UI text */
--leading-relaxed: 1.75; /* Body / reading text */
```

### 3.4 Usage Rules

- All headings use `--font-heading` (Plus Jakarta Sans)
- All body copy, memory descriptions, notes, and reading-length text use `--font-body` (Lora)
- UI chrome (navigation labels, button text, form labels, metadata) uses `--font-heading` at small sizes
- Never mix weights within a single text element
- Italic Lora (`font-style: italic`) is available and appropriate for memory descriptions or emotional quotes

---

## 4. Spacing System

### 4.1 Scale

Spacing follows a base-4 scale. All spacing values are multiples of 4px. This creates visual rhythm and makes layout decisions predictable.

```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.25rem;  /* 20px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### 4.2 Breathing Room Principles

- Page-level horizontal padding: `--space-4` (mobile), `--space-8` (tablet), `--space-12` (desktop)
- Section spacing (vertical gap between major content blocks): `--space-10` minimum
- Card internal padding: `--space-4` (compact) or `--space-6` (standard)
- Form field gap: `--space-4` between fields, `--space-2` between label and input
- Never use less than `--space-2` as a gap between any two elements

---

## 5. Border Radius

```css
--radius-sm:   6px;   /* Small chips, badges */
--radius-md:   10px;  /* Buttons, inputs */
--radius-lg:   14px;  /* Cards, panels */
--radius-xl:   20px;  /* Large cards, modals */
--radius-full: 9999px; /* Pills, avatars */
```

All interactive elements use `--radius-md`. Cards use `--radius-lg`. Modals use `--radius-xl`. Never use sharp corners (0px) — they contradict the warm, intimate tone.

---

## 6. Motion and Animation

### 6.1 Philosophy

Transitions in Biku are not decorative. They communicate that moving between pages is meaningful — like turning a page in a shared journal. Motion should feel deliberate, unhurried, and tender. Never snappy. Never abrupt.

**Implementation decision:** Vue's built-in `<Transition>` and `<TransitionGroup>` components with CSS are used for all animations. A JS animation library (GSAP, Motion) is not required — the interaction model calls for subtlety, not complexity. Adding a library for effects achievable in CSS would introduce unnecessary dependency weight.

### 6.2 Easing

```css
/* The core easing curve — ease-out with a slow, gentle finish */
--ease-tender: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* For elements entering the screen */
--ease-enter: cubic-bezier(0.0, 0.0, 0.2, 1.0);

/* For elements leaving the screen */
--ease-exit: cubic-bezier(0.4, 0.0, 1.0, 1.0);
```

### 6.3 Duration Scale

```css
--duration-fast:   150ms; /* Hover states, focus rings, small toggles */
--duration-normal: 250ms; /* Component transitions — cards, list items */
--duration-slow:   350ms; /* Page transitions */
--duration-tender: 400ms; /* Emotional moments — memory reveal, countdown */
```

### 6.4 Page Transitions

Applied via Vue `<Transition>` wrapping `<RouterView>`. A slow fade-slide — pages slide softly upward as they enter, fade as they leave.

```css
/* Applied on the <Transition name="page"> wrapper */
.page-enter-active {
    transition: opacity var(--duration-slow) var(--ease-enter),
                transform var(--duration-slow) var(--ease-enter);
}

.page-leave-active {
    transition: opacity var(--duration-normal) var(--ease-exit),
                transform var(--duration-normal) var(--ease-exit);
}

.page-enter-from {
    opacity: 0;
    transform: translateY(12px);
}

.page-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
```

### 6.5 Component-Level Transitions

```css
/* List items entering (TransitionGroup) */
.list-enter-active { transition: all var(--duration-normal) var(--ease-enter); }
.list-leave-active { transition: all var(--duration-fast) var(--ease-exit); }
.list-enter-from   { opacity: 0; transform: translateY(8px); }
.list-leave-to     { opacity: 0; transform: translateX(-8px); }

/* Card hover state — subtle lift */
.card-interactive {
    transition: transform var(--duration-fast) var(--ease-tender),
                box-shadow var(--duration-fast) var(--ease-tender);
}
.card-interactive:hover {
    transform: translateY(-2px);
}
```

### 6.6 Motion Rules

- Never animate colour directly on hover — use pre-defined hover token values
- Respect `prefers-reduced-motion` — all transitions must be wrapped:

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## 7. Icons

**Library:** Lucide Icons via `lucide-vue-next`

```bash
bun add lucide-vue-next
```

### 7.1 Usage

```vue
<script setup>
import { Heart, MapPin, Calendar } from 'lucide-vue-next'
</script>

<template>
    <Heart :size="20" :stroke-width="1.75" />
</template>
```

### 7.2 Icon Rules

- Default size: `20px` for inline UI icons, `24px` for standalone/decorative icons
- Default stroke width: `1.75` — thinner than Lucide's default of 2, which suits the softer aesthetic
- Never scale icons with font-size — always use the `:size` prop explicitly
- Icons in buttons sit to the left of text with `gap: --space-2` between icon and label
- Never use icons without accompanying text labels on interactive elements (accessibility)

---

## 8. Component Patterns

### 8.1 Base Components

These three components are used everywhere. All other components extend them. Never bypass these with inline styles.

**BaseButton**
- Variants: `primary` (Powder Blush bg, Black Cherry text), `secondary` (Carbon Black bg, Linen text), `ghost` (transparent bg, current text colour, border)
- All variants use `--radius-md`, `--duration-fast` transition
- Minimum touch target: 44px height on mobile

**BaseInput**
- Border: `--border-default`, focus ring `--focus-ring` at 2px offset
- Error state: `--error-border` border, `--error-text` message below
- Label always above the input, never as placeholder-only

**BaseModal**
- Background overlay: `rgba(27, 28, 32, 0.6)` with `backdrop-filter: blur(4px)`
- Modal surface: `--surface-elevated`, `--radius-xl`
- Entry transition: fade + scale from `0.96` to `1.0` using `--ease-enter`

### 8.2 Card Pattern

```css
.card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: 0 2px 8px rgba(27, 28, 32, 0.06), 0 1px 2px rgba(27, 28, 32, 0.04);
}

/* Dark mode — shadows suppressed, surface colour difference provides elevation */
[data-theme='dark'] .card {
    box-shadow: none;
}
```

Cards use a Level 1 subtle shadow in light mode (sourced from Claude Design bundle). The shadow is soft enough to stay warm and never compete with content. In dark mode, shadows are removed — the contrast between `--surface-base` and `--surface-card` provides elevation without them.

---

## 9. Responsive Breakpoints

Mobile-first. Base styles define the mobile layout. Prefixes add complexity upward.

```css
/* Breakpoints — align with Tailwind defaults */
--bp-sm:  640px;   /* Large mobile / small tablet */
--bp-md:  768px;   /* Tablet */
--bp-lg:  1024px;  /* Desktop */
--bp-xl:  1280px;  /* Large desktop */
```

### Navigation behaviour by breakpoint

| Breakpoint | Navigation pattern |
|---|---|
| Mobile (`< 640px`) | Bottom tab bar — thumb-reach primary actions |
| Tablet (`≥ 768px`) | Left sidebar — icons only |
| Desktop (`≥ 1024px`) | Left sidebar — icons + labels visible |

### Grid columns by breakpoint

| Feature | Mobile | Tablet | Desktop |
|---|---|---|---|
| Memory journal | 1 column | 2 columns | 3 columns |
| Dashboard cards | 1 column | 2 columns | 2 columns |
| Lists | Full width | Full width | Centred, max-width 640px |

---

## 10. Tailwind Configuration

The design tokens above must be registered in `tailwind.config.js` so they are available as utility classes. This is the single source of truth — not the component files.

```javascript
// client/tailwind.config.js
export default {
    content: ['./index.html', './src/**/*.{vue,js}'],
    darkMode: ['selector', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                linen:  '#FDFAF8',
                carbon: '#1B1C20',
                blush:  '#EDB1B0',
                slate:  '#5B6E7D',
                cherry: '#5C0403',
                'cherry-tint': '#F5E8E8',
            },
            fontFamily: {
                heading: ['Plus Jakarta Sans', 'sans-serif'],
                body:    ['Lora', 'Georgia', 'serif'],
            },
            borderRadius: {
                sm: '6px',
                md: '10px',
                lg: '14px',
                xl: '20px',
            },
            transitionTimingFunction: {
                'tender': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                'enter':  'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
                'exit':   'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
            },
            transitionDuration: {
                '350': '350ms',
                '400': '400ms',
            },
        },
    },
}
```

---

## 11. Dark Mode Implementation

Dark mode is toggled by setting `data-theme="dark"` on the `<html>` element. This is managed by the `ui.store.js` Pinia store.

```javascript
// stores/ui.store.js
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
    const theme = ref(localStorage.getItem('biku-theme') || 'light')

    function toggleTheme() {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    watch(theme, (val) => {
        document.documentElement.setAttribute('data-theme', val)
        localStorage.setItem('biku-theme', val)
    }, { immediate: true })

    return { theme, toggleTheme }
})
```

**Why `data-theme` attribute over `prefers-color-scheme` media query?** Because users should be able to override the system preference. The store reads `localStorage` on init, falling back to `'light'`. The system preference could be read as the initial fallback if `localStorage` is empty — that would be the ideal production behaviour.

---

## 12. Accessibility Baseline

- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- All interactive elements have visible focus styles using `--focus-ring`
- Minimum touch target: 44×44px on all interactive elements
- All form inputs have associated `<label>` elements via `for`/`id`
- All images have descriptive `alt` text; decorative images use `alt=""`
- Icon-only buttons include `aria-label`
- `prefers-reduced-motion` respected for all transitions (see Section 6.6)

---

## 13. Voice, Tone & Microcopy

*Sourced from Claude Design bundle README. Applies to all UI-written strings — nav labels, empty states, prompts, button copy, page headings.*

### 13.1 Core tone

Biku is an intimate private space, not a product. Copy should feel like a soft whisper between two people — never a feature announcement, never corporate filler. Think: a well-kept shared journal.

- **Intimate and warm** — write as if only two people will ever read it
- **Understated romance** — affectionate but never saccharine; no "💕 lovebirds!" energy
- **Unhurried** — short sentences, generous pauses; let content breathe

### 13.2 Grammar & case rules

- **First-person plural always** — `"our memories"`, `"our map"`, `"our lists"`, `"we have 3 upcoming dates"`. Never `"your memories"` or `"your lists"`.
- **Lowercase-first** — nav labels, headings, and CTAs use sentence-case at most. Many labels are all-lowercase for a soft, unassuming feel: `"add a memory"`, `"how's your heart today?"`.
- **No emoji in UI chrome** — emoji are reserved strictly for user-generated content (memory notes, mood entries). Never in buttons, nav labels, headings, or empty states.

### 13.3 Microcopy examples

*Updated to match the copy actually shipped in the final build (verified against the view source directly — earlier drafts of this table described copy that changed during the polish rounds).*

| Context | Copy |
|---|---|
| Empty memories state | `"no memories yet — go make our first one together"` |
| End of memories grid | `"go make more memories"` |
| Mood prompt | `"how are you feeling today?"` |
| Empty dates state | `"no important dates yet — add our anniversary, birthdays, or any day that matters"` |
| Lists page heading | `"our lists"` |
| Dashboard greeting | `"good morning, [name]"` / `"good afternoon, [name]"` / `"good evening, [name]"` |
| Dashboard day count | `"[n] days together"` (italic Lora, `--accent-warm`) |
| Pair page heading | `"pair with your partner"` |
| Pair page subtitle | `"generate a code and share it, or enter the code your partner sent you"` |
| Solo setup reminder (`PendingInviteBanner`) | `"this space is ready and waiting for them."` / `"share [code], and the moment they join, it's ours."` |
| Memory form cover photo prompt | `"pick a cover photo"` |
| Randomiser tagline | `"let us plan our next adventure"` |
| Randomiser nudge (`RandomiserNudge`) | `"feeling spontaneous?"` / `"need an idea for the next one? spin the date randomiser"` |

### 13.4 What to avoid

- Feature-announcement language: ~~"Track your moods with our powerful mood tracker"~~
- Second person for shared things: ~~"Your memories"~~, ~~"You have 3 dates coming up"~~ — reserve "your"/"you" for things that belong to one person (your password, your email) or for correctly addressing the *other* partner ("your partner"); see the worked-through "your → our" pass below
- Exclamation marks in UI chrome
- Emoji in buttons or navigation
- Passive empty states: ~~"No memories found"~~ → something that invites action, in our voice (see the empty-state examples above)

### 13.5 The "your" → "our" rule of thumb

Established during the final pre-submission pass after noticing the randomiser said *"let us plan your next adventure"* — jarring, since the app's whole voice is plural. The rule that resolved every case in the codebase (~27 instances reviewed individually):

- **Change "your" to "our"** when the thing described is shared between the couple — memories, dates, lists, the couple itself, "our next adventure".
- **Keep "your"** when it's about something that belongs to one person — your password, your email, your name, your account, your location (e.g. a GPS permission message is inherently individual).
- **Keep "your partner"** — turning it into "our partner" would be grammatically backwards. From either partner's perspective, the *other* person is "yours" to you, not "ours" to the couple as a whole.

### 13.6 A note on dashes in copy

Two different instructions touched dashes during the build, and they're easy to conflate, so it's worth being precise for the report:

- **Comments** (`//`, `/* */`, `<!-- -->`): a late-stage instruction removed dash-separated, templated-sounding phrasing from **every code comment** in the project, rewriting roughly 90 blocks into plain first-person developer voice.
- **New UI copy for `PendingInviteBanner`**: written under an explicit "no dashes, no AI-slop language" brief, because that specific banner needed to feel unusually warm and human (it's the one moment in the app that directly narrates "your partner hasn't joined yet").
- **Existing UI copy elsewhere** (empty states, error messages, the pair page's "that's your own code — share it with your partner") **was deliberately left untouched** — those dashes were already doing normal, readable English-sentence work and rewriting them wasn't part of either instruction. The table in 13.3 reflects this: some rows have dashes, some don't, and that's accurate to the shipped app, not an inconsistency to "fix."

---

## 14. Implementation Patterns (emerged during build)

These patterns were established during Steps 5–10 and must be followed consistently across all components.

### 14.1 Form state — use `reactive`, not `ref`

For form objects, always use `reactive({ ... })` rather than `ref({ ... })`. This avoids the `.value` confusion in templates (Vue auto-unwraps `ref` at the top level, making `form.value.X` wrong in a template — it accesses a non-existent `value` key on the inner object).

```js
// ✅ correct
const form = reactive({ title: '', email: '', password: '' })
// template: v-model="form.title"

// ❌ wrong
const form = ref({ title: '', email: '', password: '' })
// template: v-model="form.title" is correct but v-model="form.value.title" is not
```

### 14.2 Passing reactive data to composables

When passing data to composables that hasn't loaded yet (e.g. from an async store), pass the computed ref itself — not `.value`. The composable uses `toValue()` internally to unwrap it reactively.

```js
// ✅ correct — composable re-triggers when couple loads
const anniversaryDate = computed(() => couple.couple?.anniversaryDate)
const { days } = useCountdown(anniversaryDate, true)

// ❌ wrong — evaluates to undefined at setup time, never updates
const { days } = useCountdown(anniversaryDate.value, true)
```

### 14.3 Sidebar page layout offset — `--sidebar-w` + `max()` centring

This pattern evolved past a simple fixed-margin offset (an earlier draft of this doc showed flat `margin-left: 64px / 200px` breakpoints — that's no longer how it works). The shipped pattern uses a CSS custom property updated per breakpoint, combined with `max()` so content both clears the sidebar *and* centres itself in the remaining space on wide viewports:

```css
/* defined once in main.css :root, updated per breakpoint */
:root                       { --sidebar-w: 0px;   }
@media (min-width: 768px)  { :root { --sidebar-w: 64px;  } }
@media (min-width: 1024px) { :root { --sidebar-w: 200px; } }
@media (min-width: 1280px) { :root { --sidebar-w: 240px; } }

/* every content view repeats this two-line shape, swapping its own max-width */
@media (min-width: 768px) {
    .page-name {
        margin-left:  max(var(--sidebar-w), calc((100vw - 960px) / 2));
        margin-right: auto;
    }
}
```

Why `max()` instead of a flat margin: at narrow tablet/laptop widths the sidebar width dominates (content sits flush against it), but on a wide monitor the `calc()` term takes over and the content block centres itself in the open space instead of hugging the sidebar with a huge gap on the right. One declaration handles both cases — no separate "centred" breakpoint needed. Each view substitutes its own content `max-width` (960px for the dashboard, 700px for settings, etc.) into the `calc()`.

**Tablet overflow fix (important):** every view's page body also has `width: 100%` in its base rule, which evaluates to the full viewport width. At exactly 768px (iPad Mini), `width: 100%` = 768px, and adding `margin-left: 64px` makes the total box 832px — overflowing the right edge by the full sidebar width. To prevent this, each view's tablet media query also sets:

```css
max-width: min(960px, calc(100vw - var(--sidebar-w)));
```

The `min()` caps content width to the space genuinely available after the sidebar at narrow viewports, while the original `max-width` takes over on wider screens where the overflow never occurs. Both properties always live together in the same `@media (min-width: 768px)` block — if you add a new view, include both.

Mobile bottom nav is handled by adding bottom padding: `padding-bottom: calc(var(--space-16) + env(safe-area-inset-bottom))`.

### 14.4 Heavy dependencies — always lazy

Three packages must never enter the initial bundle:
- **Leaflet**: imported dynamically inside `MemoryMap.vue`'s `onMounted`. `MemoryMap` is itself loaded via `defineAsyncComponent` in `MapView`.
- **chart.js**: statically imported in `MoodChart.vue`, but since `MoodChart` is only used by `MoodView` and `MoodView` is a lazy route, it stays out of the initial bundle automatically.
- **vue-draggable-plus**: same pattern as chart.js — in `ListContainer` → `ListsView` (lazy route).

Never import these at the top level of `main.js` or `App.vue`.

### 14.5 Empty states — invite, don't just inform

Every list view must render a meaningful empty state — never a blank screen — and the copy should read as an invitation in our voice ("come do this together"), not a status report ("no items found"). The actual shipped pattern, e.g. `MemoriesView.vue`:

```html
<div v-else class="memories-page__empty">
    <p>no memories yet — go make our first one together</p>
    <RouterLink to="/memories/new" class="btn btn--primary">add a memory</RouterLink>
    <RandomiserNudge text="don't know where to start? let the randomiser plan our first date" />
</div>
```

Two refinements that came out of user feedback during polish:
- The empty state doesn't just name the gap, it nudges toward the obvious next action — and, where it makes emotional sense, cross-links to the randomiser as a playful "don't know where to start?" suggestion (see 14.9 for why that link is a separate button, not copy-as-link).
- A populated list/grid *also* gets a quieter footer nudge ("go make more memories", "feeling spontaneous? spin the date randomiser") — so the invitation to keep using the app isn't only shown to people with nothing in it yet.

Style with `font-family: var(--font-body); color: var(--text-muted); font-size: var(--text-sm)`.

### 14.6 API error handling in views

Views use a consistent try/catch pattern. Errors are shown inline, never as alerts or thrown to the top level:

```js
const error = ref('')
const loading = ref(false)

async function load() {
    loading.value = true
    try {
        const data = await someService.get()
        items.value = data?.items ?? []
    } catch (e) {
        error.value = e.message || 'something went wrong'
    } finally {
        loading.value = false
    }
}
```

### 14.7 Unsplash attribution

When displaying Unsplash images, attribution is required. `MemoryDetailView` overlays an attribution element on the cover image. Any other view showing Unsplash images must do the same. The attribution format is: `"photo by [author] on Unsplash"` with links to the author URL and `https://unsplash.com`.

### 14.8 Entrance animations live on the base class, not in each view

Rather than wrapping a dozen views' lists/grids in `<Transition>` / `<TransitionGroup>` (more code, more places to get it wrong, and brittle against `vue-draggable-plus`'s direct DOM manipulation in `ListContainer`), the "arrives gently" effect is a plain CSS `@keyframes` placed directly on the **shared base classes** — `.card` in `main.css` and `.list-item` in `ListItem.vue`:

```css
.card { animation: card-enter var(--duration-tender) var(--ease-enter); }
@keyframes card-enter {
    from { opacity: 0; transform: translateY(10px) scale(0.985); }
    to   { opacity: 1; transform: translateY(0)     scale(1);    }
}
```

This works because of a browser truth, not a Vue feature: `animation` plays the moment an element is inserted into the DOM, and Vue reuses existing DOM nodes for stable `v-for` `:key`s — so the animation naturally fires only for *genuinely new* elements (first load, freshly-added rows), never on reorders or sibling re-renders. One CSS rule, and every card-based surface in the app (memory cards, date cards, mood entries, dashboard tiles, the randomiser idea card, settings sections) gets it for free, present and future. Respects `prefers-reduced-motion` via the existing global override.

**Important distinction for the report:** this is *not* the Vue `<Transition>` API. `<Transition>` *is* used elsewhere — page transitions in `App.vue`, `BaseModal`'s fade+scale, `BaseSelect`'s dropdown, the mobile "more" sheet in `AppNavbar`, the randomiser's spin/result swap — but card and list-item entrances are deliberately plain CSS keyframes on shared base classes. Both are legitimate "advanced animation" techniques; they're just different tools solving different problems (one-off transition between two states vs. a recurring "this just appeared" cue across many independent components).

### 14.9 Splitting romantic copy from the call-to-action — `RandomiserNudge`

A recurring tension in this app's voice is "warm and conversational" vs. "obviously clickable." An early pass folded both into one italic sentence-as-link, and a user testing it didn't realise it was a button. The fix wasn't to make the copy less warm — it was to give the *feeling* and the *action* their own visual homes:

```html
<p class="nudge__line">feeling spontaneous?</p>
<RouterLink to="/randomiser" class="nudge__btn">
    <Shuffle :size="16" /> spin the date randomiser
</RouterLink>
```

The sentence stays soft, italic, first-person-plural prose. The button is a separate pill element — bordered, carrying the same `Shuffle` icon already used for `/randomiser` in the nav (instant recognition), with a hover state that fills solid and lifts. `RandomiserNudge.vue` centralises this so every place that wants to gesture toward the randomiser (`MemoriesView`, `DatesView` — both empty and populated states) gets the same treatment, and any future tweak to copy, icon, or hover propagates everywhere at once.

### 14.10 Default-on capabilities keyed off existing props, not new booleans

`BaseInput`'s password show/hide toggle (`Eye`/`EyeOff` from `lucide-vue-next`) is implemented as automatic behaviour of `type="password"`, not a new `revealable` boolean prop. Internally it swaps the rendered `<input type>` between `password` and `text` via a local `revealed` ref + `effectiveType` computed, while the `type` prop passed in by the caller stays untouched. Every password field in the app — register, login, settings — gets the feature immediately and identically, with zero call-site changes and no risk of someone forgetting to opt in. This mirrors `BaseInput`'s existing `sanitize`/`rules` philosophy: behaviour keyed off semantic props that are already there, rather than a constantly-growing list of opt-in flags.