const extraStepsException = () => {
  throw new Error('Too many steps were provided for the generator');
};

function genTester({ generator, args = [], yields = [], shouldReturn = true }) {
  const gen = generator(...args);
  const steps = [...yields];

  if (shouldReturn) {
    steps.push(null);
  }

  const results = [];
  const numSteps = steps.length;
  steps.reduce((prevValue, value, index) => {
    const onLastStep = numSteps - 1 === index;
    const result = gen.next(prevValue);
    results.push(result.value);

    if (result.done && !onLastStep) {
      throw extraStepsException();
    }

    return value;
  }, null);

  return results;
}

module.exports = genTester;
