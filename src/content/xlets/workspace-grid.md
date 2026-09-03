---
uuid: "cinnamon-workspace-grid-desklet@curbsoftware"
name: "Workspace Grid"
kind: "desklet"
version: "1.3.1"
tagline: "The workspace map, pinned to your desktop."
summary: "One clickable tile per workspace, as plain names or live desktop previews, with the active workspace outlined."
order: 130
repo: "https://github.com/CurbSoftware/cinnamon-workspace-grid-desklet"
spicesUrl: null
derivedFrom: null
license: "GPL-2.0-or-later"
accentHue: 152
features:
  - "One clickable tile per workspace"
  - "Name tiles or desktop previews per monitor"
  - "Live window, focus, monitor, and name updates"
  - "Auto near-square or fixed rows by columns"
  - "Fixed layouts grow rows; no workspace hides"
  - "Optional add tile with per-tile rename and remove"
  - "Filtered, throttled scroll switching"
  - "Keyboard focus, tooltips, and accessible names"
shot: ../../assets/xlets/workspace-grid/shot.webp
configShot: ../../assets/xlets/workspace-grid/config.webp
desk: ../../assets/xlets/workspace-grid/desk.webp
---

Keyboard shortcuts switch workspaces blind. You press, you land, you look around to work out where you are. Workspace Grid puts the map where you already look: one tile per workspace, named, clickable, and the tile you are on carries the highlight.

> Names or previews. Click to switch. That is the whole interface.

Tiles come in two flavors. Name tiles show the word, big and mono. Desktop previews shrink every connected monitor into the tile with its visible windows and app icons, and they stay honest: window, focus, monitor, and name changes all land live, no reload needed.

Layout runs auto, which lands near a square, or fixed rows by columns. Fixed layouts would rather grow a row than hide a workspace, so nothing falls off the edge. The wheel can switch too, by row or by column, filtered and throttled so one flick is one switch instead of five.

Editing happens right on the grid. An optional trailing + tile adds a workspace, the per-tile menu renames or removes one, and a named workspace asks for confirmation before it goes. Tiles take keyboard focus, carry tooltips, and expose accessible names to screen readers.
