#!/bin/bash
sudo -u postgres psql -d autopost -c "SELECT id, LEFT(title, 25), scheduled_at, metadata->>'ai_generated' as ai FROM autopostvn_posts ORDER BY scheduled_at DESC LIMIT 15"
