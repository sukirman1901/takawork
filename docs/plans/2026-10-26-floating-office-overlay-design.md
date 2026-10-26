# Floating office overlay refresh

## Goal

Make Takawork's existing control plane feel as clean and orderly as the supplied office UI references without replacing the living 3D office or its 3D avatars. Reuse current features and neutral black/gray UI palette; do not add meeting, microphone, event or presence controls that have no implementation.

## Layout and components

- Keep the office iframe fixed at full viewport size, including while chat or a menu is open. Preserve its warm room, furniture, camera movement, character names and activity summaries on every screen size.
- Put a compact location/room control at the top left; make the room selector continue to use the shared custom `Select`. Group camera views and reset in a small floating vertical rail at the left, with clear pressed states and accessible names. Keep lighting and ambiance controls reachable without dominating the scene.
- Put the existing team/directory affordance in a compact floating position at the right/bottom right. The existing directory remains the source for worker navigation; do not create a second inconsistent worker list.
- Preserve the existing worker chat overlay, activity summary, add-worker dialog and demo/disconnected messaging. Restyle and position them to avoid overlap with chrome, especially at short heights and while the directory/chat is open. Do not duplicate or disclose private conversation text in the scene.
- Use thin borders, restrained shadows, monochrome controls, existing radius tokens and consistent spacing. Scene and clothing retain their own colors.

## Interaction and responsive behavior

- Existing actions continue to call the same camera, room, lighting, motion, worker and directory state handlers. Reorganize presentation, not state identity, persistence keys, or runtime contracts.
- On desktop, chrome floats over the scene with left camera controls and right team access. On smaller screens, consolidate secondary controls rather than allowing rails, room selector, activity and chat to overlap. Keyboard navigation, visible focus, Escape behavior, custom select typeahead and dialog focus restoration remain intact.
- Respect reduced motion and visibility suspension. Decorative camera/ambiance controls must not indicate actual agent execution. Hermes remains the owner of real work; this UI remains an explicitly labelled local demo until integrated.

## Verification

- Add or adjust semantic UI regression coverage for changed controls and retain all existing tests, then run `npm test`, `npm run test:legacy` and `npm run build`.
- Visually inspect real browser states at 320, 768, 1024 and 1440 px, including short-height chat, open menu/dialog, camera zoom, names/activity visibility and scene persistence behind chat. Check focus, selection and reduced-motion states; report any untested cases.

## Non-goals

No scene/3D avatar replacement, no new agent execution, no live Hermes or credit-spending calls, no credential handling, no invented meeting controls or change to existing user data.
