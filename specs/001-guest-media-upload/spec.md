# Feature Specification: Guest Media Upload ("wedding-moments")

**Feature Branch**: `001-guest-media-upload`
**Created**: 2026-11-19
**Status**: Ready for planning
**Input**: User description: "Guest site for Yana & Vitalii's wedding (4 Sept 2027): scan QR → open →
upload photos/videos → see your own uploads. Simplest thing that works for ~27 guests with phones.
See `PLAN.md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload photos and videos from a phone (Priority: P1)

A guest scans the QR code on a table, the page opens instantly with no sign-up, they tap
"Додати фото та відео", pick several photos and videos from their gallery, and watch each
file upload with its own progress indicator. If one file fails, the others continue and the
failed one offers a retry.

**Why this priority**: Collecting the guests' media is the entire purpose of the site. Without
it nothing else has value.

**Independent Test**: Open the page on a phone, select 5 photos and 1 video, confirm all 6
arrive in the couple's storage as unmodified originals.

**Acceptance Scenarios**:

1. **Given** a guest opens the link for the first time, **When** the page loads, **Then** they
   can upload immediately without entering any credentials.
2. **Given** a guest selected multiple files, **When** uploads run, **Then** each file shows its
   own progress and final state (done / error).
3. **Given** one file in a batch fails, **When** the rest continue, **Then** the failed file
   shows an error and a "retry" action that re-uploads only that file.
4. **Given** a large video is uploading, **When** the connection drops and comes back,
   **Then** the upload continues from where it stopped instead of restarting.
5. **Given** a file of an unsupported type or above the size limit, **When** the guest selects
   it, **Then** it is rejected with a clear message and other files are unaffected.

---

### User Story 2 - See and manage my own moments (Priority: P2)

Below the upload button the guest sees "Ваші моменти": a grid of thumbnails of everything they
uploaded from this phone. Tapping one opens it full-screen (photo or playable video). They can
delete a file they uploaded by mistake.

**Why this priority**: Gives guests confidence their uploads worked and lets them fix mistakes,
but uploads already deliver value without it.

**Independent Test**: After uploading, reload the page on the same phone; the grid shows the
same items; delete one; it disappears and is gone from storage.

**Acceptance Scenarios**:

1. **Given** a guest uploaded files earlier, **When** they reopen the page on the same browser,
   **Then** they see their uploads as a thumbnail grid, newest first.
2. **Given** a thumbnail could not be generated, **When** the grid renders, **Then** a neutral
   placeholder (photo/video icon) is shown and the original still opens.
3. **Given** a guest taps a thumbnail, **When** the viewer opens, **Then** photos display
   full-screen and videos play inline with controls.
4. **Given** a guest taps "delete" and confirms, **Then** the file and its record are removed
   and no longer visible.
5. **Given** guest A and guest B use different phones, **Then** neither can see or delete the
   other's uploads.

---

### User Story 3 - Optional guest name (Priority: P3)

The guest may type their name once ("Як вас звати?"); it is remembered on this phone and
attached to every subsequent upload so the couple can sort media by guest later.

**Why this priority**: Nice for organising the export; uploads work fine anonymously.

**Independent Test**: Enter a name, upload a file, check the record carries the name; reload,
the name field is prefilled.

**Acceptance Scenarios**:

1. **Given** a guest enters a name, **When** they upload, **Then** each upload record carries it.
2. **Given** a guest reloads the page, **Then** the previously entered name is prefilled.
3. **Given** a guest leaves the name empty, **Then** uploads still succeed.

---

### User Story 4 - Couple exports everything after the wedding (Priority: P2)

After the wedding the couple runs one command on their computer that downloads every original
into folders named after each guest (or the guest id if no name).

**Why this priority**: This is how the couple actually gets the media; must work before the
event's storage plan is downgraded.

**Independent Test**: Run the export against a project with test uploads; the number of files
on disk equals the number of upload records; files are byte-identical to the originals.

**Acceptance Scenarios**:

1. **Given** N upload records, **When** export runs, **Then** N original files exist on disk,
   grouped into one folder per guest.
2. **Given** export is run twice, **Then** already-downloaded files are skipped.

---

### User Story 5 - Printable QR card (Priority: P3)

The couple can produce a printable card in the invitation style with the QR code pointing to
the site and a one-line instruction.

**Independent Test**: Generate the card, scan the printed QR with iPhone and Android cameras,
the site opens.

**Acceptance Scenarios**:

1. **Given** the site URL in configuration, **When** the card is generated, **Then** it contains
   a scannable QR for that URL, the couple's names and date.

---

### Edge Cases

- Guest clears browser data or switches browser → loses view of earlier uploads (files remain and
  are included in export). The page explains nothing special; this is accepted (ADR-002).
- HEIC photos from iPhone: original kept as-is; thumbnail is generated when the browser can decode
  it, otherwise placeholder.
- Portrait videos: poster thumbnail must respect orientation.
- Guest navigates away mid-upload: in-flight uploads stop; re-selecting the same file resumes
  where possible.
- Very old phone that cannot create thumbnails: originals still upload.
- Duplicate selection of the same file: treated as a separate upload (no dedup in v1).
- Link leaks publicly: storage limits cap abuse; anonymous sign-in is disabled after the event.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST be a single page in Ukrainian, reachable from a QR code, requiring no
  account, password or code.
- **FR-002**: Guests MUST be able to select multiple photos and videos at once from their device
  gallery.
- **FR-003**: Each file MUST show individual progress and final status; failures MUST be retryable
  per file without affecting others.
- **FR-004**: Uploads MUST resume after a network interruption without restarting from zero.
- **FR-005**: Originals MUST be stored unchanged (no compression, resizing, transcoding).
- **FR-006**: A small preview (≈480 px) MUST be produced for photos and a poster frame for videos
  where the device supports it; absence of a preview MUST NOT fail the upload.
- **FR-007**: Allowed file types (images, videos) and a maximum file size MUST be enforced by the
  storage service, not only by the page.
- **FR-008**: Guests MUST see only their own uploads, and MUST be able to delete only their own.
- **FR-009**: Viewing media MUST use short-lived links; storage MUST NOT be publicly listable.
- **FR-010**: Guests MAY enter a display name; it MUST persist on the device and be stored with
  each upload.
- **FR-011**: The couple MUST be able to export all originals, grouped per guest, with a single
  command, idempotently.
- **FR-012**: The site MUST ask search engines not to index it.
- **FR-013**: Names, date, texts and colours MUST come from one configuration file.
- **FR-014**: A data model flag MUST allow later marking uploads as shared with all guests
  (v1.1 "Усі моменти"), without being exposed in the v1 UI.
- **FR-015**: A printable QR card MUST be producible from the configured site URL.

### Key Entities

- **Guest**: anonymous identity bound to one browser on one device; optional display name.
- **Upload**: one original media file plus optional preview; attributes: owner guest, display
  name, kind (photo/video), content type, size, original location, preview location, shared flag,
  created time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First screen is usable within 3 seconds on a 4G phone connection.
- **SC-002**: A guest can go from scanning the QR to a started upload in under 30 seconds.
- **SC-003**: A 300 MB video upload interrupted by a Wi-Fi drop completes after reconnection
  without re-sending already-uploaded data.
- **SC-004**: 10 guests uploading 20 photos + 1 video each at the same time all complete with no
  lost files.
- **SC-005**: Exported file count equals stored record count (100 %), originals byte-identical.
- **SC-006**: In an automated isolation test, guest A can read/delete 0 of guest B's uploads, and
  an unauthenticated visitor can read 0 uploads.

## Assumptions

- ~27 guests, peak load on one day; 20–40 GB total storage in the worst case (PLAN NFR1).
- No passphrase on entry — the secret URL in the QR is sufficient (PLAN §7, default chosen).
- Hosting on the default GitHub Pages domain unless a custom domain is configured later.
- After the event the site stays up read-only for the couple until export is done; anonymous
  sign-ins are then disabled and the storage plan downgraded (runbook in docs).
- Guests without a smartphone are handled off-line (paper), outside this software.
- Shared gallery for all guests is v1.1 and out of scope (only the data flag is in scope).
- Default limits: max 2 GB per file (to be verified against the storage provider's plan);
  allowed types `image/*`, `video/*`.
