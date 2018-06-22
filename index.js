const extraStepsException = () => {
  throw new Error('Too many steps were provided for the generator');
};

function genTester(generator, ...args) {
  const gen = generator.apply(this, args);

  return (yields) => {
    const steps = [...yields];

    steps.push(null); // check for return value

    const results = [];
    const numSteps = steps.length;
    const calcResults = (prevValue, value, index) => {
      const onLastStep = numSteps - 1 === index;
      const result = gen.next(prevValue);

      if (!result.done && onLastStep) {
        return;
      }

      if (result.done && typeof result.value === 'undefined') {
        return;
      }

      results.push(result.value);

      if (result.done && !onLastStep) {
        throw extraStepsException();
      }

      return value;
    };

    steps.reduce(calcResults, null);

    return results;
  }
}

module.exports = genTester;
