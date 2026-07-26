# E2E flow tests

Playwright scripts that exercise the critical purchase path against the running
dev server (`http://localhost:8080`).

## Coverage

`browse_to_checkout.py`
- Home → grid card click → detail page loads with prize image
- Lucky Dip: quantity stepper → Enter now → reservation → `/checkout` with
  reserved ticket numbers shown
- Pick numbers: tap two available numbers → Enter now → `/checkout`

Each flow runs in **mobile (390×844)** and **desktop (1280×900)** viewports.

## Run

```bash
python3 tests/e2e/browse_to_checkout.py
```

Exit code `0` = all flows passed. Screenshots for every step land under
`/tmp/browser/e2e/<viewport>/`.

No auth is required — reservations use anonymous sessions.
Cleanup: reservations expire on their own after 15 minutes, no teardown needed.