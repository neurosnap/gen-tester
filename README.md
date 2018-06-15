# gen-tester

Test generators with ease

## Why?

Testing generators is kind of a pain to do manually.  Because of the way generators
work, the order in which mock values are injected into a generator relates
to the previous `yield`.

## How?

```js
const { call } = require('sead'); // side-effects as data library
const test = require('tape');
const genTester = require('gen-tester');

function* genCall() {
  const resp = yield call(fetch, 'http://httpbin.org/get');
  const data = yield call([resp, 'json']);
  return { ...data, extra: 'stuff' };
}

test('genCall', (t) => {
  t.plan(1);

  const respValue = { resp: 'value', json: 'hi' };
  const returnValue = { data: 'value', extra: 'stuff' };
  const actual = genTester({
    generator: genCall,
    yields: [
      respValue,
      { data: 'value' },
    ],
  });
  const expected = [
    call(fetch, 'http://httpbin.org/get'),
    call([respValue, 'json']),
    returnValue,
  ];

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
  t.deepEqual(
    last.value,
    { data: 'value' },
    'should return data',
  );
});
```

## API

`genTester` accepts an object with the following keys:

* `generator` (generator function), the generator function to test
* `args` (array, default: []), a list of arguments being called with `generator`
* `yields` (array, default: []), a list of `yield`s that the generator will call with the value that will be the result of the yield
* `shouldReturn` (boolean, default: true), determines whether the generator should attempt to collect the return value from generator
