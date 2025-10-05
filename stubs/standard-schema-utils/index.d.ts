export interface DotPathIssueSegment {
    key?: string | number;
    name?: string | number;
}

export interface DotPathIssueLike {
    path?: Array<string | number | DotPathIssueSegment>;
    paths?: Array<string | number | DotPathIssueSegment>;
    key?: string | number;
    field?: string | number;
    property?: string | number;
    pointer?: string | number;
    message?: string;
    [key: string]: unknown;
}

export declare function getDotPath(issue: DotPathIssueLike | unknown): string;

declare const utils: {
    getDotPath: typeof getDotPath;
};

export default utils;
