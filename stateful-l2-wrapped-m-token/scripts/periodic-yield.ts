import 'dotenv/config';
import { getAccruedYield, getCurrentIndex } from './utils';

// Types
type Snapshot = { timestamp: bigint; value: bigint };
type Snapshots = Snapshot[];
type CheckpointSnapshots = {
    timestamp: bigint;
    balance: string;
    mLatestIndex: string;
    mLatestUpdateTimestamp: string;
}[];

if (!process.env.API_SUBGRAPH || !process.env.API_M_ETHEREUM) {
    console.error('Missing API_SUBGRAPH or API_M_ETHEREUM environment variables');
    process.exit(1);
}

// CLI args
const account = (process.argv[2] || '').toLowerCase();
const mostRecentPeriodEndTimestamp = BigInt(parseInt(process.argv[3] || '0', 10));
const historicalPeriods = parseInt(process.argv[4] || '0', 10);
const period = BigInt(parseInt(process.argv[5] ?? '86400', 10)); // default 1 day in seconds

if (!account || mostRecentPeriodEndTimestamp === 0n || Number.isNaN(historicalPeriods)) {
    console.error('Usage: ts-node periodict-yield.ts <account> <mostRecentEndTs> <historicalPeriods> [periodSeconds]');
    process.exit(1);
}

// For the GQL filter; use number because it’s interpolated as a string in query
const safeEarlyTimestamp = Number(mostRecentPeriodEndTimestamp - BigInt(historicalPeriods) * period) - 3 * 86400;

// -------- helpers --------
function findIndexOfLatest(snapshots: { timestamp: bigint }[], startingIndex: number, targetTs: bigint): number {
    if (snapshots.length === 0) return -1;
    let i = Math.max(0, Math.min(startingIndex, snapshots.length - 1));
    if (snapshots[i]!.timestamp <= targetTs) {
        while (i + 1 < snapshots.length && snapshots[i + 1]!.timestamp <= targetTs) i++;
        return i;
    } else {
        while (i >= 0 && snapshots[i]!.timestamp > targetTs) i--;
        return i;
    }
}

function formatMicroDecimal(x: bigint): string {
    const whole = x / 1_000_000n;
    const micro = (x % 1_000_000n).toString().padStart(6, '0');
    return `${whole}.${micro}`;
}

// -------- Core logic --------
function computePeriodicYields(
    balanceSnapshots: Snapshots,
    checkpointSnapshots: CheckpointSnapshots,
    claimedSnapshots: Snapshots,
    indexSnapshots: Snapshots,
    rateSnapshots: Snapshots,
    updateTimestampSnapshots: Snapshots,
    mostRecentPeriodEndTimestamp: bigint,
    historicalPeriods: number,
    period: bigint
) {
    const checkpoints: bigint[] = Array.from(
        { length: historicalPeriods + 1 },
        (_, i) => mostRecentPeriodEndTimestamp - BigInt(historicalPeriods - i) * period
    );

    const acc = {
        balanceIndex: 0,
        checkpointIndex: 0,
        claimedIndex: 0,
        rateIndex: 0,
        indexIndex: 0,
        updateTimestampIndex: 0,
        claimedYield: 0n,
        unclaimedYield: 0n,
        earnedYield: 0n,
        periodYields: [] as { timestamp: bigint; yield: bigint }[],
    };

    checkpoints.forEach((timestamp, i) => {
        const balanceIndex = findIndexOfLatest(balanceSnapshots, acc.balanceIndex, timestamp);
        const claimedIndex = findIndexOfLatest(claimedSnapshots, acc.claimedIndex, timestamp);
        const indexIndex = findIndexOfLatest(indexSnapshots, acc.indexIndex, timestamp);
        const rateIndex = findIndexOfLatest(rateSnapshots, acc.rateIndex, timestamp);
        const updateTimestampIndex = findIndexOfLatest(updateTimestampSnapshots, acc.updateTimestampIndex, timestamp);
        const checkpointIndex = findIndexOfLatest(checkpointSnapshots, acc.checkpointIndex, timestamp);

        const { value: latestIndex, timestamp: latestTimestamp } = indexSnapshots[indexIndex] ?? {
            value: 0n,
            timestamp: 0n,
        };
        const latestRate = rateSnapshots[rateIndex]?.value ?? 0n;

        // Get the last checkpoint index for the holder
        const checkpoint = checkpointSnapshots[checkpointIndex];
        if (!checkpoint) {
            throw new Error(`No checkpoint found at timestamp ${timestamp}`);
        }
        const holderLastCheckpointIndex = getCurrentIndex(
            BigInt(checkpoint.mLatestIndex),
            latestRate,
            BigInt(checkpoint.mLatestUpdateTimestamp),
            checkpoint.timestamp
        );

        // console.log({
        //     timestamp,
        //     latestIndex,
        //     latestRate,
        //     latestTimestamp,
        //     checkpoint,
        //     derivedIndex: holderLastCheckpointIndex,
        // });

        const unclaimedYield =
            holderLastCheckpointIndex === 0n
                ? 0n
                : getAccruedYield(
                      balanceSnapshots[balanceIndex]?.value ?? 0n,
                      holderLastCheckpointIndex,
                      latestIndex,
                      latestRate,
                      latestTimestamp,
                      timestamp
                  );

        const claimedYield = claimedSnapshots[claimedIndex]?.value ?? 0n;
        const earnedYield = claimedYield + unclaimedYield;

        if (i !== 0) {
            acc.periodYields.push({ timestamp, yield: earnedYield - acc.earnedYield });
        }

        acc.balanceIndex = Math.max(0, balanceIndex);
        acc.checkpointIndex = Math.max(0, checkpointIndex);
        acc.claimedIndex = Math.max(0, claimedIndex);
        acc.indexIndex = Math.max(0, indexIndex);
        acc.rateIndex = Math.max(0, rateIndex);
        acc.updateTimestampIndex = Math.max(0, updateTimestampIndex);
        acc.claimedYield = claimedYield;
        acc.unclaimedYield = unclaimedYield;
        acc.earnedYield = earnedYield;
    });

    return acc.periodYields;
}

