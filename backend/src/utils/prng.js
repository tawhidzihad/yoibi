/**
 * Mulberry32 — a small, fast, deterministic 32-bit PRNG.
 * Returns a function that produces a float in [0, 1) on each call.
 *
 * @param {number} seed - 32-bit integer seed
 * @returns {() => number}
 */
function mulberry32(seed) {
    let state = seed | 0;
    return function () {
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Selects `count` items from `pool` using recency-weighted random without
 * replacement.  Weight for each item is `1 / (1 + ageInHours / 24)` — newer
 * items are favoured but older items still have a chance.
 *
 * @param {Array} pool   - Array of objects with a `createdAt` date/string
 * @param {number} count - Number of items to select
 * @param {() => number} prng - Seeded PRNG function returning [0, 1)
 * @param {number} now   - Current timestamp in ms (for age calculation)
 * @returns {Array} Selected items (may be shorter than `count` if pool is small)
 */
function weightedRandomSelect(pool, count, prng, now = Date.now()) {
    if (pool.length === 0 || count <= 0) return [];

    const available = pool.map((item, i) => ({ item, index: i }));
    const picked = [];

    for (let i = 0; i < count && available.length > 0; i++) {
        const weights = available.map(({ item }) => {
            const createdAt = item.createdAt instanceof Date
                ? item.createdAt.getTime()
                : new Date(item.createdAt).getTime();
            const ageHours = Math.max(0, (now - createdAt) / (1000 * 60 * 60));
            return 1 / (1 + ageHours / 24);
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        if (totalWeight <= 0) break;

        let r = prng() * totalWeight;
        let j = 0;
        for (; j < weights.length - 1; j++) {
            r -= weights[j];
            if (r <= 0) break;
        }

        picked.push(available[j].item);
        available.splice(j, 1);
    }

    return picked;
}

/**
 * Selects discovery tweets for a specific page by replaying the PRNG from
 * the seed.  This guarantees:
 *   - Same seed + same page + same pool → identical picks (deterministic)
 *   - No duplicates across pages (without-replacement across the replay)
 *
 * @param {Array}  pool      - Discovery candidate pool (full, unfiltered)
 * @param {number} perPage   - Discovery tweets per page
 * @param {number} seed      - Feed session seed
 * @param {number} pageIndex - 0-based page index
 * @param {number} [now]     - Current timestamp in ms (defaults to Date.now())
 * @returns {Array} Discovery tweets for this page
 */
function selectDiscoveryForPage(pool, perPage, seed, pageIndex, now = Date.now()) {
    if (pool.length === 0 || perPage <= 0) return [];

    const prng = mulberry32(seed);
    const totalNeeded = Math.min((pageIndex + 1) * perPage, pool.length);
    const allPicks = weightedRandomSelect(pool, totalNeeded, prng, now);

    const startIdx = pageIndex * perPage;
    return allPicks.slice(startIdx, startIdx + perPage);
}

module.exports = {
    mulberry32,
    weightedRandomSelect,
    selectDiscoveryForPage
};
