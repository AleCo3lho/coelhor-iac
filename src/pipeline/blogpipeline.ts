import { Stack, StackProps, SecretValue } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as cpactions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { prodConfig } from "../config";

export class BlogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const blogCloudFrontID = ssm.StringParameter.fromStringParameterName(
      this,
      "CloudFrontID",
      "/blog/cf/distribution-id",
    );
    const blogBucketARN = ssm.StringParameter.fromStringParameterName(this, "BlogBucketARN", "/blog/s3/bucket-arn");
    const oauth = SecretValue.secretsManager("GitHubToken");
    const sourceArtifact = new codepipeline.Artifact("SourceInput");
    const sourceAction = new cpactions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: `${prodConfig.owner}`,
      repo: `${prodConfig.blogRepo}`,
      oauthToken: oauth,
      output: sourceArtifact,
    });

    const deployAction = new cpactions.S3DeployAction({
      bucket: s3.Bucket.fromBucketArn(this, "Bucket", `${blogBucketARN.stringValue}`),
      actionName: "Deploy",
      input: sourceArtifact,
      runOrder: 1,
    });

    //Create cloudformation invalidation
    const invalidateCFProject = new codebuild.PipelineProject(this, `InvalidateProject`, {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          build: {
            commands: ['aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"'],
          },
        },
      }),
    });

    invalidateCFProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: [`arn:aws:cloudfront::${prodConfig.env.account}:distribution/${blogCloudFrontID.stringValue}`],
      }),
    );

    const invalidateCFAction = new cpactions.CodeBuildAction({
      actionName: "CloudFormation_Invalidation",
      project: invalidateCFProject,
      input: sourceArtifact,
      runOrder: 2,
      environmentVariables: {
        CLOUDFRONT_ID: { value: `${blogCloudFrontID.stringValue}` },
      },
    });

    new codepipeline.Pipeline(this, "Pipeline", {
      pipelineName: "FrontEndPipeline",
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction, invalidateCFAction],
        },
      ],
    });
  }
}
