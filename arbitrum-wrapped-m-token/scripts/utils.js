const EXP_SCALED_ONE = 10n ** 12n;
const BPS_SCALED_ONE = 10n ** 4n;
const SECONDS_PER_YEAR = 31_536_000n;

const getBalanceWithYield = (balance, lastIndex, latestIndex, latestRate, latestUpdateTimestamp, timestamp) =>
    balance + getAccruedYield(balance, lastIndex, latestIndex, latestRate, latestUpdateTimestamp, timestamp);

const getAccruedYield = (balance, lastIndex, latestIndex, latestRate, latestUpdateTimestamp, timestamp) => {
    const balanceWithYield = getPresentAmountRoundedDown(
        getPrincipalAmountRoundedDown(balance, lastIndex),
        getCurrentIndex(latestIndex, latestRate, latestUpdateTimestamp, timestamp)
    );

    return balanceWithYield <= balance ? 0n : balanceWithYield - balance;
};

const getCurrentIndex = (latestIndex, latestRate, latestUpdateTimestamp, timestamp) =>
    multiplyIndicesDown(
        latestIndex,
        getContinuousIndex(convertFromBasisPoints(latestRate), timestamp - latestUpdateTimestamp)
    );

const multiplyIndicesDown = (index, deltaIndex) => (index * deltaIndex) / EXP_SCALED_ONE;

const getContinuousIndex = (yearlyRate, time) => exponent((yearlyRate * time) / SECONDS_PER_YEAR);

const exponent = (x) => {
    const x2 = x * x;

    const _84e27 = 84n * 10n ** 27n;
    const _9e3 = 9n * 10n ** 3n;
    const _2e11 = 2n * 10n ** 11n;
    const _1e11 = 10n ** 11n;
    const _42e15 = 42n * 10n ** 15n;
    const _1e9 = 10n ** 9n;
    const _1e12 = 10n ** 12n;

    const additiveTerms = _84e27 + x2 * _9e3 + (x2 / _2e11) * (x2 / _1e11);

    const differentTerms = x * (_42e15 + x2 / _1e9);

    return ((additiveTerms + differentTerms) * _1e12) / (additiveTerms - differentTerms);
};

const convertFromBasisPoints = (rate) => (EXP_SCALED_ONE * rate) / BPS_SCALED_ONE;

const getPresentAmountRoundedDown = (principalAmount, index) => multiplyDown(principalAmount, index);

const getPrincipalAmountRoundedDown = (balance, index) => divideDown(balance, index);

const multiplyDown = (x, index) => (x * index) / EXP_SCALED_ONE;

const divideDown = (x, index) => (x * EXP_SCALED_ONE) / index;

module.exports = {
    getBalanceWithYield,
    getAccruedYield,
};
