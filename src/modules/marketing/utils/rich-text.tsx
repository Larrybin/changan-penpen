import type React from "react";
import {
    cloneElement,
    Fragment,
    isValidElement,
    type ReactElement,
} from "react";

export function renderRichText(
    template: string,
    replacements: Record<
        string,
        (chunks: React.ReactNode, key: string) => React.ReactNode
    >,
): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    const pattern = /<([a-zA-Z0-9]+)>(.*?)<\/\1>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let index = 0;

    const pushWithKey = (node: React.ReactNode, key: string) => {
        if (isValidElement(node)) {
            const element = node as ReactElement;
            result.push(
                cloneElement(element, {
                    key: element.key ?? key,
                }),
            );
            return;
        }

        if (Array.isArray(node)) {
            result.push(<Fragment key={key}>{node}</Fragment>);
            return;
        }

        if (node === null || node === undefined || node === false) {
            return;
        }

        result.push(<Fragment key={key}>{node}</Fragment>);
    };

    const pushText = (text: string, key: string) => {
        if (text.length) {
            pushWithKey(text, key);
        }
    };

    match = pattern.exec(template);
    while (match !== null) {
        const [fullMatch, tagName, innerContent] = match;
        if (match.index > lastIndex) {
            const textChunk = template.slice(lastIndex, match.index);
            pushText(textChunk, `text-${index}`);
            index += 1;
        }
        const replacement = replacements[tagName];
        const key = `${tagName}-${index}`;
        if (replacement) {
            const node = replacement(innerContent, key);
            pushWithKey(node, key);
        } else {
            pushWithKey(innerContent, key);
        }
        lastIndex = match.index + fullMatch.length;
        index += 1;
        match = pattern.exec(template);
    }

    if (lastIndex < template.length) {
        const textChunk = template.slice(lastIndex);
        pushText(textChunk, `text-${index}`);
    }

    return result;
}
