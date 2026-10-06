# Improvements register

Follow-ups without a target task. Nothing reads this file automatically;
`/plan` draws from it only when a task is deliberately opened from here.

- [ ] Pools legend: state that `conflict` is a strict range rejecting the shared version and that orange (`isolated`) cells are dragged along by a conflict of the same remote — from docs-pools-tab, scope share-pools · source: wrap-up
- [ ] Pools: one explanatory line per matrix row (what the normal election gave, how many builds, why redirected or isolated), including cross-remote cascades such as `not shared` after another remote's isolation — from docs-pools-tab, scope share-pools · source: wrap-up
- [ ] Pools: name the redirect's cost and the fix (`host ships 3 of 5 members`); show `verdict.redirected.mixes` also when the verdict kind is `isolated` — from docs-pools-tab, scope share-pools · source: wrap-up
- [ ] Pools: tooltip for `host precedence`; declared version in the tooltips of unchanged and redirected cells; a marker for a non-strict cell whose range rejects the shared version (`acceptsShared: false`) — from docs-pools-tab, scope share-pools · source: wrap-up
- [ ] Graph: under the Pool grouping, order or sub-band each pool cluster by provider (par-ticle's provider → pool), so the builds stay visible — from docs-pools-tab, scope share-pools · source: wrap-up
