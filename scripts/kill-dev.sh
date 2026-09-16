#!/bin/sh
# Stop everything this project starts, when Ctrl-C did not.
#
#   npm run dev:kill
#
# Ctrl-C only reaches the process in the foreground. A dev server started in a
# background job, or one whose terminal was closed, keeps the port and the next
# `npm run dev` quietly moves to :3001 -- which is how you end up reviewing a
# stale build on the wrong port.
#
# Only LISTEN sockets are killed, never connections: a browser talking to :3000
# shows up in lsof too, and killing that would close a tab rather than a server.
killed=0

for port in 3000 3100; do
  pids=$(lsof -ti:"$port" -sTCP:LISTEN 2>/dev/null | sort -u)
  for pid in $pids; do
    echo "  :$port  killing listener $pid  ($(ps -o comm= -p "$pid" 2>/dev/null))"
    kill "$pid" 2>/dev/null && killed=$((killed + 1))
  done
done

for pid in $(pgrep -f 'next dev|next-server' 2>/dev/null | sort -u); do
  echo "  next  killing $pid"
  kill "$pid" 2>/dev/null && killed=$((killed + 1))
done

# The dev:phone windows run on their own throwaway profile, so this cannot
# touch a normal Chrome session.
for pid in $(pgrep -f 'meguru-preview' 2>/dev/null | sort -u); do
  echo "  preview  closing window $pid"
  kill "$pid" 2>/dev/null && killed=$((killed + 1))
done

sleep 1
still=$(lsof -ti:3000 -sTCP:LISTEN 2>/dev/null | sort -u)
if [ -n "$still" ]; then
  echo "  :3000 still held, forcing: $still"
  for pid in $still; do kill -9 "$pid" 2>/dev/null; done
fi

if [ "$killed" -eq 0 ]; then
  echo "Nothing to kill — :3000 and :3100 are free."
else
  echo "Stopped $killed process(es). :3000 is $(lsof -ti:3000 -sTCP:LISTEN >/dev/null 2>&1 && echo 'STILL BUSY' || echo 'free')."
fi
