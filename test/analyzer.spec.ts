import { expect } from 'chai';
import stream from 'stream';
import { Transformers } from '@moneyforward/sca-action-core';
import Analyzer, { Result } from '../src/analyzer'
import { AssertionError } from 'assert';

describe('Transform', () => {
  it('should return the problem object', async () => {
    const expected = {
      file: 'foo/bar.rb',
      line: 1,
      column: undefined,
      severity: 'warning',
      message: `doesn't depend on instance state (maybe move it to another class?)`,
      code: 'UtilityFunction'
    };
    const result: Result = [
      {
        "context": "Bar#baz",
        "lines": [
          1
        ],
        "message": "doesn't depend on instance state (maybe move it to another class?)",
        "smell_type": "UtilityFunction",
        "source": "foo/bar.rb",
        "documentation_link": "https://github.com/troessner/reek/blob/v5.6.0/docs/Utility-Function.md"
      }
    ];
    const text = JSON.stringify(result);
    const analyzer = new (class extends Analyzer {
      public constructor() {
        super();
      }
      public createTransformStreams(): Transformers {
        return super.createTransformStreams();
      }
    })();
    const [prev, next = prev] = analyzer.createTransformStreams();
    stream.Readable.from(text).pipe(prev);
    for await (const problem of next) {
      expect(problem).to.deep.equal(expected);
      return;
    }
    throw new AssertionError({ message: 'There was no problem to expect.', expected });
  });
});
