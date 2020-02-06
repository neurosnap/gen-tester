const test = require('tape');
const diff = require('jest-diff');
const {
  genTester,
  yields,
  skip,
  throws,
  evaluateSteps,
  finishes,
} = require('.');
const deepEqual = require('fast-deep-equal');

test('generator with no return value, only checking first 2 yields', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    yield 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2);

  t.deepEqual(actual, expected);
});

test('generator with arguments', (t) => {
  t.plan(1);

  function* fn(one) {
    yield one;
    yield 2;
    yield 1;
  }

  const tester = genTester(fn, 3);
  const { actual, expected } = tester(3, 2, 1);

  t.deepEqual(actual, expected);
});

test('generator with return value', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2, 3);

  t.deepEqual(actual, expected);
});

test('generator mocking yield response values', (t) => {
  t.plan(1);

  function* fn() {
    const val = yield 1;
    yield val + 2;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(yields(1, 3), 5);

  t.deepEqual(actual, expected);
});

test('generator with skipping yield', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(skip(), 2, 3);

  t.deepEqual(actual, expected);
});

test('evaluateSteps failure', (t) => {
  t.plan(4);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(skip(), 4, 3);
  const message = (actual, expected, i) => {
    return `error on step ${i + 1}, actual and expected are not the same`;
  };
  const result = evaluateSteps({ actual, expected, equal: deepEqual, message });
  t.equal(result.pass, false);
  t.equal(result.actual, 2);
  t.equal(result.expected, 4);
  t.equal(
    result.message(),
    'error on step 2, actual and expected are not the same',
  );
});

test('evaluateSteps success', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(skip(), 2, 3);

  const result = evaluateSteps({ actual, expected, equal: deepEqual });
  t.equal(result.pass, true);
});

test('generator not finished', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1);
  t.deepEqual(actual, expected);
});

test('generator not finished with finishes', (t) => {
  t.plan(2);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(finishes(1));
  t.deepEqual(actual, [{ done: false, value: 1 }]);
  t.deepEqual(expected, [{ done: true }]);
});

test('generator finished with finishes', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2, finishes(3));
  t.deepEqual(actual, expected);
});

test('generator finished with finishes but wrong value', (t) => {
  t.plan(2);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2, finishes(4));
  t.deepEqual(actual, [1, 2, 3]);
  t.deepEqual(expected, [1, 2, 4]);
});

test('generator finished with expectations after finish', (t) => {
  t.plan(2);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2, finishes(3), 4);
  t.deepEqual(actual, [1, 2, 3]);
  t.deepEqual(expected, [1, 2, 3, 4]);
});

test('generator finished with finishes but no return value', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(1, 2, finishes());
  t.deepEqual(actual, expected);
});

test('generator with skipping yield that still returns a value', (t) => {
  t.plan(1);

  function* fn() {
    const val = yield 1;
    yield val + 2;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(skip(3), 5);

  t.deepEqual(actual, expected);
});

test('generator should finish without return value', (t) => {
  t.plan(1);

  function* test(fn) {
    yield 1;
    fn();
  }

  const fn = () => t.pass('should call this function');
  const tester = genTester(test, fn);
  tester(skip());
});

test('generator that yields an exception', (t) => {
  t.plan(1);

  function* test() {
    let value = 1;
    try {
      yield 1;
    } catch (err) {
      value = 2;
      yield err + ' handled';
    }

    return value;
  }

  const tester = genTester(test);
  const { actual, expected } = tester(
    yields(1, throws('ERROR')),
    yields('ERROR handled'),
    2,
  );
  t.deepEqual(actual, expected);
});

test('generator that throws an exception', (t) => {
  t.plan(1);

  function* test() {
    let value = 1;
    try {
      yield 1;
    } catch (err) {
      value = 2;
      throw new Error('Sup');
    }

    return value;
  }

  const tester = genTester(test);
  const { actual, expected } = tester(
    yields(1, throws('ERROR')),
    throws((actual) => actual instanceof Error),
  );
  t.deepEqual(actual, expected);
});

test('generator that throws an exception and is not handled', (t) => {
  t.plan(1);
  function* test() {
    yield 1;
    throw new Error('error');
  }

  const tester = genTester(test);
  t.throws(() => tester(yields(1)), 'should throw an error when run');
});

test('when there are more steps in test than generator', (t) => {
  t.plan(2);

  function* test() {
    yield 1;
  }

  const tester = genTester(test);
  const { actual, expected } = tester(yields(1), yields(2), yields(3));
  t.deepEqual(expected, [1, 2, 3], 'expected should not match actual');
  t.deepEqual(actual, [1]);
});

test('when the generator returns early but we are expecting a value', (t) => {
  t.plan(2);

  function* test(ok) {
    if (!ok) {
      return;
    }
  }

  const tester = genTester(test, false);
  const { actual, expected } = tester(finishes('123'));
  t.deepEqual(expected, ['123']);
  t.deepEqual(actual, []);
});
