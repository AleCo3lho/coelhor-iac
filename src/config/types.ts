export type Config = {
  env: {
    account: string;
    region: string;
  };
  domain: string;
  blogRepo?: string;
  owner?: string;
  blogBranch?: string;
};
