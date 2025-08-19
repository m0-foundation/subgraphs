// computeYields.ts
import 'dotenv/config';
import { getBalance } from './utils';

type Snapshot = { timestamp: bigint; value: bigint };
type Snapshots = Snapshot[];

const account = (process.argv[2] || '').toLowerCase();
const mostRecentPeriodEndTimestamp = BigInt(parseInt(process.argv[3] || '0', 10));
const historicalPeriods = parseInt(process.argv[4] || '0', 10);
const period = BigInt(parseInt(process.argv[5] ?? '86400', 10)); // default 1 day (secs -> bigint)

if (!account || mostRecentPeriodEndTimestamp === 0n || Number.isNaN(historicalPeriods)) {
  console.error('Usage: ts-node computeYields.ts <account> <mostRecentEndTs> <historicalPeriods> [periodSeconds]');
  process.exit(1);
}

const safeEarlyTimestamp = Number(mostRecentPeriodEndTimestamp - BigInt(historicalPeriods) * period) - 3 * 86400; // for GraphQL filter (number OK)

function findIndexOfLatest(snapshots: Snapshots, startingIndex: number, targetTs: bigint): number {
  // Guard empty
  if (snapshots.length === 0) return -1;

  // Fast path: clamp starting index
  let lo = Math.max(0, Math.min(startingIndex, snapshots.length - 1));
  // Expand window if needed
  if (snapshots[lo]!.timestamp <= targetTs) {
    // move forward while <= targetTs
    while (lo + 1 < snapshots.length && snapshots[lo + 1]!.timestamp <= targetTs) lo++;
    return lo;
  } else {
    // move backward until <= targetTs (could be -1)
    while (lo >= 0 && snapshots[lo]!.timestamp > targetTs) lo--;
    return lo;
  }
}

function computePeriodicYields(
  sentSnapshots: Snapshots,
  receivedSnapshots: Snapshots,
  nonEarningBalanceSnapshots: Snapshots,
  earningPrincipalSnapshots: Snapshots,
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
    sentIndex: 0,
    receivedIndex: 0,
    nonEarningBalanceIndex: 0,
    earningPrincipalIndex: 0,
    rateIndex: 0,
    indexIndex: 0,
    updateTimestampIndex: 0,
    earnedYield: 0n,
    periodYields: [] as { timestamp: bigint; yield: bigint }[],
  };

  checkpoints.forEach((timestamp, i) => {
    const sentIndex = findIndexOfLatest(sentSnapshots, acc.sentIndex, timestamp);
    const receivedIndex = findIndexOfLatest(receivedSnapshots, acc.receivedIndex, timestamp);

    const nonEarningBalanceIndex = findIndexOfLatest(nonEarningBalanceSnapshots, acc.nonEarningBalanceIndex, timestamp);
    const earningPrincipalIndex = findIndexOfLatest(earningPrincipalSnapshots, acc.earningPrincipalIndex, timestamp);

    const indexIndex = findIndexOfLatest(indexSnapshots, acc.indexIndex, timestamp);
    const rateIndex = findIndexOfLatest(rateSnapshots, acc.rateIndex, timestamp);
    const updateTimestampIndex = findIndexOfLatest(updateTimestampSnapshots, acc.updateTimestampIndex, timestamp);

    const earningPrincipal = earningPrincipalSnapshots[earningPrincipalIndex]?.value ?? 0n;

    const balance =
      earningPrincipal === 0n
        ? (nonEarningBalanceSnapshots[nonEarningBalanceIndex]?.value ?? 0n)
        : getBalance(
            earningPrincipal,
            indexSnapshots[indexIndex]?.value ?? 0n,
            rateSnapshots[rateIndex]?.value ?? 0n,
            updateTimestampSnapshots[updateTimestampIndex]?.value ?? 0n,
            timestamp
          );

    const earnedYield =
      balance + (sentSnapshots[sentIndex]?.value ?? 0n) - (receivedSnapshots[receivedIndex]?.value ?? 0n);

    if (i !== 0) {
      acc.periodYields.push({ timestamp, yield: earnedYield - acc.earnedYield });
    }

    acc.sentIndex = Math.max(0, sentIndex);
    acc.receivedIndex = Math.max(0, receivedIndex);
    acc.nonEarningBalanceIndex = Math.max(0, nonEarningBalanceIndex);
    acc.earningPrincipalIndex = Math.max(0, earningPrincipalIndex);
    acc.indexIndex = Math.max(0, indexIndex);
    acc.rateIndex = Math.max(0, rateIndex);
    acc.updateTimestampIndex = Math.max(0, updateTimestampIndex);
    acc.earnedYield = earnedYield;
  });

  return acc.periodYields;
}

function gqlBody(account: string, safeEarlyTimestamp: number) {
  return JSON.stringify({
    query: `
      {
        sentSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        receivedSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        nonEarningBalanceSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        earningPrincipalSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        latestIndexSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        latestRateSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
        latestUpdateTimestampSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
      }
    `,
  });
}

async function fetchGraphQL(body: string) {
  const host = process.env.API_ENDPOINT;
  const path = process.env.API_PATH;
  if (!host || !path) {
    throw new Error('Missing API_ENDPOINT or API_PATH in env');
  }
  const url = `https://${host}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Node',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GraphQL error ${res.status}: ${text}`);
  }
  const text = await res.text();
  // revive BigInts for timestamp/value fields
  const json = JSON.parse(text, (key, value) => (key === 'timestamp' || key === 'value' ? BigInt(value) : value));
  return json.data as {
    sentSnapshots: Snapshots;
    receivedSnapshots: Snapshots;
    nonEarningBalanceSnapshots: Snapshots;
    earningPrincipalSnapshots: Snapshots;
    latestIndexSnapshots: Snapshots;
    latestRateSnapshots: Snapshots;
    latestUpdateTimestampSnapshots: Snapshots;
  };
}

function formatMicroDecimal(x: bigint): string {
  const whole = x / 1_000_000n;
  const micro = (x % 1_000_000n).toString().padStart(6, '0');
  return `${whole}.${micro}`;
}

(async function main() {
  try {
    const body = gqlBody(account, safeEarlyTimestamp);
    const {
      sentSnapshots,
      receivedSnapshots,
      nonEarningBalanceSnapshots,
      earningPrincipalSnapshots,
      latestIndexSnapshots,
      latestRateSnapshots,
      latestUpdateTimestampSnapshots,
    } = await fetchGraphQL(body);

    const periodYields = computePeriodicYields(
      sentSnapshots,
      receivedSnapshots,
      nonEarningBalanceSnapshots,
      earningPrincipalSnapshots,
      latestIndexSnapshots,
      latestRateSnapshots,
      latestUpdateTimestampSnapshots,
      mostRecentPeriodEndTimestamp,
      historicalPeriods,
      period
    );

    const csv = periodYields.map(({ timestamp, yield: y }) => `${timestamp},${formatMicroDecimal(y)}`).join('\n');
    console.log(csv);
    console.log(``);
    console.log(`Total yield: ${formatMicroDecimal(periodYields.reduce((acc, { yield: y }) => acc + y, 0n))}`);
  } catch (err: any) {
    console.error(err?.message ?? err);
    process.exit(1);
  }
})();
