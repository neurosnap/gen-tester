const extraStepsException = () => {
  throw new Error('Too many steps were provided for the generator');
};

const isObject = (value) => Object == value.constructor;
const isYieldWithReturns = (value) => (
  isObject(value)
  && value.hasOwnProperty('expected')
  && value.hasOwnProperty('returns')
);
const yields = (expected, returns) => ({
  expected,
  returns,
});
const skip = (returns) => yields(null, returns);

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
      const result = gen.next(prevValue);

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
      }

      actual.push(result.value);
      expected.push(value);
      return value;
    };

    steps.reduce(calcResults, null);
    return { actual, expected };
  };
}

module.exports = { genTester, yields, skip };
