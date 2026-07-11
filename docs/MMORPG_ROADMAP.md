# Laje → MMORPG Roadmap

How to evolve Laje from a multiplayer ARPG into a true MMORPG, ordered by
dependency. Grounded in the current stack: React Three Fiber + bitecs client,
Socket.io + Node + PostgreSQL (Neon) server.

---

## Phase 1 — Server Authority (the foundation everything else needs)

Today the client simulates combat and tells the server the result. An MMO
cannot work this way (cheating, desync, no shared world truth).

1. **Server-side ECS simulation.** Move enemy AI, combat resolution, loot
   rolls, and XP grants into a server tick loop (~10–15 Hz). The client
   becomes a *predictor + renderer*. bitecs runs fine in Node, so the ECS
   code can be shared between client and server.
2. **Client prediction + reconciliation.** Client moves immediately, server
   confirms; snap/lerp on mismatch. Keep input sequence numbers.
3. **Interest management.** Only broadcast entities within ~50 units of each
   player (spatial hash grid). This is what makes 100+ players per zone
   feasible on Socket.io.
4. **Anti-cheat basics.** Server validates movement speed, attack range,
   cooldowns, and currency deltas. Never trust client-reported damage.

## Phase 2 — World Scale

5. **Zones & instancing.** Split the world into zones, each a Socket.io room
   with its own simulation loop. Zone-transfer handshake persists the
   character and hands off to the new room. Later: run zones as separate
   worker processes/servers with a Redis pub/sub backbone.
6. **Persistent world state.** World bosses, resource nodes, and dynamic
   events stored in PG with respawn timers that survive restarts.
7. **Seamless-ish travel.** Waypoint/teleporter network first (cheap),
   streaming open world later (expensive).

## Phase 3 — Social Systems (what makes it "MMO" and not "online RPG")

8. **Chat service.** Zone / global / party / guild / whisper channels.
   Profanity filter + mute/report. Can piggyback on existing Socket.io.
9. **Parties.** Shared XP (range-based), shared loot rules (round-robin /
   free-for-all / need-greed), party frames in the HUD, party member blips
   on the minimap.
10. **Guilds.** PG tables: guilds, members, ranks, treasury. Guild chat,
    MOTD, shared bank tab. Later: guild halls and guild progression perks.
11. **Friends list + presence.** Online status, "join friend" teleport.
12. **Trading.** Secure two-window trade with double-confirm, plus an
    **auction house** (PG-backed, with listing fees as a gold sink).

## Phase 4 — Content Loops

13. **Quest system.** Data-driven quest definitions (JSON), objectives
    tracked server-side (kill / collect / talk / explore), quest log UI,
    NPC givers with `!` / `?` markers. Chain quests into zone storylines.
14. **Dungeons (instanced).** 3–5 player instanced maps with scripted boss
    mechanics, lockouts, and a group finder queue. Reuses the zone/instance
    machinery from Phase 2.
15. **World bosses & dynamic events.** Zone-wide spawns announced in chat;
    contribution-based loot so big groups don't grief.
16. **Endgame loop.** Daily/weekly quests, dungeon difficulty tiers
    (normal/heroic), a seasonal ladder, and set-item bonuses on the existing
    Common→Legendary tier system.
17. **Crafting & gathering.** Resource nodes in the world, professions
    (e.g., Nanoforging, Aetherweaving, Circuitry), recipes with tiered
    outputs feeding the auction house economy.

## Phase 5 — Economy & Retention

18. **Economy design.** Gold sinks (repairs, AH fees, teleports, cosmetics)
    to counter mob-drop inflation; server-side price telemetry.
19. **PvP.** Duels first, then opt-in open-world flagging, then small
    arenas (2v2/3v3) with ratings. Server authority (Phase 1) is a hard
    prerequisite.
20. **Cosmetics & housing.** Dyes, mounts, pets, instanced player housing —
    strong retention, no power creep.

## Infrastructure checklist

- **Auth:** move from plaintext-ish flow to JWT + refresh tokens, bcrypt
  already in place; add rate limiting and session invalidation.
- **Scaling:** Node worker per zone → Redis pub/sub for cross-zone
  (chat, guilds, AH) → horizontal shards ("realms") when needed.
- **Persistence:** batch writes (already have 30s auto-save); add
  write-ahead event log for rollback of dupes/exploits.
- **Ops:** metrics (tick duration, players per zone, msg/s), structured
  logs, staging realm, and a load-test harness (headless Socket.io bots).

## Suggested build order (pragmatic)

| Milestone | Deliverable | Why first |
|---|---|---|
| M1 | Server-authoritative combat + interest management | Everything depends on it |
| M2 | Chat + parties + shared XP | Cheap, instantly feels "MMO" |
| M3 | Quest system + first zone storyline | Content backbone |
| M4 | Zones/instancing + first dungeon | Group endgame |
| M5 | Guilds + trading + auction house | Economy & community |
| M6 | World bosses, PvP, seasons | Long-term retention |
