---
uuid: "cinnamon-workspace-names-applet@curbsoftware"
name: "In Panel Workspace Name"
kind: "applet"
version: "1.2.0"
tagline: "Every workspace, living on the panel."
summary: "A named button per workspace right on the Cinnamon panel. Click to switch; the menu adds, renames, and removes."
order: 140
repo: "https://github.com/CurbSoftware/cinnamon-workspace-names-applet"
spicesUrl: null
derivedFrom:
  name: "workspace-name@willurd"
  url: "https://github.com/linuxmint/cinnamon-spices-applets/tree/master/workspace-name@willurd"
license: "GPL-2.0-or-later"
accentHue: 300
features:
  - "One visible button per workspace"
  - "Name, number, or number and name labels"
  - "Horizontal and vertical panel layouts"
  - "Density-aware bounds, compact vertical prefixes"
  - "Full-name tooltips and accessible names"
  - "Optional trailing add button"
  - "Off, normal, or reversed scroll switching"
  - "Expo, add, rename, and remove in the menu"
shot: ../../assets/xlets/workspace-names/shot.webp
configShot: ../../assets/xlets/workspace-names/config.webp
desk: ../../assets/xlets/workspace-names/desk.webp
---

Workspaces usually live behind a keyboard shortcut and a guess. In Panel Workspace Name moves the whole map into the panel itself: one button per workspace, always visible, always current. Click one and you are there. The active button takes the panel theme's outlined state, so the map never lies about where you are.

> The panel becomes the workspace map.

Buttons label themselves three ways: name only, number only, or number and name. A maximum width keeps long names polite, tooltips carry the full text, and every button exposes an accessible name.

It settles into whatever panel you give it. Horizontal or vertical, dense or wide: label bounds adapt to the panel's density, and vertical panels get compact name prefixes. The wheel can switch workspaces, forward or reversed, or stay out of the way entirely.

The applet menu keeps the plumbing: Expo, add, rename, remove. Everything updates live as workspaces are added, removed, reordered, renamed, or switched. It grew out of workspace-name@willurd, and that lineage stays credited in the meta rail above.
