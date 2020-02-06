const diff = require('jest-diff');

const throwsArgMustBeFunction = () => {
  throw new Error('throws param must be function that returns boolean');
};

const FINISHES = '@@genTester/FINISHES';
const THROW = '@@genTester/THROW';
const isObject = (value) => Object == value.constructor;
const isYieldWithReturns = (value) =>
  value &&
  isObject(value) &&
  value.hasOwnProperty('expected') &&
  value.hasOwnProperty('returns');
const isThrows = (value) =>
  value &&
  isObject(value) &&
  value.hasOwnProperty('returns') &&
  value.type === THROW;
const yields = (expected, returns) => ({
  expected,
  returns,
});
const skip = (returns) => yields(null, returns);
const throws = (returns) => ({
  type: THROW,
  returns,
});
const finishes = (expected, returns) => ({
  type: FINISHES,
  expected,
  returns,
});
const shouldBeFinished = (value) =>
  value &&
  isObject(value) &&
  value.hasOwnProperty('type') &&
  value.type === FINISHES;

function genTester(generator, ...args) {
  const gen = generator.apply(this, args);

  return (...yields) => {
    const steps = [...yields];
    steps.push(null); // create null step to check to see if gen is done
    const actual = [];
    const expected = [];
    const numSteps = steps.length;
    let prevDone = false;

    const calcResults = (prevValue, value, index) => {
      const onLastStep = numSteps - 1 === index;

      let result;
      try {
        result = isThrows(prevValue)
          ? gen.throw(prevValue.returns)
          : gen.next(prevValue);
      } catch (err) {
        expected.push(true);

        if (isThrows(value)) {
          if (typeof value.returns !== 'function') {
            throw throwsArgMustBeFunction();
          }

          actual.push(value.returns(err));
        } else {
          throw err;
        }

        return;
      }

      if (prevDone && value) {
        expected.push(value.expected || value);
        return;
      }

      if (result.done) {
        prevDone = true;
      }

      const ranOutOfSteps = !result.done && onLastStep;
      if (ranOutOfSteps) {
        return;
      }

      const tooManySteps = result.done && !onLastStep;
      if (tooManySteps && value.expected && !shouldBeFinished(value)) {
        expected.push(value.expected);
        return;
      }

      const hasNoReturnValue =
        result.done && typeof result.value === 'undefined';
      const hasExpectedValue = value && typeof value.expected !== 'undefined';
      if (hasNoReturnValue) {
        if (hasExpectedValue) {
          expected.push(value.expected);
        }
        return;
      }

      if (shouldBeFinished(value)) {
        if (!result.done) {
          actual.push({ done: false, value: result.value });
          expected.push({ done: true });
          return value;
        }
      }

      if (isYieldWithReturns(value)) {
        expected.push(value.expected);

        const isSkippable = value.expected === null;
        actual.push(isSkippable ? null : result.value);
        return value.returns;
      } else if (isThrows(value)) {
        expected.push(result.value);

        actual.push(result.value);
        return value.returns;
      }

      actual.push(result.value);
      expected.push(value);
      return value;
    };

    steps.reduce(calcResults, null);
    return { actual, expected };
  };
}

function evaluateSteps({ actual, expected, equal, message }) {
  for (let i = 0; i < actual.length; i++) {
    const aitem = actual[i];
    const same = equal(aitem, expected[i]);
    if (!same) {
      const msg = message(actual, expected, i);
      return {
        message: () => msg,
        pass: false,
        actual: aitem,
        expected: expected[i],
      };
    }
  }

  for (let i = 0; i < expected.length; i++) {
    const aitem = actual[i];
    const same = equal(aitem, expected[i]);
    if (!same) {
      const msg = message(actual, expected, i);
      return {
        message: () => msg,
        pass: false,
        actual: aitem,
        expected: expected[i],
      };
    }
  }

  return {
    pass: true,
  };
}

function stepsToBeEqual(received) {
  const { actual, expected } = received;
  const message = (actual, expected, index) => {
    const diffString = diff(expected, actual);
    const diffMsg = `

    Difference:

${diffString}`;

    return `${this.utils.matcherHint('.stepsToBeEqual')}

Expected on step ${index + 1}:
  ${this.utils.printExpected(expected[index])}
Received:
  ${this.utils.printReceived(actual[index])}
${diffString ? diffMsg : ''}
    `;
  };
  return evaluateSteps({ actual, expected, equal: this.equals, message });
}

module.exports = {
  genTester,
  yields,
  skip,
  throws,
  evaluateSteps,
  finishes,
  stepsToBeEqual,
};
