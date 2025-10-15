import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z as zV4 } from "zod/v4";
import { z as zLatest } from "zod";

extendZodWithOpenApi(zV4);
extendZodWithOpenApi(zLatest);

export {};
