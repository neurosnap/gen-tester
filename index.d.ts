declare module 'gen-tester' {
  export interface TesterResults {
    actual: any[];
    expected: any[];
  }
  export interface YieldResult {
    expected: any[];
    returns: any;
  }
  export function genTester(fn: Function, ...args: any[]): (...args: any[]) => TesterResults;
  export function skip(value?: any): YieldResult;
  export function yields(value: any, returns?: any): YieldResult;
}
