const https = require('https');
require('dotenv').config();
const { getBalance } = require('./utils');

const account = process.argv[2].toLowerCase();
const mostRecentPeriodEndTimestamp = parseInt(process.argv[3]);
const historicalPeriods = parseInt(process.argv[4]);
const period = parseInt(process.argv[5] ?? 86400);

const computePeriodicYields = (
    sentSnapshots,
    receivedSnapshots,
    nonEarningBalanceSnapshots,
    earningPrincipalSnapshots,
    indexSnapshots,
    rateSnapshots,
    updateTimestampSnapshots,
    mostRecentPeriodEndTimestamp,
    historicalPeriods,
    period
) =>
    Array.from({ length: historicalPeriods + 1 }, (_, i) =>
        BigInt(mostRecentPeriodEndTimestamp - (historicalPeriods - i) * period)
    ).reduce(
        (accumulator, timestamp, i) => {
            const sentIndex = findIndexOfLatest(sentSnapshots, accumulator.sentIndex, timestamp);
            const receivedIndex = findIndexOfLatest(receivedSnapshots, accumulator.receivedIndex, timestamp);

            const nonEarningBalanceIndex = findIndexOfLatest(
                nonEarningBalanceSnapshots,
                accumulator.nonEarningBalanceIndex,
                timestamp
            );

            const earningPrincipalIndex = findIndexOfLatest(
                earningPrincipalSnapshots,
                accumulator.earningPrincipalIndex,
                timestamp
            );

            const indexIndex = findIndexOfLatest(indexSnapshots, accumulator.indexIndex, timestamp);
            const rateIndex = findIndexOfLatest(rateSnapshots, accumulator.rateIndex, timestamp);

            const updateTimestampIndex = findIndexOfLatest(
                updateTimestampSnapshots,
                accumulator.updateTimestampIndex,
                timestamp
            );

            // console.log(`sentIndex for ${timestamp} (${i}): ${sentIndex}`);
            // console.log(`receivedIndex for ${timestamp} (${i}): ${receivedIndex}`);
            // console.log(`nonEarningBalanceIndex for ${timestamp} (${i}): ${nonEarningBalanceIndex}`);
            // console.log(`earningPrincipalIndex for ${timestamp} (${i}): ${earningPrincipalIndex}`);
            // console.log(`indexIndex for ${timestamp} (${i}): ${indexIndex}`);
            // console.log(`rateIndex for ${timestamp} (${i}): ${rateIndex}`);
            // console.log(`updateTimestampIndex for ${timestamp} (${i}): ${updateTimestampIndex}`);

            const earningPrincipal = earningPrincipalSnapshots[earningPrincipalIndex]?.value ?? 0n;

            const balance =
                earningPrincipal == 0n
                    ? (nonEarningBalanceSnapshots[nonEarningBalanceIndex]?.value ?? 0n)
                    : getBalance(
                          earningPrincipal,
                          indexSnapshots[indexIndex]?.value ?? 0n,
                          rateSnapshots[rateIndex]?.value ?? 0n,
                          updateTimestampSnapshots[updateTimestampIndex]?.value ?? 0n,
                          BigInt(timestamp)
                      );

            const earnedYield =
                balance + (sentSnapshots[sentIndex]?.value ?? 0n) - (receivedSnapshots[receivedIndex]?.value ?? 0n);

            // console.log(`Earned Yield by ${timestamp} (${i}): ${earnedYield}\n`);

            if (i != 0) {
                accumulator.periodYields.push({ timestamp, yield: earnedYield - accumulator.earnedYield });
            }

            accumulator.earnedYield = earnedYield;

            return {
                sentIndex: sentIndex >= 0 ? sentIndex : 0,
                receivedIndex: receivedIndex >= 0 ? receivedIndex : 0,
                nonEarningBalanceIndex: nonEarningBalanceIndex >= 0 ? nonEarningBalanceIndex : 0,
                earningPrincipalIndex: earningPrincipalIndex >= 0 ? earningPrincipalIndex : 0,
                rateIndex: rateIndex >= 0 ? rateIndex : 0,
                indexIndex: indexIndex >= 0 ? indexIndex : 0,
                updateTimestampIndex: updateTimestampIndex >= 0 ? updateTimestampIndex : 0,
                earnedYield,
                periodYields: accumulator.periodYields,
            };
        },
        {
            sentIndex: 0,
            receivedIndex: 0,
            nonEarningBalanceIndex: 0,
            earningPrincipalIndex: 0,
            rateIndex: 0,
            indexIndex: 0,
            updateTimestampIndex: 0,
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

const safeEarlyTimestamp = mostRecentPeriodEndTimestamp - (historicalPeriods * period) - (3 * 86400);

// console.log(`Safe Early Timestamp: ${safeEarlyTimestamp}\n`);

const data = JSON.stringify({
    query: `
    {
        sentSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        receivedSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        nonEarningBalanceSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        earningPrincipalSnapshots(where: {account: "holder-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        latestIndexSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        latestRateSnapshots(where: {timestamp_gte: "${safeEarlyTimestamp}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
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
            sentSnapshots,
            receivedSnapshots,
            nonEarningBalanceSnapshots,
            earningPrincipalSnapshots,
            latestIndexSnapshots,
            latestRateSnapshots,
            latestUpdateTimestampSnapshots,
        } = JSON.parse(data, (key, value) => (key == 'timestamp' || key == 'value' ? BigInt(value) : value)).data;

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
