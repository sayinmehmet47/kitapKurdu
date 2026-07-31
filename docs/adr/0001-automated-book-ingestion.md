# ADR-0001: Automated book ingestion boundaries and architecture

- Date: 2026-07-31
- Status: Accepted
- Approval: Operator accepted on 2026-07-31
- Decision owners: Operator and maintainers
- Policy: [Book ingestion sources policy](../policies/book-ingestion-sources.md)
- Current architecture: [Repository Architecture](../architecture.md)
- Repository instructions: [AGENTS.md](../../AGENTS.md)
- Epic: [#345](https://github.com/sayinmehmet47/kitapKurdu/issues/345)
- Child issue: [#347](https://github.com/sayinmehmet47/kitapKurdu/issues/347)
- Dependency: [#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344)

## Context

The proposed ingestion work belongs to epic [#345](https://github.com/sayinmehmet47/kitapKurdu/issues/345), with this policy and architecture decision in child issue [#347](https://github.com/sayinmehmet47/kitapKurdu/issues/347) and the data-model dependency in [#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344). The [current architecture document](../architecture.md) describes the system that exists today, not this proposal.

The current `Books` model lacks the fields needed for a safe ingestion workflow:
ISBN, source identity, lifecycle status, deterministic deduplication keys, and
an audit trail. The existing in-process Render cron is also unreliable when the
free service is asleep. Scheduling discovery inside the web process would make
availability, retries, and evidence dependent on a sleeping application
instance.

The current `scrapper-books` repository is a GUI/macOS/Puppeteer tool with
untrusted-source downloader behavior. It is not an approved catalog adapter and
must not be integrated as-is. The collector needs a substantial refactor before
it can participate in ingestion.

This ADR is paired with the [book ingestion sources policy](../policies/book-ingestion-sources.md),
which defines allowlisted providers, evidence, moderation, links, and the
external-link-only boundary. Both documents are accepted as the governing
boundaries for the planned work.

## Decision summary

Use a scheduled, untrusted collector for discovery and a backend-owned,
moderated workflow for admission and publication. The proposed architecture is:

```text
[Daily GitHub Actions schedule, UTC]
                    |
                    v
[Refactored `scrapper-books` collector]
  HTTP catalog adapters; structured JSON; metadata and evidence only
                    |
                    v
[Approved catalog API]
                    |
                    v
[Authenticated internal kitapKurdu ingestion endpoint]
                    |
                    v
[Validation + rights evidence]
                    |
                    v
[Atomic deduplication + daily quota]
                    |
                    v
[`pending-review`]
                    |
                    v
[Admin decision: approved or rejected]
                    |
                    v
[Books publication]
```

The scraper repository is retained, but it is substantially refactored to use
HTTP catalog adapters and structured JSON. The refactor removes Puppeteer,
Brave, stealth behavior, local JSON deduplication, and file downloads. The
backend remains the source of truth and treats every collector field as
untrusted input requiring schema, source, rights-evidence, and moderation
validation.

Open Library is the first adapter, subject to the constraints in the [source
policy](../policies/book-ingestion-sources.md): official metadata/search APIs,
identified requests, caching, an initial conservative limit of no more than one
request per second, no HTML scraping or bulk API harvesting, stable OL/IA IDs,
`ebook_access: public`, and `public_scan_b: true`. Borrow-only and CDL items are
denied, and only canonical OL or `archive.org/details/<id>` landing links are
retained. Project Gutenberg is a later English public-domain adapter using its
official feeds, catalogs, and robot rules. This ADR is accepted, but no live
crawler may run before the relevant adapter gate is approved.

## Trust boundary and conceptual API

The internal ingestion endpoint is a conceptual boundary for later work; this
ADR does not implement it. The contract must include:

- HTTPS transport and server-side authentication.
- The server-only environment-variable name `INGESTION_API_KEY`; this document
  contains no key value. The key must never be exposed to Vite or any client
  bundle.
- A strict body schema, field validation, content-type checks, and request-size
  limits.
- A collector timestamp, unique request ID, freshness checks, and replay
  protection.
- Provider and host allowlists enforced by the backend, not by collector claims.
- Endpoint and provider rate limits, bounded retries, and backoff.
- Structured logs and audit events that redact credentials, authorization
  headers, tokens, and other sensitive values.

The endpoint accepts candidate metadata and evidence; it does not fetch a URL
provided in the request. A successful request means only that an untrusted
candidate was accepted for backend validation, not that it is rights-cleared or
published.

## Candidate, status, and audit model

The conceptual candidate record contains provider and native IDs, normalized
metadata, canonical link data, observed license/access signals, jurisdiction,
terms/policy URL and observation time, collector version, deduplication keys,
current status, and state timestamps. The audit record is append-only and
records the event, decision or reason, actor/role, request ID where applicable,
and timestamp. Rejected and duplicate candidates are retained as decisions,
not silently discarded.

The workflow is:

```text
submitted -> validating -> duplicate
                      \-> pending-review -> approved -> published
                                         \-> rejected
```

Publication is a separate, idempotent operation. It maps approved metadata into
`Books` only after the fields and indexes from [#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344)
exist. A takedown or later rights concern can move a published entry to an
unpublished/blocked state without deleting its audit history.

### Backend-owned deterministic deduplication

The backend, not the collector, owns deduplication. The keys are evaluated in
this order of trust and availability:

- A required normalized `provider + native ID` key. A candidate without a
  stable provider-native identity cannot pass admission.
- A normalized ISBN-13 key when an ISBN is available.
- A hash of a normalized canonical URL, without fetching that URL.
- A content SHA-256 only if a future, separately accepted mirroring ADR permits
  fetching content. It is not available in this external-link-only MVP.
- Normalized title + authors + language as a potential-duplicate review signal
  only. It is not a deterministic identity and must not reject or merge by
  itself.

Database unique constraints and an atomic upsert enforce the authoritative keys.
MongoDB `E11000` duplicate-key results are classified as duplicate decisions,
not generic failures. Retries and replayed requests must be idempotent and must
not create another candidate or consume another quota slot.

### Daily quota

The quota is exactly the policy limit: at most **10 newly accepted unique
`pending-review` candidates per UTC day**. Duplicate and rejected candidates are
audited but do not consume the pending-review admission/publication slots. The
ceiling is not a promise of exactly 10 and never permits auto-publication. The
atomic quota decision belongs to the backend so concurrent requests cannot
exceed it.

## MVP link and file boundary

The MVP stores metadata and a canonical external landing link only. Links are
regenerated from native IDs rather than copied from arbitrary collector input,
and the backend never fetches user- or provider-supplied URLs. Covers may be
linked only when the provider's policy permits that link and use.

There is no backend book-file fetch, Cloudinary copy, malware scanning, or
quarantine in this ADR. A future mirror would require a new accepted ADR with
explicit rights and secure fetch, redirect, DNS, storage, scanning, retention,
and takedown controls.

## Threat model

| Threat | Controls | Residual risk |
| --- | --- | --- |
| Source rights ambiguity | Allowlisted categories; jurisdiction and observed policy evidence; unknown rights rejected or held; manual review; no auto-publication. | Evidence or a reviewer can still be wrong, and rights vary across jurisdictions and time. |
| Malicious payload or schema | Strict schema and types; size/content-type limits; untrusted-input validation; no execution of submitted fields; isolated tests. | Parser or validation defects may admit unexpected data. |
| SSRF, DNS rebinding, or redirects | Not reachable in the MVP because the backend performs no URL fetch; any future fetch must use URL/host allowlists, safe DNS/IP checks, redirect limits, egress controls, timeouts, and revalidation. | A future mirroring implementation could reintroduce network risk if those controls are incomplete. |
| Oversized requests | Body and field size limits, rate limiting, bounded retries, and request metrics. | Distributed abuse or provider-side limits can still cause resource pressure. |
| Duplicate races or replay | Backend-owned normalized keys; database unique constraints; atomic upsert/quota operations; timestamps, request IDs, replay checks; `E11000` classification. | Operational recovery or a database outage may require reconciliation. |
| Credential leakage | Server-only `INGESTION_API_KEY` name; never expose secrets to Vite/client; redact headers/tokens from logs and audit fields; least-privilege access. | Misconfiguration outside the application or an unredacted operational tool may still leak a credential. |
| Catalog poisoning or metadata spoofing | Provider/host allowlists; native-ID validation; source evidence snapshots; cross-field validation; manual review; backend source of truth. | An approved catalog can contain inaccurate, compromised, or disputed metadata. |
| Dependency or supply-chain compromise | Minimal collector dependencies; review and update process; fixture-only tests; least-privilege CI/runtime permissions; observable versioned collectors. | A compromised dependency or upstream build can still produce malicious input. |
| Provider outage or rate limit | Official APIs/feeds; identified requests; caching; conservative rates; bounded backoff; pause-on-policy/error signals; no dependency on the web process staying awake. | Discovery can be delayed and provider availability is outside kitapKurdu's control. |
| Link rot or takedown | Store native IDs and regenerate canonical links; provider-policy review; report/takedown workflow; immediate unpublish capability; retained audit. | An external link can change or disappear between reviews. |
| Accidental auto-publication | Explicit status machine; separate idempotent publication operation; admin decision required; collector has no publish path; quota and state-transition tests. | A future code or operational mistake could bypass a control, so monitoring and review remain necessary. |

## Testing and observability expectations

Later implementation children must provide:

- Fixture-only adapter tests with no production or external calls.
- In-memory MongoDB integration tests covering concurrent duplicates and
  concurrent daily-quota admission.
- Contract tests for the collector payload and internal endpoint.
- Admin E2E tests using a mocked API and deterministic candidate fixtures.
- Counters and job audits for submissions, validation outcomes, duplicates,
  quota decisions, moderation, publication, errors, retries, and takedowns,
  without credentials or other sensitive values.

Observability must make provider, adapter version, status, request/job ID, and
reason visible without logging authentication material or book-file contents.

## Consequences

### Advantages

- Rights decisions are explicit, jurisdiction-aware, and reviewable.
- The web service is not the scheduler, so Render sleep/cold-start behavior does
  not silently erase daily collection work.
- Backend-owned identity, quota, and publication reduce duplicate and replay
  risk.
- External links avoid storing untrusted book files and reduce free-tier,
  malware, takedown, and storage exposure.
- Provider-specific rules are visible and can be paused without weakening the
  general moderation boundary.

### Tradeoffs

- Manual review limits throughput and creates an administrative workload.
- External links can rot, vary by country, or become unavailable without a
  local fallback.
- The first release cannot offer offline reading, local file scanning, or a
  controlled mirror.
- More schema, indexes, endpoint, audit, and moderation work is required before
  the existing `Books` publication path can be used.
- Provider policy changes and regional rights differences require ongoing review;
  this architecture makes no legal guarantee.

## Rejected alternatives

- **Integrate the current scraper as-is:** Its GUI/macOS/Puppeteer, stealth, and
  untrusted downloader behavior do not provide a controlled server-side trust
  boundary.
- **Backend in-process cron:** Render sleep and process restarts make it an
  unreliable scheduler and mix discovery with web availability.
- **Title-only/local JSON dedup:** It is non-deterministic, not shared by
  workers, vulnerable to races, and cannot support replay-safe publication.
- **Automatic publication:** Provider flags and metadata are not a substitute
  for rights evidence and human review.
- **MVP mirroring/download:** It increases legal, malware, storage, takedown,
  and free-tier exposure before rights and file controls exist.
- **Scraping provider HTML:** It violates or risks provider rules, is brittle,
  and is unnecessary when approved catalog APIs or feeds exist.

## Rollout sequence

1. The source policy and this ADR are accepted through operator/maintainer
   review.
2. Complete [#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344), including
   the metadata, source, status, deduplication, and audit fields needed by the
   workflow.
3. Add ingestion models and database indexes with atomic deduplication and quota
   behavior.
4. Add the authenticated internal ingestion endpoint and its contract,
   validation, limits, replay protection, and redacted observability.
5. Refactor `scrapper-books` into approved HTTP catalog adapters and structured
   JSON, beginning with Open Library.
6. Add admin moderation, publication, unpublish, attribution, and takedown
   controls.
7. Add GitHub Actions scheduling, bounded retry, counters, and job audits; only
   then consider a new ADR for any mirroring or file-fetch capability.

## Decision gates and approval boundary

Operator approval is required at each gate:

| Gate | Approval required |
| --- | --- |
| Documentation | Accepted on 2026-07-31; the policy and this ADR are the governing boundaries. |
| Data model | The fields, indexes, status transitions, and audit retention from [#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344) are reviewed before publication work. |
| Endpoint | The conceptual trust-boundary controls are implemented and reviewed before accepting collector requests. |
| Provider adapter | Each provider's policy, terms, evidence fields, rate behavior, and landing-link rules are reviewed before activation. |
| Moderation/release | Admin approval, attribution, immediate unpublish, and takedown paths are tested before any candidate can be published. |
| Mirroring | A separate ADR is accepted before any remote book-file fetch, storage copy, scanning, or quarantine is introduced. |

Acceptance of this ADR and the linked policy is **documentation approval only**.
It is not permission to scrape, download, mirror, or publish unknown-rights
books, and it does not authorize implementation to bypass the provider rules or
manual-review requirements in the policy.
