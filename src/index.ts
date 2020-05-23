import stream from 'stream';
import util from 'util';
import { analyzer } from '@moneyforward/code-review-action';
import StaticCodeAnalyzer, { installer } from '@moneyforward/sca-action-core';
import { transform } from '@moneyforward/stream-util';

type AnalyzerConstructorParameter = analyzer.AnalyzerConstructorParameter;

const debug = util.debuglog('@moneyforward/code-review-action-reek-plugin');

interface Smell {
  context: string;
  lines: number[];
  message: string;
  smell_type: string;
  source: string;
  documentation_link: string;
}

export type Result = Smell[];

export default abstract class Analyzer extends StaticCodeAnalyzer {
  private static readonly command = 'reek';

  constructor(...args: AnalyzerConstructorParameter[]) {
    super(Analyzer.command, args.map(String).concat(['-f', 'json']), undefined, exitStatus => exitStatus === 0 || exitStatus === 2, undefined, 'Reek');
  }

  protected async prepare(): Promise<void> {
    console.log(`::group::Installing gems...`);
    try {
      await new installer.RubyGemsInstaller(true).execute([Analyzer.command]);
    } finally {
      console.log(`::endgroup::`)
    }
  }

  protected createTransformStreams(): stream.Transform[] {
    return [
      new transform.JSON(),
      new stream.Transform({
        objectMode: true,
        transform: function (result: Result, encoding, done): void {
          debug(`Detected %d problem(s).`, result.length);
          for (const smell of result) for (const line of smell.lines) this.push({
            file: smell.source,
            line: line,
            column: undefined,
            severity: 'warning',
            message: smell.message,
            code: smell.smell_type
          });
          this.push(null);
          done();
        }
      })
    ];
  }
}
