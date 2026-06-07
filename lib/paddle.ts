import { Paddle, Environment } from "@paddle/paddle-node-sdk";

// كلاينت Paddle server-side — singleton
export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox,
});
