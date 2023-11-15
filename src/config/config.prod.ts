import { Config } from "./types";

export const config = {
  env: {
    account: "239828624774",
    region: "us-east-1",
  },
  domain: "coelhor.dev",
  hostedzone: "Z0595012323F7RI1KVDD2",
  owner: "AleCo3lho",
  blogRepo: "coelhor-blog",
} as const satisfies Config;
