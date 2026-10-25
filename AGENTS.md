# Takawork contributor / agent guide

Read `README.md` and `docs/HERMES_HANDOFF.md` before changes.

## Product invariant
Takaloka is the UI/control plane. **Hermes owns real agent execution.** Do not implement simulated success as a substitute for integration, and do not infer a live API contract from `WorkerRuntime` (it is only the prototype's proposed boundary).

## Preserve the approved UI
- The office fills the viewport; chrome floats over it. Opening chat must not shrink/unmount the scene.
- Keep the warm original room, furniture and living visual ambiance.
- Keep character names AND activity summaries visible, including mobile.
- UI is neutral monochrome: black primary, gray hover/selection, thin borders. Clothing/room colors stay colored.
- Use the shared custom `Select` for all selectors, not native `<select>` menus. Preserve arrows, typeahead, Escape, Tab, disabled options and dialogs.
- Reuse radius tokens. Menu item radius derives from outer radius minus padding/border. Keep keyboard focus visible but subtle.
- Long responses belong in chat. Do not put private conversation content into bubbles/whiteboard.
- Do not add permanent dashboard headers, large avatars or marketing captions over the office.

## Engineering
- `kantor-sim.html` and `character-model.js` are required build inputs. Adaptation anchors in `apps/web/legacy-office.ts` are checked intentionally. Do not delete these as legacy clutter.
- Prefer tested domain/state changes. Add a failing regression before fixing behavior; test actual semantics rather than only source strings when practical.
- Preserve existing worker IDs, history and localStorage compatibility. Never erase user data to resolve a schema issue.
- Keep credentials on the backend. Do not commit `.env`, private keys, provider tokens, SSH credentials, server dumps or user transcripts.
- Never alter/restart an existing Hermes service, expose its ports or deploy over an existing dashboard without explicit owner authorization.
- If the environment has an existing Hermes profile, inspect through documented interfaces. Do not edit its SQLite DB directly or dump secret-bearing environment files.

## Verification
```bash
npm ci
npm test
npm run test:legacy
npm run build
```
Verify 320/768/1024/1440 layouts, short-height chat, menu keyboard/dialog placement and stable chrome under camera zoom. Use the available browser tools; browser checks cannot be replaced by source-string assertions. Respect reduced motion and visibility suspension. Report untested cases and bundle warnings honestly.

No live model execution or credit spend without the owner's approval. Establish deployment/version/credentials privately; never request secrets in a public issue.
