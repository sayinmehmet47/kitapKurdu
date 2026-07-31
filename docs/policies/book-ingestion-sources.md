# Book ingestion sources policy

- Status: Accepted
- Approval: Operator accepted on 2026-07-31
- Owners: Operator and maintainers
- Effective date: 2026-07-31
- Issue: [#347](https://github.com/sayinmehmet47/kitapKurdu/issues/347)
- Related ADR: [ADR-0001: Automated book ingestion boundaries and architecture](../adr/0001-automated-book-ingestion.md)

## Purpose and scope

This policy defines which book sources kitapKurdu may use and what evidence is
required before a candidate can be considered for moderation. It governs
discovery, metadata, links, files, moderation, publication, attribution, and
takedown. It applies to collectors, adapters, backend ingestion, administrators,
and any future source or mirroring feature.

This policy is the source-specific companion to the [automated ingestion
ADR](../adr/0001-automated-book-ingestion.md). It is informed by the epic
[#345](https://github.com/sayinmehmet47/kitapKurdu/issues/345), this child issue
[#347](https://github.com/sayinmehmet47/kitapKurdu/issues/347), and dependency
[#344](https://github.com/sayinmehmet47/kitapKurdu/issues/344). The [current
architecture document](../architecture.md) describes the implemented system;
this policy and the ADR describe accepted boundaries for the planned work. Contributors
must also follow the repository [AGENTS.md](../../AGENTS.md).

This is an operational risk-control document, not legal advice and not a global
determination of copyright status. Rights can differ by work, edition,
jurisdiction, format, and time.

## Default principles

All ingestion decisions follow these principles:

1. **Rights before volume.** A smaller set of well-supported candidates is
   preferable to a larger set with uncertain rights.
2. **External canonical links over mirroring.** Link to an authoritative
   landing page rather than copying book files.
3. **Metadata access is not content redistribution permission.** An API or
   catalog may expose metadata without granting permission to redistribute the
   underlying text, scans, or files.
4. **Unknown rights means reject or hold.** Unclear, conflicting, or
   jurisdictionally incomplete evidence never becomes an automatic approval.
5. **Manual approval.** Automation may discover, normalize, validate, and
   queue candidates; a reviewer decides whether a candidate may be published.
6. **Least privilege and auditable evidence.** Collect only what is needed,
   retain the observations and decisions that support each candidate, and make
   actions attributable and reviewable.

Provider indicators are evidence about what a provider reported at an observed
time. They are not a global legal conclusion, and fields such as `public` or
`publicDomain` must not be treated as definitive proof worldwide.

## Allowlisted source categories

A candidate may be considered only when its source fits one of these categories
and the evidence is retained:

- A verified public-domain source, with the relevant jurisdiction recorded.
- An explicit open license or other explicit permission that covers the
  proposed use.
- Approval from the author or rightsholder, retained in a reviewable form.
- An explicitly authorized link to an authoritative catalog or landing page,
  when the use is limited to that link and the catalog's access terms permit
  it.

Being discoverable, free to read, searchable, previewable, borrowable, or
available through an API does not by itself satisfy one of these categories.

### Required evidence for every candidate

The system must retain these fields for every candidate, including candidates
that are rejected or deduplicated:

| Evidence field | Requirement |
| --- | --- |
| Provider | The named provider and adapter that supplied the observation. |
| Native source IDs | Stable identifiers supplied by the provider, such as an Open Library or Internet Archive ID. |
| Canonical URL | The provider-approved landing URL; arbitrary deep file URLs are not acceptable for the MVP. |
| Observed license/access signals | The raw or faithfully represented license, access, availability, and relevant provider flags observed by the collector. |
| Jurisdiction | The country or other jurisdiction to which a rights or access statement applies; unknown must be recorded as unknown rather than inferred. |
| Terms/policy URL and observed time | The provider terms, robot, license, or policy URL consulted and when it was observed. |
| Collector version | The version of the collector/adapter that produced the observation. |
| Reviewer decision, reason, and timestamps | The decision (`approved`, `rejected`, or `held`), the reason, reviewer identity or role, and decision and state-transition times. These may be pending before review. |

Evidence is captured as an observation, not rewritten into a stronger claim.
For example, a provider's access flag can support a review but cannot establish
public-domain status in every jurisdiction.

## Initial provider matrix

The following matrix is the initial allowlist. “Future” means that no adapter
may be activated until its implementation, terms review, and operator approval
are complete.

| Provider/source | State | Allowed use and constraints |
| --- | --- | --- |
| Open Library metadata and Search API | **Initial adapter** | Use the official metadata/search APIs only. Identify requests with an application `User-Agent` and contact information, cache responses, and begin at a conservative rate of no more than 1 request per second. Do not scrape HTML or harvest the API in bulk. Only candidates with `ebook_access: public`, `public_scan_b: true`, and stable Open Library and/or Internet Archive IDs may enter manual review. Borrow-only and controlled-digital-lending (CDL) items are denied. Store the canonical Open Library landing page or an `archive.org/details/<id>` landing link, never an arbitrary deep file URL. |
| Project Gutenberg | **Future English public-domain adapter** | Use official feeds, catalog data, and the provider's robot-harvest rules. Apply the US-only public-domain caveat; an item reported as public domain in the United States is not automatically public domain elsewhere. Use ebook landing pages only. Do not use prohibited deep links or general website crawling. |
| Google Books | **Metadata enrichment only** | Use the Books API for metadata enrichment and a canonical volume reference when appropriate. Country-scoped access and `publicDomain` fields are evidence only and are not sole rights proof. Download URLs, ACS/token URLs, and other content acquisition links are denied. |
| Standard Ebooks | **Future adapter** | Activation depends on permitted feed access and current terms. Record the explicit license/public-domain evidence applicable to the specific Standard Ebooks work and its jurisdictional limits. |
| Welib, Library Genesis, Z-Library, Anna's Archive mirrors, private groups, and unknown mirrors | **Not allowlisted** | Do not discover, collect, link, download, or publish candidates from these sources. A mirror's claim, availability, or popularity is not an allowlist decision. |
| Current live behavior of `scrapper-books` | **Not allowlisted** | The current GUI/macOS/Puppeteer and untrusted-source downloader behavior is not an approved provider or adapter. It must not be integrated as-is; see the [ADR](../adr/0001-automated-book-ingestion.md). |

Provider status is not permanent. A future adapter needs a policy and terms
review before activation, and a material provider-policy change pauses the
adapter until the evidence is reassessed.

## Prohibited behavior

The following are prohibited under this policy:

- Bypassing DRM or paywalls.
- Evading anti-bot controls, rate limits, blocks, or provider detection through
  stealth techniques.
- Scraping private groups or using credentials obtained for a private group.
- Automatically publishing or downloading a book when rights are unknown.
- Downloading borrow-only, CDL, licensed-preview, or otherwise access-limited
  content as though it were freely redistributable.
- Collecting provider or user credentials.
- Unauthorized mirroring or copying of provider-hosted book files.
- Bypassing, delaying, or concealing a takedown or unpublish decision.

## MVP boundary: external links only

The MVP is **external-link-only**. It may retain reviewed metadata and an
approved canonical landing link, but it must not fetch remote book files. The
MVP therefore includes no remote book-file fetch, Cloudinary copy, malware
scanning, or quarantine pipeline yet. This keeps Render, MongoDB Atlas, and
Cloudinary free-tier resource use predictable and limits the legal and security
exposure of handling untrusted files.

Any future mirroring must be proposed in and approved through a new ADR. That
ADR must provide secure fetch controls, explicit rights for the exact use and
jurisdiction, provider-compliant access, file-handling controls, and an
operator-approved migration plan. This policy does not grant permission to add
those capabilities.

## Moderation, publication, attribution, and takedown

Automation may create a `pending-review` candidate only after the required
evidence, validation, deduplication, and quota checks succeed. A human reviewer
must record an approval or rejection and the reason. No collector, cron job, or
API request may publish directly.

Published entries must attribute the source in a clear, non-misleading way.
Attribution should identify the provider, relevant author/title metadata,
canonical landing link, applicable license or permission evidence, and
jurisdiction where useful. Attribution must not imply that a provider endorses
kitapKurdu or that a provider flag is a universal rights determination.

Reports from a rightsholder, provider, user, or other credible reporter must be
logged with the received time, affected candidate, report reason, and actions.
The expected response is:

1. Immediately unpublish or hide the affected entry and disable its external
   link when a credible takedown or rights concern is received.
2. Preserve the audit record and evidence; do not erase history to make the
   entry appear never to have existed.
3. Mark the candidate as blocked or under takedown review, stop related
   automation, and investigate the source, jurisdiction, and permission.
4. Communicate with the reporter or provider when appropriate and record the
   outcome.
5. Republish only after a fresh manual decision with current evidence.

Evidence, moderation decisions, publication changes, provider-policy reviews,
and takedown events are append-only audit events. Retain them for the life of
the candidate/publication and for at least 12 months after rejection or
takedown, unless a longer operational or legal retention requirement applies.
Retention must not be used to retain secret values or unnecessary credentials.

Maintainers review each active provider's terms, robot rules, licenses, and
access signals at least quarterly and before activating a new adapter. A
material change, block, policy notice, rights report, or unexplained access
change pauses the affected adapter; the change and the response must be
recorded before collection resumes.

## Daily candidate semantics

At most **10 newly accepted unique `pending-review` candidates per UTC day**
may pass validation, deduplication, and quota admission. This is a ceiling, not
a promise of exactly 10, and no candidate is auto-published. A provider may
produce zero candidates, and a day may end below the ceiling for rights,
quality, availability, or operational reasons.

Duplicates and rejected candidates do not consume the 10-candidate
pending-review admission/publication slots, but their observations and
decisions remain audited. Quota accounting must be atomic and backend-owned so
retries and concurrent collectors cannot create more than the daily limit.

## Official references

The following official references were fetched on 2026-07-31. They inform
provider handling but do not replace candidate-level rights review:

- Open Library [APIs](https://openlibrary.org/developers/api), [Search API](https://openlibrary.org/dev/docs/api/search), [licensing](https://openlibrary.org/developers/licensing), and [borrowing FAQ](https://openlibrary.org/help/faq/borrow).
- Project Gutenberg [robot access](https://www.gutenberg.org/policy/robot_access.html), [permissions](https://www.gutenberg.org/policy/permission.html), and [terms of use](https://www.gutenberg.org/policy/terms_of_use.html).
- Google Books [using the API](https://developers.google.com/books/docs/v1/using) and [Volume reference](https://developers.google.com/books/docs/v1/reference/volumes).
- Standard Ebooks [feeds](https://standardebooks.org/feeds) and [about](https://standardebooks.org/about).

Provider pages and terms can change. The observed URL and time must therefore
be retained with each candidate and revisited under the review cadence above.
