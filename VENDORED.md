# Vendored third-party assets

## Sakuga VFX — finktheartist/sakuga-vfx

- **Repository:** <https://github.com/finktheartist/sakuga-vfx>
- **License:** MIT (LICENSE copy in `public/sakuga-vfx/LICENSE`, byte-identical to upstream)
- **Upstream commit:** `c3dabb173928a3ad2372183103caf2e6f50953d0` (main, 2026-11-17)
- **Files:** `button.js`, `tabs.js`, `toast.js` — unmodified, byte-identical to upstream at that commit
- **Usage:** button ("Save event"), tabs (events tab), toast (save confirmations). Colour overrides live in `app/globals.css` under `--sk-*`.

To re-vendor: re-download from `main`, verify `sha256`, record the new commit SHA here, and re-run `node tools/test.mjs` equivalents (lint + build + browser save-to-list check).
