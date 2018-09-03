# gen-tester [![Build Status](https://travis-ci.org/neurosnap/gen-tester.svg?branch=master)](https://travis-ci.org/neurosnap/gen-tester)

Test generators with ease

## Why?

Testing generators is kind of a pain to do manually. Because of the way generators
work, the order in which mock values are injected into a generator relates
to the previous `yield`.

## How?

```js
const { call } = require('cosed'); // side-effects as data library
const test = require('tape');
const { genTester, yields } = require('gen-tester');

function* genCall() {
  const resp = yield call(fetch, 'http://httpbin.org/get');
  const data = yield call([resp, 'json']);
  return { ...data, extra: 'stuff' };
}

test('genCall', (t) => {
  t.plan(1);

  const respValue = { resp: 'value', json: 'hi' };
  const returnValue = { data: 'value', extra: 'stuff' };

  const tester = genTester(genCall);
  const { actual, expected } = tester(
    yields(
      call(fetch, 'http://httpbin.org/get'),
      respValue, // the result value of `resp` in the generator
    ),
    yields(
      call([respValue, 'json']),
      { data: 'value' }, // the result value of `data` in the generator
    ),
    returnValue,
  );

  t.deepEqual(actual, expected);
});
```

This is what the test would look like using a manual approach

```js
test('genCall', (t) => {
  const gen = genCall();

  t.plan(4);

  t.deepEqual(
    gen.next().value,
    call(fetch, 'http://httpbin.org/get'),
    'should make http request',
  );

  const respValue = { resp: 'value', json: 'hi' };
  t.deepEqual(
    gen.next(respValue).value,
    call([respValue, 'json']),
    'should get json from response',
  );

  const last = gen.next({ data: 'value' });
  t.ok(last.done, 'generator should finish');
  t.deepEqual(last.value, { data: 'value' }, 'should return data');
});
```

## API

## genTester

`genTester` accepts a generator function and arguments to pass to generator and
returns a function that accepts an array of yields, described below:

- `generator` (generator function), the generator function to test
- `args` (array, default: []), a list of arguments being called with `generator`

```js
const tester = genTester(generator, arg1, arg2, ...);
```

`tester` which is the return value of `genTester` accepts an array of yields
and returns a list of results from the generator at each step

- `yields` (array, default: []), a list of `yield`s that the generator will call
  with the value that will be the result of the yield as well as what was expected
  of that yield.

```js
const { genTester, yields } = require('gen-tester');

const tester = genTester(someFn);
const results = tester(yields('each', 1), yields('yield', 2), 'and return');
console.log(results);
/*
{
  actual: ['each', 'yield', 'and return'],
  expected: ['each', 'yield', 'and return'],
}
*/
```

## yields

`yields` is a helper function that will allow the user to send the expected results
of a yield as well as the return value of that yield. This is primarily used
to inject values into yields for mocking purposes.

- `expected` (any), what we expect the yield to yield
- `returns` (any), what we want the yield to yield for mocking

## skip

`skip` is a helper function that will allow the user to skip a yield. The generator
will progress to the next steps as normal, but we will not keep track of the results
or expectations of that yield.

- `returns` (any), what we want the yield to yield for mocking

```js
const { skip } = require('gen-tester');

function* test() {
  yield 1;
  const resp = yield call(fetch, 'google.com');
  if (resp.status !== 200) {
    return;
  }
  const val = yield call([resp, 'json']);
  return val;
}

const results = tester(
  skip(),
  yields(call(fetch, 'google.com'), { status: 200 }),
  skip({ with: 'value' }),
  { with: 'value' },
);
```

## throws

`throws` allows the developer to throw an exception inside a generator.

- `returns` (any)

```js
const assert = require('assert');
const { genTester, throws, skip } = require('gen-tester');

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
console.log(actual, expected);

assert.deepEqual(actual, expected);
```

`throws` can also be used when something throws an exception between yields.
When asserting that an exception is raised, you must pass it a function which
will receive the error as an argument.

```js
const assert = require('assert');
const { genTester, yields, throws } = require('gen-tester');

function* test() {
  yield 1;
  throw new Error('Something happened');
}

const tester = genTester(test);
const { actual, expected } = tester(
  yields(1);
  throws((error) => error.message === 'Something happened');
);
console.log(actual, expected);

assert.deepEqual(actual, expected);
```

`finishes` ensures that the last step is marked as `done` by the generator.

```js
const { genTester, finishes } = require('gen-tester');

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
```

`evaluateSteps` is a helper that takes the results of `genTester` and determines
what steps are no equal and displays more useful information.

```js
const { genTester } = require('gen-tester');
const deepEqual = require('fast-deep-equal');

function* fn() {
  yield 1;
  yield 2;
  return 3;
}

const tester = genTester(fn);
const { actual, expected } = tester(1, 4, 3);
const results = evauluateSteps({ actual, expected, equal: deepEqual });
console.log(results);
/*
{
  message: [Function: message],
  pass: false,
  actual: 2,
  expected: 4,
}
*/
```

`stepsToBeEqual` is a jest matcher that uses `evaluateSteps`

```js
const { genTester, stepsToBeEqual } = require('gen-tester');

expect.extends({
  stepsToBeEqual,
});

function* fn() {
  yield 1;
  yield 2;
  return 3;
}

const tester = genTester(fn);
const results = tester(1, 2, 3);
expect(results).stepsToBeEqual();
```
