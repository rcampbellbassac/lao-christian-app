#!/usr/bin/env bash
# Poll a GitHub PR until its status checks are actually green (not just "not pending"),
# correctly distinguishing "no checks reported yet" from "checks completed and passing".
#
# Usage: poll-pr-checks.sh <pr-number> [max-tries] [sleep-seconds]
#
# Emits one line per check and a final RESULT:<state> line, where state is one of:
#   all_green   - checks reported, all completed, all successful -> safe to merge
#   failed      - some check completed with a non-success conclusion
#   timeout     - max-tries exhausted without reaching a terminal state

set -euo pipefail

pr="${1:?usage: poll-pr-checks.sh <pr-number> [max-tries] [sleep-seconds]}"
max_tries="${2:-30}"
sleep_secs="${3:-20}"

for i in $(seq 1 "$max_tries"); do
  state=$(gh pr view "$pr" --json mergeStateStatus,statusCheckRollup)

  result=$(echo "$state" | python3 -c "
import json, sys
d = json.load(sys.stdin)
checks = d.get('statusCheckRollup', [])

if not checks:
    # Distinct from 'pending': no check runs have registered for this SHA yet
    # (e.g. moments after a rebase, before workflows are triggered).
    print('no_checks')
elif any(c.get('status') != 'COMPLETED' for c in checks):
    print('pending')
elif any(c.get('conclusion') not in ('SUCCESS', 'SKIPPED', 'NEUTRAL') for c in checks):
    print('failed')
else:
    print('all_green')
")
  mss=$(echo "$state" | python3 -c "import json,sys; print(json.load(sys.stdin).get('mergeStateStatus'))")

  echo "check $i: mergeStateStatus=$mss checks=$result"

  case "$result" in
    all_green)
      # Only treat PR as merge-ready when GitHub reports a clean merge state.
      if [ "$mss" = "CLEAN" ]; then
        echo "RESULT:all_green"
        exit 0
      fi
      ;;
    failed)
      echo "RESULT:failed"
      exit 1
      ;;
  esac

  sleep "$sleep_secs"
done

echo "RESULT:timeout"
exit 2
