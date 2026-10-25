# Hermes handoff — continue here

## What the owner wants

Takaloka should remain a clean, full-screen visual office. Hermes performs the real work; the web UI displays worker identity, conversation, progress, permissions and task status. The current local demo is only a prototype.

The chosen task UX is **from chat**, not a separate mandatory task form:
1. Ordinary messages go to the worker's Hermes conversation.
2. “Jadikan tugas” (Make a task) explicitly tracks selected work.
3. A tracked job appears on the room whiteboard with its assignee/status and links back to its originating conversation/result.
4. Do not automatically re-execute an already submitted prompt when turning it into a tracked task. Link existing work where supported or confirm new work. Prevent duplicate creation.

This UI action and native Hermes task integration have **not** been implemented. Existing board rows are demo run summaries, not a complete durable task model.

## Current implementation

- Frontend: React 19, TypeScript, Vite, Zustand, Zod.
- Worker/avatar/conversation/run are separate identities. Browser state persists locally and is schema-validated.
- Three rooms, six desks each; unplaced workers are not lost or blocked from chat.
- `projectOffice()` projects only room worker metadata, busy status and bounded run summaries into a same-origin iframe. Protocol messages are schema-validated and window source/origin checked.
- The board texture updates from run state without recreating the room; its accessible text excludes private chat content.
- `demoRuntime` uses a local timer and canned labelled text. It must remain visibly distinct from a live connection and must never silently substitute for failed Hermes requests.
- No backend, real auth, server persistence, provider keys or real tool permissions currently exist here.

## Upstream source research (not a live integration test)

Official repository examined at revision `4ea8d23cc9f527332ccb1d55359b27741b6ea51b`. The deployed Hermes may differ; discover its version/capabilities first.

### Available integration choices

1. **HTTP API + native Kanban — recommended starting direction.** Hermes has an API Server with run creation/status/SSE, session continuation and cooperative stopping. Native Kanban already supplies durable tasks, profile assignment, comments, review/block/done lifecycle and dispatch.
2. **ACP / canonical gateway attach.** Appropriate if attaching an existing CLI/Desktop-owned conversation is required. The API-owned session interface must not be used to seize another surface's session.
3. **Python embedding.** More coupling to runtime internals; avoid as the default when public APIs cover the use case.

### Verified source surfaces

- `/v1/capabilities` advertises supported routes/features. Confirm actual keys on the deployed build, not documentation wording alone.
- `POST /v1/runs`: agent work. Use documented idempotency semantics and persist the remote run identity before retries.
- `GET /v1/runs/{id}`: reconciliation; `/events`: SSE progress; `/stop`: cooperative cancellation. A stop acknowledgement is `stopping`, not proof of termination.
- Approval and clarification controls use current request identity/generation on canonical gateways. Do not auto-approve or blindly resend stale controls.
- A session can have an `unknown` execution outcome after restart. This must not be treated as success, terminal failure or permission to duplicate work automatically.
- **Worker → Hermes profile**, if workers are meant to have distinct persistent memories/configuration/tools. Separate sessions alone do not isolate assistant memory. Profiles are not OS sandboxes.
- Native Kanban statuses in the examined source: `triage | todo | ready | running | blocked | review | done | archived`. A chat run completing is not necessarily a tracked task completing.
- Kanban has CLI/dashboard/model-tool surfaces. The exact supported remote Kanban control interface needs inspection on the deployed version. Do not invent `/v1/kanban` endpoints or treat scheduled `/api/jobs` as the durable collaboration board.

### Proposed architecture

```text
Browser UI ↔ authenticated application backend ↔ Hermes gateway/profile
                       ↕
                persistent ID/event mappings
                       ↕
                native Hermes Kanban
```

Store keys only on the backend; restrict the configured Hermes destination and authorized workspace/tool access. Do not accept arbitrary browser-supplied endpoint URLs or shell commands. Do not read/write Hermes SQLite tables directly.

Map stable worker UUIDs to profiles, conversation UUIDs to API-owned sessions, submitted messages to idempotency/run IDs and tracked tasks to native Kanban IDs. Persist mappings beyond a browser tab. Reconnect by querying status/history, not by submitting the same work under a new ID. Profile/system-prompt changes need an explicit new-session policy rather than changing cached instructions on every turn.

## Safe first live milestone

1. Owner supplies private connection configuration outside the repository. Inspect version, authenticated capabilities and service state read-only; do not overwrite an existing dashboard.
2. Connect one dedicated worker profile with limited tools/workspace, one conversation, and one harmless owner-approved message.
3. Display actual user-facing output/tool progress. Keep private reasoning and credentials out of ordinary messages/bubbles/board.
4. Verify multi-turn continuity, reload/reconnect without duplicates, honest disconnected state, pending approval, and stop-to-terminal transition.
5. Verify the deployed native Kanban contract, then implement “Jadikan tugas” and replace demo board projection with task state. Preserve source message/run traceability.

## Pinned upstream references

- [API Server](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/website/docs/user-guide/features/api-server.md)
- [API route/capability implementation](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/gateway/platforms/api_server.py)
- [Runs implementation](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/gateway/platforms/api_server_runs.py)
- [Profiles](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/website/docs/user-guide/profiles.md)
- [Kanban](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/website/docs/user-guide/features/kanban.md)
- [ACP](https://github.com/NousResearch/hermes-agent/blob/4ea8d23cc9f527332ccb1d55359b27741b6ea51b/website/docs/user-guide/features/acp.md)

Do not publish connection credentials or infer the existing deployment supports source-HEAD endpoints. Version compatibility and live behavior remain unverified.
