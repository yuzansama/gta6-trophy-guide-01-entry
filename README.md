# gta6-trophy-guide-01-entry

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/yuzansama/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/yuzansama/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** is an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It shows every trophy with its official name, description and grade, saves a checklist in the browser, filters by kind, hides story trophies behind a spoiler shield, exports and imports progress, lays out a seven-stage roadmap to the platinum and flags the trophies that could be missed.

Every guide is tagged fact by fact: OFFICIAL (the published list or Rockstar), PRECEDENT (how an earlier Rockstar game handled the same kind of trophy) or VERIFY (a plan to test, not a fact), each with a link to its source. Nothing is presented as a confirmed location or step without one.

## Run it

```sh
node serve.ts            # then open http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in: app/, screenshots/ and dossier.json
```

## Layout

- `app/` static files, no build step, no network request at run time
  - `data/trophies.json` the 55 trophies, their guides, cited steps, sources and the roadmap
  - `js/` one module per job: checklist, guide panel, roadmap, missables, sources, filters, spoiler shield, progress store, deep links
- `screenshots/` real renders of the app, taken by `node tools/capture-screenshots.mjs "<path to chrome>"` from the views in `shots.json`
- `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`
- `vendor/makefun-frontend.ts` the kit's library, unchanged

Not affiliated with Rockstar Games or Sony. No game artwork or logos are used.

---

<sub>Entered on [make.fun](https://make.fun/?ref=brg435wz&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
