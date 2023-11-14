import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";

import { CHANGE_ME_Stack } from "../src/stack";
import { CodePipelineStack } from "../src/pipeline/codepipeline";

// Test for single stack
test("snapshot for CHANGE_ME_Stack matches previous state", () => {
  const app = new cdk.App();
  const stack = new CHANGE_ME_Stack(app, "MyTestStack");

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

// Test for pipeline stack
test("snapshot for CodePipelineStack matches previous state", () => {
  const app = new cdk.App();
  const stack = new CodePipelineStack(app, "MyCodePipelineStack");

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
