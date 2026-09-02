---
uuid: "cinnamon-color-timer-clock-desklet@curbsoftware"
name: "Color Timer Clock"
kind: "desklet"
version: "1.7.0"
tagline: "Clock, timer, and chronometer cards whose colors follow a schedule."
summary: "Three cards whose backgrounds ramp between time and color stops: the clock by time of day, the timer by time remaining, the chronometer by time elapsed."
order: 120
repo: "https://github.com/RobertAlexanderH/cinnamon-color-timer-clock-desklet"
spicesUrl: null
derivedFrom: null
license: "GPL-2.0-or-later"
accentHue: 75
features:
  - "Up to three responsive cards; narrow widths wrap, nothing hides"
  - "Per-card color schedules, smooth or stepped ramps"
  - "Clock card with an optional IANA timezone"
  - "Timer with play, pause, reset, and 60 second nudge buttons"
  - "Optional desktop notifications for timer finish and schedule stops"
  - "Chronometer with pause, resume, and optional hundredths"
  - "Text and border colors adapt to the card background for contrast"
shot: ../../assets/xlets/color-timer-clock/shot.webp
configShot: ../../assets/xlets/color-timer-clock/config.webp
desk: ../../assets/xlets/color-timer-clock/desk.webp
---

The color is not decoration. It is the signal. Each card has a job.

> One glance tells me the state of things. That is the whole idea.

The clock shows when AI providers run their low-traffic discounts: set the stops to match the window and you know when it is cheap to run. The timer counts down to credit resets, so you know when the budget comes back. The chronometer runs sprints: green for the first half hour, amber sliding to red over the next hour and a half, blue once two hours are up. Blue means take a break.

A schedule is just rows of times and colors. Blend smoothly between stops, or hold each color and jump at the next one. The clock wraps over midnight so late shifts are covered, a running timer survives a restart, and text picks its own shade so every card stays readable.

### Under the hood

- Colors blend piecewise-linearly in RGB, so a red to blue ramp passes through purple
- Timer and chronometer schedules hold the last stop's color beyond the final row
- Every card control has keyboard focus, a pressed state, an accessible name, and a tooltip
