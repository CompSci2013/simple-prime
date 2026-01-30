# Proposal: Replace GoldenLayout with Dockview

**To:** OT TEam
**From:** Keith Collins
**Date:** January 2025

---


I wanted to run something by you that I think could solve a few headaches we've been dealing with.

## The Problem

GoldenLayout is blocking us. Here's where we're at:

- **We're stuck on Angular 14.** GoldenLayout hasn't been properly maintained, and its Angular integration is broken on anything newer. Every time we look at upgrading, this is the blocker.
- **The library is basically abandoned.** Last meaningful update was years ago. We're accumulating workarounds instead of getting fixes upstream.

We've been living with this, but it's only going to get worse.

## What I'm Proposing

Replace GoldenLayout with **Dockview** for our panel layout and pop-out functionality.

I've already done a proof-of-concept on the Discover3 page. Here's what it looks like:

### Basic Layout
![Discover3 with Dockview](discover3-picker-collapsed.png)

The charts render side-by-side in dockview panels. Users can drag to resize, rearrange, or tab panels together - same capabilities as GoldenLayout, but with a library that's actually maintained.

### With Highlights Active
![Discover3 with Highlights](discover3-highlights-picker-collapsed.png)

The highlight feature (showing a subset of data visually emphasized) works correctly through dockview. All the URL-first state management flows through properly.

### Pop-out Windows
![Statistics Panel Popped Out](discover3-popout-composite.png)

Pop-outs work. When you pop a panel out, the main window shows a placeholder, and the pop-out gets the data via BroadcastChannel - exactly like before, but using our own PopOutManagerService instead of GoldenLayout's buggy implementation.

### Individual Chart Pop-out (from Dockview)
![Dockview Chart Popped Out](discover3-dockview-popout-composite.png)

You can pop out individual charts from within the dockview container. Each gets a unique panel ID so there's no collision between "the manufacturer chart in dockview" and "the manufacturer chart in the statistics panel."

## Why Dockview?

- **Actively maintained.** Regular releases, responsive maintainer.
- **Modern Angular support.** Works with current Angular versions. No more upgrade blocker.
- **Vanilla JS core.** We use `dockview-core` directly, not a framework-specific wrapper. This means we're not at the mercy of someone maintaining an Angular binding.
- **Similar API concepts.** Panels, groups, drag-drop, serialization - the mental model is close enough to GoldenLayout that the migration path isn't crazy.

## What This Enables

Once GoldenLayout is out:

1. **Angular upgrade.** We can finally move past Angular 14. That unblocks a lot of other improvements.
2. **Cleaner pop-out code.** The proposed custom PopOutManagerService handles cross-window communication better than GoldenLayout did. With dockview, we just disable its built-in popout (`disableFloatingGroups: true`) and use this proven approach.
3. **Better data visibility.** The side-by-side chart layout with highlights gives users a cleaner view of their data subsets.

## Level of Effort

This is not a quick project. I'm estimating **multiple weeks** to do it right:

- **Phase 1:** Create Data Domain pages for new phenomena (done as POC)
- **Phase 2:** Migrate existing Data Domins
- **Phase 3:** Migrate any other GoldenLayout usages
- **Phase 4:** Remove GoldenLayout dependency entirely
- **Phase 5:** Angular upgrade

I'd want to do this incrementally - one page at a time - so we're not doing a big migration.

## What I Need

- Sign-off to proceed with the phased migration
- Some runway in the planning to make progress on this alongside feature work

Happy to walk through the POC or answer questions. Let me know what you think.

---

**Attachments:**
- Screenshots showing the POC in action
- `service-design.md` - Technical architecture doc if you want the deep dive
