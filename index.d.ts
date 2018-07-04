declare module 'gen-tester' {
  export interface TesterResults {
    actual: any[];
    expected: any[];
  }
  export interface YieldResult {
    expected: any[];
    returns: any;
  }
  export function runner(...args: any): TesterResults;
  export function genTester(fn: Function, ...args: any): runner;
  export function skip(value?: any): YieldResult;
  export function yields(value: any, returns?: any): YieldResult;
}
