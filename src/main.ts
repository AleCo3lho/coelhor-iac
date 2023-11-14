#!/usr/bin/env ts-node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CHANGE_ME_Stack } from "./stack";
import { CodePipelineStack } from "./pipeline/codepipeline";

const app = new cdk.App();

/*
 * You can either deploy your application stack (CHANGE_ME_Stack) directly,
 * or deploy the pipeline stack that will trigger the deploy the application stack
 */

// Direct deployment
new CHANGE_ME_Stack(app, "CHANGE_ME_Stack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Pipeline deployment
new CodePipelineStack(app, "CodePipelineStack", {});
