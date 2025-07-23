const https = require('https');
require('dotenv').config();
const { getAccruedYield } = require('./utils');

const account = process.argv[2].toLowerCase();
const mostRecentPeriodEndTimestamp = parseInt(process.argv[3]);
const historicalPeriods = parseInt(process.argv[4]);
const period = parseInt(process.argv[5] ?? 86400);

const computePeriodicYields = (
    balanceSnapshots,
    lastIndexSnapshots,
    claimedSnapshots,
    indexSnapshots,
    updateTimestampSnapshots,
    mostRecentPeriodEndTimestamp,
    historicalPeriods,
    period
) =>
    Array.from({ length: historicalPeriods + 1 }, (_, i) =>
        BigInt(mostRecentPeriodEndTimestamp - (historicalPeriods - i) * period)
    ).reduce(
        (accumulator, timestamp, i) => {
            const balanceIndex = findIndexOfLatest(balanceSnapshots, accumulator.balanceIndex, timestamp);
            const lastIndexIndex = findIndexOfLatest(lastIndexSnapshots, accumulator.lastIndexIndex, timestamp);
            const claimedIndex = findIndexOfLatest(claimedSnapshots, accumulator.claimedIndex, timestamp);
            const indexIndex = findIndexOfLatest(indexSnapshots, accumulator.indexIndex, timestamp);

            const updateTimestampIndex = findIndexOfLatest(
                updateTimestampSnapshots,
                accumulator.updateTimestampIndex,
                timestamp
            );

            // console.log(`Balance for ${timestamp} (${i}): ${balanceSnapshots[balanceIndex]?.value} (${balanceIndex})`);
            // console.log(
            //     `LastIndex for ${timestamp} (${i}): ${lastIndexSnapshots[lastIndexIndex]?.value} (${lastIndexIndex})`
            // );
            // console.log(`Claimed for ${timestamp} (${i}): ${claimedSnapshots[claimedIndex]?.value} (${claimedIndex})`);
            // console.log(`Index for ${timestamp} (${i}): ${indexSnapshots[indexIndex]?.value} (${indexIndex})`);
            // console.log(
            //     `UpdateTimestamp for ${timestamp} (${i}): ${updateTimestampSnapshots[updateTimestampIndex]?.value} (${updateTimestampIndex})`
            // );

            const lastIndex = lastIndexSnapshots[lastIndexIndex]?.value ?? 0n;

            const unclaimedYield =
                lastIndex == 0n
                    ? 0n
                    : getAccruedYield(
                          balanceSnapshots[balanceIndex]?.value ?? 0n,
                          lastIndex,
                          indexSnapshots[indexIndex]?.value ?? 0n,
                          updateTimestampSnapshots[updateTimestampIndex]?.value ?? 0n,
                          BigInt(timestamp)
                      );

            const claimedYield = claimedSnapshots[claimedIndex]?.value ?? 0n;
            const earnedYield = claimedYield + unclaimedYield;

            // console.log(`Unclaimed yield for ${timestamp} (${i}): ${unclaimedYield}`);
            // console.log(`Claimed yield for ${timestamp} (${i}): ${claimedYield}`);

            // console.log(`Earned Yield by ${timestamp} (${i}): ${earnedYield}\n`);

            if (i != 0) {
                accumulator.periodYields.push({ timestamp, yield: earnedYield - accumulator.earnedYield });
            }

            accumulator.earnedYield = earnedYield;

            return {
                balanceIndex: balanceIndex >= 0 ? balanceIndex : 0,
                lastIndexIndex: lastIndexIndex >= 0 ? lastIndexIndex : 0,
                claimedIndex: claimedIndex >= 0 ? claimedIndex : 0,
                indexIndex: indexIndex >= 0 ? indexIndex : 0,
                updateTimestampIndex: updateTimestampIndex >= 0 ? updateTimestampIndex : 0,
                claimedYield,
                unclaimedYield,
                earnedYield,
                periodYields: accumulator.periodYields,
            };
        },
        {
            balanceIndex: 0,
            lastIndexIndex: 0,
            claimedIndex: 0,
            indexIndex: 0,
            updateTimestampIndex: 0,
            claimedYield: 0n,
            unclaimedYield: 0n,
            earnedYield: 0n,
            periodYields: [],
        }
    ).periodYields;

const findIndexOfLatest = (snapshots, startingIndex, timestamp) =>
    startingIndex >= snapshots.length
        ? snapshots.length - 1
        : snapshots[startingIndex].timestamp == timestamp
          ? startingIndex
          : snapshots[startingIndex].timestamp > timestamp
            ? startingIndex - 1
            : findIndexOfLatest(snapshots, startingIndex + 1, timestamp);

const safeEarlyTimestamp = mostRecentPeriodEndTimestamp - historicalPeriods * period - 3 * 86400;

// console.log(`Safe Early Timestamp: ${safeEarlyTimestamp}\n`);

const data = JSON.stringify({
    query: `
    {
        balanceSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        lastIndexSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        claimedSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        latestIndexSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        latestUpdateTimestampSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
    }
    `,
});

const options = {
    hostname: process.env.API_ENDPOINT,
    path: process.env.API_PATH,
    port: 443,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Node',
    },
};

const req = https.request(options, (res) => {
    let data = '';
    // console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
        data += d;
    });

    res.on('end', () => {
        // console.log(JSON.parse(data).data);

        const {
            balanceSnapshots,
            lastIndexSnapshots,
            claimedSnapshots,
            latestIndexSnapshots,
            latestUpdateTimestampSnapshots,
        } = JSON.parse(data, (key, value) => (key == 'timestamp' || key == 'value' ? BigInt(value) : value)).data;

        const periodYields = computePeriodicYields(
            balanceSnapshots,
            lastIndexSnapshots,
            claimedSnapshots,
            latestIndexSnapshots,
            latestUpdateTimestampSnapshots,
            mostRecentPeriodEndTimestamp,
            historicalPeriods,
            period
        );

        console.log(
            periodYields
                .map(
                    ({ timestamp, yield }) =>
                        `${timestamp},${yield / 1_000_000n}.${(yield % 1_000_000n).toString().padStart(6, '0')}`
                )
                .join('\n')
        );
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
