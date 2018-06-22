const test = require('tape');
const genTester = require('./index');

test('generator with no return value, only checking first 2 yields', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    yield 3;
  }

  const tester = genTester(fn);
  const actual = tester([
    null,
    null,
  ]);

  t.deepEqual(actual, [1, 2]);
});

test('generator with arguments', (t) => {
  t.plan(1);

  function* fn(one) {
    yield one;
    yield 2;
    yield 1;
  }

  const tester = genTester(fn, 3);
  const actual = tester([
    null,
    null,
    null,
  ]);

  t.deepEqual(actual, [3, 2, 1]);
});

test('generator with return value', (t) => {
  t.plan(1);

  function* fn() {
    yield 1;
    yield 2;
    return 3;
  }

  const tester = genTester(fn);
  const actual = tester([
    null,
    null,
  ]);

  t.deepEqual(actual, [1, 2, 3]);
});

test('generator mocking yield response values', (t) => {
  t.plan(1);

  function* fn() {
    const val = yield 1;
    yield val + 2;
  }

  const tester = genTester(fn);
  const actual = tester([
    3,
    null,
  ]);

  t.deepEqual(actual, [1, 5]);
});
