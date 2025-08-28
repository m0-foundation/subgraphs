// utils.ts

export const EXP_SCALED_ONE: bigint = 10n ** 12n;
export const BPS_SCALED_ONE: bigint = 10n ** 4n;
export const SECONDS_PER_YEAR: bigint = 31_536_000n;

export function getBalance(
  principal: bigint,
  latestIndex: bigint,
  latestRate: bigint,
  latestUpdateTimestamp: bigint,
  timestamp: bigint
): bigint {
  return getPresentAmountRoundedDown(
    principal,
    getCurrentIndex(latestIndex, latestRate, latestUpdateTimestamp, timestamp)
  );
}

function getCurrentIndex(
  latestIndex: bigint,
  latestRate: bigint,
  latestUpdateTimestamp: bigint,
  timestamp: bigint
): bigint {
  return multiplyIndicesDown(
    latestIndex,
    getContinuousIndex(convertFromBasisPoints(latestRate), timestamp - latestUpdateTimestamp)
  );
}

function multiplyIndicesDown(index: bigint, deltaIndex: bigint): bigint {
  return (index * deltaIndex) / EXP_SCALED_ONE;
}

function getContinuousIndex(yearlyRate: bigint, time: bigint): bigint {
  return exponent((yearlyRate * time) / SECONDS_PER_YEAR);
}

function exponent(x: bigint): bigint {
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
}

function convertFromBasisPoints(rate: bigint): bigint {
  return (EXP_SCALED_ONE * rate) / BPS_SCALED_ONE;
}

function getPresentAmountRoundedDown(principalAmount: bigint, index: bigint): bigint {
  return multiplyDown(principalAmount, index);
}

function multiplyDown(x: bigint, index: bigint): bigint {
  return (x * index) / EXP_SCALED_ONE;
}
