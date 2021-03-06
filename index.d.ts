declare namespace jest {
  interface Matchers<R, T> {
    stepsToBeEqual: () => R;
  }
}

declare module 'gen-tester' {
  export interface TesterResults {
    actual: any[];
    expected: any[];
  }
  export interface YieldResult {
    expected: any[];
    returns: any;
  }
  export interface ThrowResult {
    type: string;
    returns: any;
  }
  export interface FinishesResult {
    type: string;
    expected: any[];
    returns: any;
  }
  export interface StepEvaluater {
    pass: boolean;
    expected: any;
    actual: any;
    message: (...args: any[]) => string;
  }
  interface EvaluateProps {
    actual: any[];
    expected: any[];
    equal: (a: any, b: any) => boolean;
  }
  interface StepsProps {
    actual: any[];
    expected: any[];
  }
  export function genTester<Fn extends (...args: any[]) => any>(
    fn: Fn,
    ...args: Parameters<Fn>
  ): (...args: any[]) => TesterResults;
  export function skip(value?: any): YieldResult;
  export function yields(value: any, returns?: any): YieldResult;
  export function throws(returns: any): ThrowResult;
  export function finishes(value?: any, returns?: any): FinishesResult;
  export function evaluateSteps({
    actual,
    expected,
    equal,
  }: EvaluateProps): StepEvaluater;
  export function stepsToBeEqual(props: StepsProps): StepEvaluater;
}
