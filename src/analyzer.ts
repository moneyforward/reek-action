import stream from 'stream';
import util from 'util';
import { StaticCodeAnalyzer, Transformers, tool } from '@moneyforward/sca-action-core';

const debug = util.debuglog('reek-action');

interface Smell {
  context: string;
  lines: number[];
  message: string;
  smell_type: string;
  source: string;
  documentation_link: string;
}

export type Result = Smell[];

export default class Analyzer extends StaticCodeAnalyzer {
  private static readonly command = 'reek';

  constructor(options: string[] = []) {
    super(Analyzer.command, options.concat(['-f', 'json']), undefined, 3, undefined, 'Reek', exitStatus => exitStatus === 0 || exitStatus === 2);
  }

  protected async prepare(): Promise<unknown> {
    return tool.installGem(true, Analyzer.command);
  }

  protected createTransformStreams(): Transformers {
    const buffers: Buffer[] = [];
    const transformers = [
      new stream.Transform({
        readableObjectMode: true,
        transform: function (buffer, _encoding, done): void {
          buffers.push(buffer);
          done();
        },
        flush: function (done): void {
          const result: Result = JSON.parse(Buffer.concat(buffers).toString());
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
    transformers.reduce((prev, next) => prev.pipe(next));
    return [transformers[0], transformers[transformers.length - 1]];
  }
}
