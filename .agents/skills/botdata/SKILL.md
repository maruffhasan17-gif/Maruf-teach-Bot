---
name: botdata
description: >-
  Use this skill whenever the user types "/bot" or asks to check bot data. It analyzes the current state of Maruf's Telegram Bot and Admin Panel.
---
# Maruf's Bot Data Analyzer (/bot)

When the user types `/bot`, you must perform the following actions:
1. Run `pm2 status` to check if `bot-backend` is online.
2. Run `pm2 logs bot-backend --lines 20 --nostream` to check for any recent crashes or ETELEGRAM errors.
3. Check if the local admin frontend (Vite) is running on port 5174/5175.
4. Output a highly structured, energetic Bengali report to Maruf summarizing:
   - Server Status (Online/Offline)
   - Recent Errors (if any, explain how to fix them)
   - Admin Panel URL ready for withdrawal.
