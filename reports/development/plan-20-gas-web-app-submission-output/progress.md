# Plan 20 Progress Report

## Summary

Implemented the optional GAS web app submission output without changing the static GitHub Pages target.

### What changed

- Added a shared submission payload module in `src/submission/index.js`.
- Added GAS server wrappers in `gas/Code.gs` and `gas/Submission.gs`.
- Added a local GAS packaging script in `scripts/build-gas.mjs`.
- Added a submission card to the end-of-problem review summary so completed problems can be submitted when `google.script.run` is available.
- Wired truth-table and Venn completion flows to build submission payloads from the shared summary data plus usage counts.
- Added tests for:
  - submission payload shape
  - sheet row shape
  - simulated `google.script.run` success/failure with latency
  - static fallback behavior when GAS is unavailable
- Documented the GAS output, privacy assumptions, and validation expectations in the architecture, deployment, and testing docs.

### Validation

- `npm test` - passed
- `npm run lint` - passed
- `npm run build:gas` - passed
- `npm run test:e2e` - passed

### Notes

- No GAS push was performed.
- No live Sheet write was performed.
- The generated `gas-dist/` output stays local and ignored by git.
- Student email is only written on the GAS server side; the static app keeps submission controls disabled.
