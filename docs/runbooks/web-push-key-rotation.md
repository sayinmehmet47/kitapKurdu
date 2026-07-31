# Web Push (VAPID) Key Rotation

Runbook for rotating the Web Push VAPID keypair.

## Variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` | Backend (Render) | Public half of the VAPID keypair |
| `VAPID_PRIVATE_KEY` | Backend (Render) | Private half of the VAPID keypair; never expose it to the client |
| `VAPID_SUBJECT` | Backend (Render) | `mailto:` or HTTPS contact URL for the push service |
| `VITE_VAPID_PUBLIC_KEY` | Client (Vercel) | Public key compiled into the client bundle |

Web push is enabled on the backend only when `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` are all set. On the client, push
registration is skipped when `VITE_VAPID_PUBLIC_KEY` is absent.

## Generating a new keypair

Generate a keypair yourself; key values are never committed to the repository:

```
npx web-push generate-vapid-keys
```

Use the printed public and private keys, and set the subject to a `mailto:` or
HTTPS URL you control.

## Setup order

1. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` in Render
   (backend) and redeploy the backend.
2. Set `VITE_VAPID_PUBLIC_KEY` in Vercel (frontend) and redeploy the client.

The client only needs the public key; it never needs the private key.

## Redeploy sequence

1. Deploy the backend first so the subscription endpoint accepts and persists
   subscriptions with the new key.
2. Deploy the client afterwards so browsers register with the new key.

## Old subscriptions

Subscriptions created under the previous key carry the old key. The client only
compares an existing subscription's stored `applicationServerKey` byte-for-byte
against the configured key when the browser exposes those bytes, and
re-subscribes when they differ. This happens the next time an explicit
notification opt-in flow invokes `regSw` — not automatically on every page
visit. Until a user opts in again, old subscriptions may not receive
notifications.

Browsers that do not expose the existing subscription's
`applicationServerKey` (for example older Safari releases) are treated as
unknown and are reused as-is. Those users may need to manually unsubscribe and
re-enable notifications after a rotation so their subscription is re-created
with the new key.

## Rolling back (graceful disable)

To disable web push without code changes:

- Backend: unset `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` or `VAPID_SUBJECT` and
  redeploy. The backend logs a single generic warning, skips subscription
  queries, and keeps serving normally.
- Client: unset `VITE_VAPID_PUBLIC_KEY` and redeploy. `regSw` returns before
  requesting notification permission.

## Verification

- Subscribe flow: an authenticated `POST /api/subscription` with a valid HTTPS
  endpoint returns `201` and persists the subscription.
- Backend graceful disable: unset the VAPID variables and redeploy, then verify
  the app still starts and serves normally via `GET /healthz` and that a book
  upload still succeeds (push sending is skipped). The backend writes a single
  generic warning to its logs, but production console visibility of those logs
  is not guaranteed — rely on the health/upload behavior above instead.

## Note on git history

The previous VAPID key pair was committed to the repository and remains in the
public git history. Git history is not cleansed by this rotation, so the
historical key material must be considered compromised and must be rotated
externally (for example via this runbook) before it is reused anywhere.
