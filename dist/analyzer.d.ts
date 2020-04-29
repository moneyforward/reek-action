import { StaticCodeAnalyzer, Transformers } from '@moneyforward/sca-action-core';
interface Smell {
    context: string;
    lines: number[];
    message: string;
    smell_type: string;
    source: string;
    documentation_link: string;
}
export declare type Result = Smell[];
export default class Analyzer extends StaticCodeAnalyzer {
    private static readonly command;
    constructor(options?: string[]);
    prepare(): Promise<unknown>;
    createTransformStreams(): Transformers;
}
export {};
