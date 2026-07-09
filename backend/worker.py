"""
WICKED Autonomous Worker — Railway entry point.

Run as a dedicated long-running process (NOT inside the FastAPI web service):

    python worker.py

On Railway: create a second service from this same repo, set its start
command to `python worker.py`, and set AUTONOMOUS_MODE=true on that service
only. See AUTONOMOUS.md for the full setup.
"""

import logging
import sys
from pathlib import Path

# Ensure the backend directory is on the path (same as main.py)
sys.path.insert(0, str(Path(__file__).resolve().parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)

from autonomous import autonomous_loop, get_autonomous_config

logger = logging.getLogger("wicked.worker")


if __name__ == "__main__":
    cfg = get_autonomous_config()
    logger.info("=" * 60)
    logger.info("  WICKED Autonomous Worker")
    logger.info("=" * 60)
    logger.info("AUTONOMOUS_MODE:       %s", "ON" if cfg["enabled"] else "OFF (idling until enabled)")
    logger.info("LOOP_INTERVAL_MINUTES: %.0f", cfg["interval_minutes"])
    logger.info("Client / topic:        %s / '%s'", cfg["client_id"], cfg["topic"])
    logger.info("=" * 60)
    try:
        autonomous_loop()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
