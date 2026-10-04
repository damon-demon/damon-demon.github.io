#!/usr/bin/env bash
# Integration checks for the reel on the real page, through headless Chrome.
# Usage: tests/reel/page-check.sh            (from anywhere; serves the repo root)
set -uo pipefail
cd "$(dirname "$0")/../.."
PORT="${PORT:-8137}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

fail=0
# dom WIDTHxHEIGHT PATH [extra chrome flags...]
dom() {
  local size="$1" path="$2"; shift 2
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$size" \
    --virtual-time-budget=3000 "$@" --dump-dom "http://127.0.0.1:$PORT/$path" 2>/dev/null
}
# expect NAME HTML REGEX...: every regex must match
expect() {
  local name="$1" html="$2"; shift 2
  for re in "$@"; do
    if ! grep -Eq -- "$re" <<<"$html"; then echo "FAIL - $name: no match for /$re/"; fail=1; return; fi
  done
  echo "ok   - $name"
}
reel() { grep -Eo '<section id="reel"[^>]*>' <<<"$1"; }
canvas() { grep -Eo '<canvas class="reel-canvas"[^>]*>' <<<"$1"; }

d=$(dom 1440,900 '?reel=1')
expect 'paused at 1s: Sheffield, chapter 1, step 1 lit' "$d" \
  'data-state="paused"' 'data-chapter="0"' 'class="reel-caption[^"]*">Sheffield<' 'class="step is-live" data-org="sheffield"'
expect 'desktop canvas is 1440/3 native px wide' "$(canvas "$d")" 'width="480"' 'height="96"'
expect 'five chapter buttons plus pause' "$d" 'aria-label="Chapter 5: To be continued"[^>]*>05<' 'class="reel-pause" aria-label="Play"'

d=$(dom 1440,900 '?reel=5');  expect 'caption switches to Europe inside chapter 1' "$d" 'data-chapter="0"' '>Europe<'
d=$(dom 1440,900 '?reel=19'); expect 'New York lights step 2' "$d" 'data-chapter="1"' '>New York<' 'class="step is-live" data-org="columbia"'
d=$(dom 1440,900 '?reel=31'); expect 'Michigan lights step 3' "$d" 'data-chapter="2"' 'class="step is-live" data-org="msu"'
d=$(dom 1440,900 '?reel=39'); expect 'California lights step 4' "$d" 'data-chapter="3"' 'class="step is-live" data-org="amazon"'
d=$(dom 1440,900 '?reel=45'); expect 'To be continued keeps step 4 lit' "$d" 'data-chapter="4"' '>To be continued…<' 'class="step is-live" data-org="amazon"'

# headless Chrome will not go narrower than 500px, so the phone check runs at 500 (still 2x)
expect 'phone-size canvas is 500/2 native px wide' "$(canvas "$(dom 500,900 '?reel=1')")" 'width="250"' 'style="[^"]*width: 500px'
expect 'wide screen switches to 4x' "$(canvas "$(dom 1920,1080 '?reel=1')")" 'width="480"' 'style="[^"]*width: 1920px'

expect 'offscreen at load: waits at t=0' "$(reel "$(dom 1440,900 '')")" 'data-state="paused"' 'data-t="0.00"'
expect 'scrolled into view: plays' "$(reel "$(dom 1440,900 '#reel')")" 'data-state="playing"' 'data-t="(0\.[0-9]*[1-9]|[1-9])'
expect 'shot loop debug plays that shot' "$(dom 1440,900 '?reel=ch1-trolltunga')" 'data-state="playing"' '>Europe<'
expect 'reduced motion: still poster, no autoplay' "$(dom 1440,900 '#reel' --force-prefers-reduced-motion)" \
  'data-state="paused"' '>California<' 'class="step is-live" data-org="amazon"' 'aria-label="Play"'

if git rev-parse --verify -q main >/dev/null; then
  if diff <(git show main:index.html | grep -o 'href="[^"]*"' | sort) <(grep -o 'href="[^"]*"' index.html | sort) >/dev/null; then
    echo "ok   - every href in index.html is unchanged"
  else
    echo "FAIL - hrefs in index.html changed"; fail=1
  fi
fi
exit $fail
