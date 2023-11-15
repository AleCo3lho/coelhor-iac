import { Config } from "./types";

export const config = {
  env: {
    account: "239828624774",
    region: "us-east-1",
  },
} as const satisfies Config;
