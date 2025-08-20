import 'dotenv/config';
import { getBalance } from './utils';

type Snapshot = { timestamp: bigint; value: bigint };
type Snapshots = Snapshot[];

const account = (process.argv[2] || '').toLowerCase();
const mostRecentPeriodEndTimestamp = BigInt(parseInt(process.argv[3] || '0', 10));
const historicalPeriods = parseInt(process.argv[4] || '0', 10);
const period = BigInt(parseInt(process.argv[5] ?? '86400', 10));

if (!process.env.API_SUBGRAPH || !process.env.API_M_ETHEREUM) {
  console.error('Missing API_SUBGRAPH or API_M_ETHEREUM environment variables');
  process.exit(1);
}

const safeEarlyTimestamp = Number(mostRecentPeriodEndTimestamp - BigInt(historicalPeriods) * period) - 3 * 86400;

function findIndexOfLatest(snapshots: Snapshots, startingIndex: number, targetTs: bigint): number {
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

    if (i !== 0) acc.periodYields.push({ timestamp, yield: earnedYield - acc.earnedYield });

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

// ---------- GQL bodies ----------
function gqlBodyMain(account: string, safeEarlyTimestamp: number) {
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
        latestUpdateTimestampSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
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
        latestRateSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
          timestamp
          value
        }
      }
    `,
  });
}

// ---------- Fetch helpers ----------
async function fetchGraphQLFromUrl(url: string, body: string) {
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
  return JSON.parse(text, (k, v) => (k === 'timestamp' || k === 'value' ? BigInt(v) : v)).data;
}

function formatMicroDecimal(x: bigint): string {
  const whole = x / 1_000_000n;
  const micro = (x % 1_000_000n).toString().padStart(6, '0');
  return `${whole}.${micro}`;
}

(async function main() {
  try {
    // 1) Main snapshots this subgraph on spoke/L2 network
    const mainData: {
      sentSnapshots: Snapshots;
      receivedSnapshots: Snapshots;
      nonEarningBalanceSnapshots: Snapshots;
      earningPrincipalSnapshots: Snapshots;
      latestIndexSnapshots: Snapshots;
      latestUpdateTimestampSnapshots: Snapshots;
    } = await fetchGraphQLFromUrl(process.env.API_SUBGRAPH!, gqlBodyMain(account, safeEarlyTimestamp));

    // 2) Spoke/L2s do not push rates, so we fetch them from the mainnet subgraph.
    const rateData: { latestRateSnapshots: Snapshots } = await fetchGraphQLFromUrl(
      process.env.API_M_ETHEREUM!,
      gqlBodyRates(safeEarlyTimestamp)
    );

    const periodYields = computePeriodicYields(
      mainData.sentSnapshots,
      mainData.receivedSnapshots,
      mainData.nonEarningBalanceSnapshots,
      mainData.earningPrincipalSnapshots,
      mainData.latestIndexSnapshots,
      rateData.latestRateSnapshots,
      mainData.latestUpdateTimestampSnapshots,
      mostRecentPeriodEndTimestamp,
      historicalPeriods,
      period
    );

    console.log(periodYields.map(({ timestamp, yield: y }) => `${timestamp},${formatMicroDecimal(y)}`).join('\n'));
  } catch (err: any) {
    console.error(err?.message ?? err);
    process.exit(1);
  }
})();
