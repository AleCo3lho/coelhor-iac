import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { prodConfig } from "../src/config";
import { BlogIac } from "../src/stack";
import { CodePipelineStack } from "../src/pipeline/codepipeline";
import { BlogPipelineStack } from "../src/pipeline/blogpipeline";

// Test for single stack
test("snapshot for CoelhorIac matches previous state", () => {
  const app = new cdk.App();
  const stack = new BlogIac(app, "MyTestStack", prodConfig);

  const template = Template.fromStack(stack);

  const lambdaFunctions = template.findResources("AWS::Lambda::Function");
  cleanUpLambdaImages(lambdaFunctions);

  expect(template.toJSON()).toMatchSnapshot();
});

// Test for pipeline stack
test("snapshot for CodePipelineStack matches previous state", () => {
  const app = new cdk.App();
  const stack = new CodePipelineStack(app, "MyCodePipelineStack", prodConfig);

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

// Test for pipeline stack
test("snapshot for BlogPipiline matches previous state", () => {
  const app = new cdk.App();
  const stack = new BlogPipelineStack(app, "MyBlogPipilineStack", prodConfig);

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

/*** in-place mutate the resources to strip the Lambda function */
function cleanUpLambdaImages(resources: any) {
  for (const key of Object.keys(resources)) {
    const resource = resources[key];
    const lambdaFunction = resource["Properties"]["Code"];
  
    lambdaFunction["S3Key"] = "dummy.zip";
   
  }
}