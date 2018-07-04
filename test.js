const test = require('tape');
const { genTester, yields, skip } = require('.');

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
  const { actual, expected } = tester(
    yields(1, 3),
    5,
  );

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

test('generator with skipping yield that still returns a value', (t) => {
  t.plan(1);

  function* fn() {
    const val = yield 1;
    yield val + 2;
  }

  const tester = genTester(fn);
  const { actual, expected } = tester(
    skip(3),
    5,
  );

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
