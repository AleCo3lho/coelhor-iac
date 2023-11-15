#!/usr/bin/env ts-node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CodePipelineStack } from "./pipeline/codepipeline";
import { prodConfig } from "./config";

const app = new cdk.App();

// Pipeline deployment
new CodePipelineStack(app, "Blog-CodePipelineStack", {
  env: {
    account: `${prodConfig.env.account}`,
    region: `${prodConfig.env.region}`,
  },
});
