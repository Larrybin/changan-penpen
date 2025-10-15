import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z as zLatest } from "zod";
import { z as zV4 } from "zod/v4";

extendZodWithOpenApi(zV4);
extendZodWithOpenApi(zLatest);
