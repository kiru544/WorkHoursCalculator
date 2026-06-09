# Work Hours Calculator

A clean, responsive web tool for logging weekly work hours in 30-minute blocks and tallying regular vs. holiday time. Built with plain HTML, CSS, and JavaScript — no frameworks, no build step.

## Features

- **Weekly grid** — every day of the week split into 30-minute slots from `00:00` to `24:00`.
- **Click & drag selection** — paint over the slots you worked instead of clicking each one.
- **Holiday flagging** — click any day header to mark it as a holiday. Saturday and Sunday are flagged by default. Holiday hours are tallied separately from weekday hours.
- **Live totals** — weekday, holiday, and grand totals update as you select.
- **Detailed breakdown** — tick the checkbox to include a per-day list of exact time ranges in the saved output.
- **One-click save** — copies a formatted summary to your clipboard and shows it in an editable text box.
- **Responsive layouts:**
  - *Desktop* — full weekly table with a sticky day-header row.
  - *Mobile* — a compact single-day view with day tabs and a custom draggable scrollbar, so scrolling the slot list never gets mistaken for selecting hours.

## Getting Started

No dependencies or build tools required.

1. Clone or download this repository.
2. Open `index.html` in any modern browser.

```
.
├── index.html    # markup
├── styles.css    # styling and responsive layout
└── script.js     # interaction logic
```
or visit mine on github https://kiru544.github.io/WorkHoursCalculator/

## Usage

1. **Log hours** — click (or drag) across the slots for each day you worked. On mobile, pick a day from the tabs first, then tap or drag through its slots.
2. **Mark holidays** — click a day name (desktop) or the star button (mobile) to toggle holiday status. Weekends start flagged.
3. **Choose detail level** — leave the checkbox unticked for just the weekday and holiday totals, or tick it for a full per-day breakdown with time ranges.
4. **Save** — click *Save calculation*. The result is copied to your clipboard and displayed in a text box you can copy from or edit.

## Customization

Colors are defined as CSS variables at the top of `styles.css`, so the whole theme can be re-skinned in one place:

```css
:root {
  --bg: #f1ece1;        /* background */
  --ink: #14110d;       /* primary text / selected slots */
  --bonus: #9c3a1f;     /* holiday accent */
  --accent: #c47a3e;    /* highlights */
  /* ... */
}
```

Other quick tweaks:

- **Time granularity** — change `SLOTS_PER_DAY` in `script.js` (default `48` for 30-minute blocks).
- **Default holidays** — edit the initial set in `script.js`: `bonusDays = new Set(['Sat', 'Sun'])`.
- **Mobile breakpoint** — adjust the `@media (max-width: 720px)` query in `styles.css`.

## Browser Support

Works in all current versions of Chrome, Firefox, Safari, and Edge. Selection uses Pointer Events, and clipboard copying uses the async Clipboard API with a manual-select fallback for older or restricted contexts.
