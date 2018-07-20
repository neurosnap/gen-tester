const extraStepsException = () => {
  throw new Error('Too many steps were provided for the generator');
};
const throwsArgMustBeFunction = () => {
  throw new Error('throws param must be function that returns boolean');
};

const THROW = '@@genTester/THROW';
const isObject = (value) => Object == value.constructor;
const isYieldWithReturns = (value) => (
  value
  && isObject(value)
  && value.hasOwnProperty('expected')
  && value.hasOwnProperty('returns')
);
const isThrows = (value) => (
  value
  && isObject(value)
  && value.hasOwnProperty('returns')
  && value.type === THROW
);
const yields = (expected, returns) => ({
  expected,
  returns,
});
const skip = (returns) => yields(null, returns);
const throws = (returns) => ({
  type: THROW,
  returns,
});

function genTester(generator, ...args) {
  const gen = generator.apply(this, args);

  return (...yields) => {
    const steps = [...yields];
    steps.push(null);
    const actual = [];
    const expected = [];
    const numSteps = steps.length;

    const calcResults = (prevValue, value, index) => {
      const onLastStep = numSteps - 1 === index;
      const onExtraStep = numSteps === index;

      let result;
      try {
        result = isThrows(prevValue) ? gen.throw(prevValue.returns) : gen.next(prevValue);
      } catch (err) {
        expected.push(true);

        if (isThrows(value)) {
          if (typeof value.returns !== 'function') {
            throw throwsArgMustBeFunction ();
          }

          actual.push(value.returns(err));
        }

        return;
      }

      const ranOutOfSteps = !result.done && onLastStep
      if (ranOutOfSteps) {
        return;
      }

      const hasNoReturnValue = result.done && typeof result.value === 'undefined';
      if (hasNoReturnValue) {
        return;
      }

      const tooManySteps = result.done && onExtraStep;
      if (tooManySteps) {
        throw extraStepsException();
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

module.exports = { genTester, yields, skip, throws };
