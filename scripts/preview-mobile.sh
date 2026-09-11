#!/bin/sh
# Open the dev site in a real Chrome window sized like a phone.
#
#   npm run dev:phone              iPhone 15 Pro, 393x852
#   npm run dev:phone -- 320       narrow: the smallest width worth supporting
#   npm run dev:phone -- 768 1024  iPad portrait, where the panel stacks but
#                                  currently gets no bottom sheet
#
# A real window is used rather than headless: headless Chrome lays out at its
# own default viewport and merely crops the screenshot, so media queries below
# that width never fire and the capture lies about what a phone sees.
W=${1:-393}
H=${2:-852}
URL=${URL:-http://localhost:3000/}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME"; exit 1; }
curl -s -o /dev/null --max-time 3 "$URL" || { echo "Nothing at $URL — run 'npm run dev' first."; exit 1; }
echo "Opening $URL at ${W}x${H}"
echo "  breakpoints: 900 panel stacks · 640 chips+sheet · 560 header+stats"
"$CHROME" --new-window --window-size="$W,$H" --window-position=40,40 \
  --user-data-dir="${TMPDIR:-/tmp}/meguru-preview" --no-first-run --no-default-browser-check \
  "$URL" >/dev/null 2>&1 &
