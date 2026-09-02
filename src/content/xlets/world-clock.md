---
uuid: "cinnamon-world-clock-desklet@curbsoftware"
name: "World Clock"
kind: "desklet"
version: "1.1.0"
tagline: "A grid of clocks, one per timezone, always visible on the desktop."
summary: "A Cinnamon desklet showing a grid of named clocks, each on its own timezone. Click to add one, right-click to edit, glance to know."
order: 110
repo: "https://github.com/RobertAlexanderH/cinnamon-world-clock-desklet"
spicesUrl: null
derivedFrom:
  name: "TimeAndDate@nightflame"
  url: "https://cinnamon-spices.linuxmint.com/desklets/view/9"
license: "GPL-2.0-or-later"
accentHue: 240
features:
  - "Auto near-square grid, or fixed rows and columns"
  - "Searchable timezones: IANA zones plus Local"
  - "Shared time and date formats; tiles scale text down to fit"
  - "Optional confirmation before removing a named clock"
  - "The last clock cannot be removed"
  - "Layout, spacing, and size from Cinnamon Desklet settings"
shot: ../../assets/xlets/world-clock/shot.webp
configShot: ../../assets/xlets/world-clock/config.webp
desk: ../../assets/xlets/world-clock/desk.webp
---

Good world clock apps are hard to find. On any OS. The good ones live on your phone, or they bury the feature under menus, or they insist on taking over your system timezone.

> A glance at my desktop to see what time it is where my colleagues and partners are, all over the world, without touching my own clock.

That is what this desklet is. One grid, one tile per timezone, always visible. Clocks set to your own system timezone get an outline, so local and far away are told apart before you finish reading the time.

Add a clock with the trailing + tile and name it after whatever it means to you: a colleague, an office, family. Right-click a tile to edit or remove it. The last clock stays put, and once the setup is final you can switch editing off entirely and leave a read-only grid.

It is a desklet, not the panel World Clock Calendar applet, so it runs happily beside that one and shares nothing with it. World Clock grew out of TimeAndDate@nightflame, and the credit sits in the meta rail where it belongs.
