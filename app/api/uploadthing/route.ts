import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Enable callback polling for local development (webhooks don't work on localhost)
    callbackUrl: process.env.UPLOADTHING_CALLBACK_URL,
    isDev: process.env.NODE_ENV === "development",
  },
});
