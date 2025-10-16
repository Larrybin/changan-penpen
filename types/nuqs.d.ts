declare module "nuqs" {
    export function useQueryStates<T extends Record<string, unknown>>(
        config: Record<
            string,
            {
                parse: (value: string) => unknown;
                serialize: (value: unknown) => string;
            }
        >,
    ): [
        Record<keyof T, unknown>,
        (values: Partial<Record<keyof T, unknown>>) => void,
    ];
}
