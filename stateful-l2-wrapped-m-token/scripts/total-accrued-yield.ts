import 'dotenv/config';
import { getAccruedYield, getCurrentIndex } from './utils';

// Types
type Snapshot = { timestamp: bigint; value: bigint };
type Snapshots = Snapshot[];

if (!process.env.API_SUBGRAPH || !process.env.API_M_ETHEREUM) {
    console.error('Missing API_SUBGRAPH or API_M_ETHEREUM environment variables');
    process.exit(1);
}

// CLI args
const account = (process.argv[2] || '').toLowerCase();

if (!account) {
    console.error('Usage: ts-node total-accrued-yield.ts <account>');
    process.exit(1);
}

// -------- helpers --------

function formatMicroDecimal(_x: bigint | string): string {
    const x = typeof _x === 'string' ? BigInt(_x) : _x;
    const whole = x / 1_000_000n;
    const micro = (x % 1_000_000n).toString().padStart(6, '0');
    return `${whole}.${micro}`;
}

// -------- GQL bodies (split: main vs. rates) --------
function gqlBodyMain(account: string) {
    return JSON.stringify({
        query: `
    {
        holder(id: "holder-${account.toLocaleLowerCase()}") {
            address
            balance
            isEarning
            claimed
            activeCheckpoint {
                timestamp
                balance
                mLatestIndex
                mLatestUpdateTimestamp
            }
        }
        latestIndexSnapshots(orderBy: timestamp, orderDirection: desc, first: 1) {
            timestamp
            value
        }
    }`,
    });
}

function gqlBodyRates() {
    return JSON.stringify({
        query: `
      {
        latestRateSnapshots(orderBy: timestamp, orderDirection: desc, first: 1) {
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
            holder: {
                address: string;
                balance: string;
                isEarning: boolean;
                claimed: bigint;
                activeCheckpoint: {
                    timestamp: bigint;
                    balance: string;
                    mLatestIndex: string;
                    mLatestUpdateTimestamp: string;
                };
            };
            latestIndexSnapshots: Snapshots;
        }>(process.env.API_SUBGRAPH!, gqlBodyMain(account));

        // 2) Fetch rates from a different endpoint
        const rateSnapshots = await fetchGraphQLFromUrl<{ latestRateSnapshots: Snapshots }>(
            process.env.API_M_ETHEREUM!,
            gqlBodyRates()
        );

        const latestRate = rateSnapshots.latestRateSnapshots[0]?.value;

        if (!latestRate || latestRate === 0n) {
            throw new Error(`No rate data available`);
        }

        const indexData = main.latestIndexSnapshots[0];
        if (!indexData) {
            throw new Error(`No index data available`);
        }
        const { value: latestIndex, timestamp: latestTimestamp } = indexData;

        const holder = main.holder;
        if (!holder) {
            throw new Error(`No holder data for account ${account}`);
        }

        if (holder.isEarning === false || !holder.activeCheckpoint) {
            console.log(
                `✨ Account ${account} is not earning yield. Total claimed yield: ${formatMicroDecimal(holder.claimed)}`
            );

            process.exit(0);
        }

        const holderLastCheckpointIndex = getCurrentIndex(
            BigInt(holder.activeCheckpoint.mLatestIndex),
            latestRate,
            BigInt(holder.activeCheckpoint.mLatestUpdateTimestamp),
            holder.activeCheckpoint.timestamp
        );

        const now = BigInt(Math.floor(Date.now() / 1000));

        const unclaimedYield =
            holderLastCheckpointIndex === 0n
                ? 0n
                : getAccruedYield(
                      BigInt(holder.balance),
                      holderLastCheckpointIndex,
                      latestIndex,
                      latestRate,
                      latestTimestamp,
                      now
                  );

        const claimedYield = BigInt(holder.claimed);
        const earnedYield = claimedYield + unclaimedYield;

        console.log(`✨ Account ${account}`);
        console.log(`   - Earned yield: ${formatMicroDecimal(earnedYield)}`);
        console.log(`   - Claimed yield: ${formatMicroDecimal(claimedYield)}`);
        console.log(`   - Unclaimed yield: ${formatMicroDecimal(unclaimedYield)}`);
        console.log(`   - Current balance: ${formatMicroDecimal(holder.balance)}`);
    } catch (err: any) {
        console.error(err?.message ?? err);
        process.exit(1);
    }
})();
