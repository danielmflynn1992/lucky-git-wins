import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyDrawOnServer } from "./verify.server";

export const verifyDraw = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ drawId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => verifyDrawOnServer(data.drawId));
