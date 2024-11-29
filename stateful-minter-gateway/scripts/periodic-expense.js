const https = require('https');
require('dotenv').config();
const { getOwedM } = require('./utils');

const account = process.argv[2].toLowerCase();
const mostRecentPeriodEndTimestamp = parseInt(process.argv[3]);
const historicalPeriods = parseInt(process.argv[4]);
const period = parseInt(process.argv[5] ?? 86400);

const computePeriodicExpenses = (
    burnedSnapshots,
    mintedSnapshots,
    inactiveOwedMSnapshots,
    principalOfActiveOwedMSnapshots,
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
            const burnedIndex = findIndexOfLatest(burnedSnapshots, accumulator.burnedIndex, timestamp);
            const mintedIndex = findIndexOfLatest(mintedSnapshots, accumulator.mintedIndex, timestamp);

            const inactiveOwedMIndex = findIndexOfLatest(
                inactiveOwedMSnapshots,
                accumulator.inactiveOwedMIndex,
                timestamp
            );

            const principalOfActiveOwedMIndex = findIndexOfLatest(
                principalOfActiveOwedMSnapshots,
                accumulator.principalOfActiveOwedMIndex,
                timestamp
            );

            const indexIndex = findIndexOfLatest(indexSnapshots, accumulator.indexIndex, timestamp);
            const rateIndex = findIndexOfLatest(rateSnapshots, accumulator.rateIndex, timestamp);

            const updateTimestampIndex = findIndexOfLatest(
                updateTimestampSnapshots,
                accumulator.updateTimestampIndex,
                timestamp
            );

            // console.log(`burnedIndex for ${timestamp} (${i}): ${burnedIndex}`);
            // console.log(`mintedIndex for ${timestamp} (${i}): ${mintedIndex}`);
            // console.log(`inactiveOwedMIndex for ${timestamp} (${i}): ${inactiveOwedMIndex}`);
            // console.log(`principalOfActiveOwedMIndex for ${timestamp} (${i}): ${principalOfActiveOwedMIndex}`);
            // console.log(`indexIndex for ${timestamp} (${i}): ${indexIndex}`);
            // console.log(`rateIndex for ${timestamp} (${i}): ${rateIndex}`);
            // console.log(`updateTimestampIndex for ${timestamp} (${i}): ${updateTimestampIndex}`);

            const principalOfActiveOwedM = principalOfActiveOwedMSnapshots[principalOfActiveOwedMIndex]?.value ?? 0n;

            const owedM =
                principalOfActiveOwedM == 0n
                    ? (inactiveOwedMSnapshots[inactiveOwedMIndex]?.value ?? 0n)
                    : getOwedM(
                          principalOfActiveOwedM,
                          indexSnapshots[indexIndex]?.value ?? 0n,
                          rateSnapshots[rateIndex]?.value ?? 0n,
                          updateTimestampSnapshots[updateTimestampIndex]?.value ?? 0n,
                          BigInt(timestamp)
                      );

            const incurredExpense =
                owedM + (burnedSnapshots[burnedIndex]?.value ?? 0n) - (mintedSnapshots[mintedIndex]?.value ?? 0n);

            // console.log(`Incurred Expense by ${timestamp} (${i}): ${incurredExpense}\n`);

            if (i != 0) {
                accumulator.periodExpenses.push({ timestamp, expense: incurredExpense - accumulator.incurredExpense });
            }

            accumulator.incurredExpense = incurredExpense;

            return {
                burnedIndex: burnedIndex >= 0 ? burnedIndex : 0,
                mintedIndex: mintedIndex >= 0 ? mintedIndex : 0,
                inactiveOwedMIndex: inactiveOwedMIndex >= 0 ? inactiveOwedMIndex : 0,
                principalOfActiveOwedMIndex: principalOfActiveOwedMIndex >= 0 ? principalOfActiveOwedMIndex : 0,
                rateIndex: rateIndex >= 0 ? rateIndex : 0,
                indexIndex: indexIndex >= 0 ? indexIndex : 0,
                updateTimestampIndex: updateTimestampIndex >= 0 ? updateTimestampIndex : 0,
                incurredExpense,
                periodExpenses: accumulator.periodExpenses,
            };
        },
        {
            burnedIndex: 0,
            mintedIndex: 0,
            inactiveOwedMIndex: 0,
            principalOfActiveOwedMIndex: 0,
            rateIndex: 0,
            indexIndex: 0,
            updateTimestampIndex: 0,
            incurredExpense: 0n,
            periodExpenses: [],
        }
    ).periodExpenses;

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
        burnedSnapshots(where: {minter: "minter-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        mintedSnapshots(where: {minter: "minter-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        inactiveOwedMSnapshots(where: {minter: "minter-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
            timestamp,
            value
        }
        principalOfActiveOwedMSnapshots(where: {minter: "minter-${account}"}, orderBy: timestamp, orderDirection: asc, first: 1000) {
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
            burnedSnapshots,
            mintedSnapshots,
            inactiveOwedMSnapshots,
            principalOfActiveOwedMSnapshots,
            latestIndexSnapshots,
            latestRateSnapshots,
            latestUpdateTimestampSnapshots,
        } = JSON.parse(data, (key, value) => (key == 'timestamp' || key == 'value' ? BigInt(value) : value)).data;

        const periodExpenses = computePeriodicExpenses(
            burnedSnapshots,
            mintedSnapshots,
            inactiveOwedMSnapshots,
            principalOfActiveOwedMSnapshots,
            latestIndexSnapshots,
            latestRateSnapshots,
            latestUpdateTimestampSnapshots,
            mostRecentPeriodEndTimestamp,
            historicalPeriods,
            period
        );

        console.log(
            periodExpenses
                .map(
                    ({ timestamp, expense }) =>
                        `${timestamp},${expense / 1_000_000n}.${(expense % 1_000_000n).toString().padStart(6, '0')}`
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