// -------- GQL bodies (split: main vs. rates) --------
function gqlBodyMain(account: string, safeEarlyTimestamp: number) {
    return JSON.stringify({
        query: `
      {
        balanceSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
          timestamp
          value
        }
        checkpointSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
            timestamp
            balance
            mLatestIndex
            mLatestUpdateTimestamp
        }
        claimedSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
          timestamp
          value
        }
        latestIndexSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
          timestamp
          value
        }
        latestUpdateTimestampSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
          timestamp
          value
        }
      }
    `,
    });
}

function gqlBodyRates(safeEarlyTimestamp: number) {
    return JSON.stringify({
        query: `
      {
        latestRateSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 10000) {
          timestamp
          value
        }
      }
    `,
    });
}

// -------- Fetch helpers --------
async function fetchGraphQLFromUrl<T = any>(url: string, body: string): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'user-agent': 'Node' },
        body,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GraphQL error ${res.status}: ${text}`);
    }
    const text = await res.text();
    return JSON.parse(text, (k, v) => (k === 'timestamp' || k === 'value' ? BigInt(v) : v)).data as T;
}

// -------- Run --------
(async function main() {
    try {
        // 1) Fetch main payload (no rates)
        const main = await fetchGraphQLFromUrl<{
            balanceSnapshots: Snapshots;
            checkpointSnapshots: CheckpointSnapshots;
            claimedSnapshots: Snapshots;
            latestIndexSnapshots: Snapshots;
            latestUpdateTimestampSnapshots: Snapshots;
        }>(process.env.API_SUBGRAPH!, gqlBodyMain(account, safeEarlyTimestamp));

        // 2) Fetch rates from a different endpoint
        const rates = await fetchGraphQLFromUrl<{ latestRateSnapshots: Snapshots }>(
            process.env.API_M_ETHEREUM!,
            gqlBodyRates(safeEarlyTimestamp)
        );

        const periodYields = computePeriodicYields(
            main.balanceSnapshots,
            main.checkpointSnapshots,
            main.claimedSnapshots,
            main.latestIndexSnapshots,
            rates.latestRateSnapshots, // from secondary endpoint
            main.latestUpdateTimestampSnapshots,
            mostRecentPeriodEndTimestamp,
            historicalPeriods,
            period
        );

        const csv = periodYields.map(({ timestamp, yield: y }) => `${timestamp},${formatMicroDecimal(y)}`).join('\n');
        console.log(csv);

        console.log(
            `Total accrued yield: ${formatMicroDecimal(periodYields.reduce((sum, { yield: y }) => sum + y, 0n))}`
        );
    } catch (err: any) {
        console.error(err?.message ?? err);
        process.exit(1);
    }
})();
