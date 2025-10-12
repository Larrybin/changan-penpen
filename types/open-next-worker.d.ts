declare module "./.open-next/worker" {
    type FetchHandler = {
        fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response>;
    };

    const handler: FetchHandler | FetchHandler["fetch"];
    export default handler;
}
