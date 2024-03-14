import { Config } from "./types";

export const config = {
  env: {
    account: "239828624774",
    region: "us-east-1",
  },
  domain: "coelhor.dev",
  owner: "AleCo3lho",
  blogRepo: "coelhor-blog",
  blogBranch: "main",
} as const satisfies Config;
