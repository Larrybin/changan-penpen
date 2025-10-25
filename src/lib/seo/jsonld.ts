export function serializeJsonLd(input: unknown): string {
    const json = JSON.stringify(input);
    return json.replace(/</g, "\\u003c");
}
