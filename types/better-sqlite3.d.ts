declare module "better-sqlite3" {
    export interface RunResult {
        changes: number;
        lastInsertRowid: number | bigint;
    }

    export interface Statement<
        Params extends unknown[] = unknown[],
        Row = unknown,
    > {
        run(...params: Params): RunResult;
        get(...params: Params): Row | undefined;
        all(...params: Params): Row[];
    }

    export interface DatabaseOptions {
        nativeBinding?: string;
        memory?: boolean;
        readonly?: boolean;
        fileMustExist?: boolean;
        timeout?: number;
        verbose?: (...args: unknown[]) => void;
    }

    export class Database {
        constructor(filename: string, options?: DatabaseOptions);
        close(): void;
        pragma<T = unknown>(pragma: string, options?: unknown): T;
        prepare<Params extends unknown[] = unknown[], Row = unknown>(
            source: string,
        ): Statement<Params, Row>;
    }

    export default Database;
}
