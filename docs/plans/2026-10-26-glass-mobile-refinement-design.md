# Glass overlay and mobile refinement

Reading this as: a living office control plane for Takawork users, in restrained neutral translucent chrome; ENERGY 1 / RHYTHM 1 / MOTION 1.

## Direction

The user's example uses quiet floating glass over a colorful room. Apply subtle neutral translucency, a limited backdrop blur and fine borders only to persistent room controls (room picker, header actions, clock, camera rail, activity and team dock). Opaque chat, menus and dialogs preserve readable text. Contrast and keyboard focus take priority over translucency. Avoid heavy glows and saturated blue/orange copied from the reference; those colors belong to the rendered room and avatars.

## Mobile structure

At phone widths, retain the compact room picker and add/light actions at the top, put camera and motion in a single 44px-target horizontal rail below them, and keep team access in a compact dock at the bottom. Collapse activity to a small summary that can still expand. Allow both bottom controls to coexist at 320px and short heights without covering one another; chat remains a full-screen overlay that leaves the office mounted. Keep labels and activity summaries attached to visible characters and preserve custom selectors and dialogue focus.

## Scene framing

The existing perspective camera keeps fixed positions and vertical field of view when only the aspect ratio changes, cropping desks on narrow screens. Adapt the overview preset when the iframe viewport becomes narrow using a bounded camera distance, without replacing meshes or resetting user orbit/pan on each resize. Preserve the selected preset when switching room or resetting camera; no scene simulation or worker state changes. The overview should show more of the office while keeping characters and labels legible rather than trying to show every desk at all phone dimensions.

## Verification

Write regressions before modifications, run focused and complete tests, legacy suite and production build. Use live browser state plus screenshots at 320/390/768/1024/1440 widths, including short-height chat, menu and dialog, camera reset and scene persistence. Browser screenshots must verify any visual claim; report remaining legibility/coverage gaps and existing build warnings honestly.
