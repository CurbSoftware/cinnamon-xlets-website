---
uuid: "cinnamon-panel-profiles-applet@curbsoftware"
name: "Panel Profiles"
kind: "applet"
version: "1.4.0"
tagline: "Save a panel layout by name. Restore it exactly."
summary: "Saves panels, monitor placement, and every applet setting into named profiles, then restores them on click with automatic rollback."
order: 150
repo: "https://github.com/CurbSoftware/cinnamon-panel-profiles-applet"
spicesUrl: null
derivedFrom: null
license: "GPL-2.0-or-later"
accentHue: 25
features:
  - "Panels and applets in every profile; desklets optional"
  - "Exact restore of what the profile includes"
  - "Applies only on click; boot stays Cinnamon's own"
  - "Modified detection with an Update action"
  - "Rename, duplicate, and delete in settings"
  - "Transactional loads with automatic rollback"
  - "Restart Cinnamon and Configure in the menu"
shot: ../../assets/xlets/panel-profiles/shot.webp
configShot: ../../assets/xlets/panel-profiles/config.webp
---

Cinnamon usually remembers your panels. It forgets in one specific place: a multi-head VM where the second virtual display appears after Cinnamon has already started. You reboot, Cinnamon comes up with one monitor, and by the time the second head arrives the second panel and its applets are gone. You rebuild it by hand. Every single reboot.

> Set the panels up once, save the layout, restore it with one click.

Panel Profiles fixes that, and it doubles as a general layout manager. Keep a Minimal profile, a Development profile, a Presentation profile, and flip between them on purpose.

The short version of using it: save, break it, restore.

1. Arrange your panels and applets the way you want them.
2. Choose Save current layout from the menu, name it, and tick Include desklets if the layout should carry them too.
3. Change whatever you like: drag an applet, resize a panel, add one.
4. Click the profile. It comes back exactly.

Nothing restores at boot. Cinnamon starts with whatever it last saved, and profiles apply only when you click them. Click one that expects more displays than are connected and the applet waits for them, up to your timeout, before restoring.

Every load is transactional. A rollback snapshot is written first, the profile is applied, the result is verified against what it should be, and a failed load undoes itself back to the snapshot. The menu also tells you when the live layout has drifted from the active profile, with an Update action to re-save it.

Profiles are plain JSON under `~/.config/cinnamon-panel-profiles/`, written mode 0600 so only your user can read them. Treat them as private: a profile carries the raw configuration of every applet it references, and applet configs can hold account names or tokens.
