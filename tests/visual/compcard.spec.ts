/**
 * Visual regression check for CompCard.
 *
 * Run manually:
 *   python3 tests/visual/compcard.spec.ts   # no — this is a bash-invoked python script
 *
 * Actually run via:
 *   bash tests/visual/run.sh
 *
 * Guards the Enter Now / + Add buttons against horizontal overflow at every
 * container width the real grid uses. Screenshots land in
 * /tmp/browser/compcard/ for eyeballing when something changes.
 */
export {};