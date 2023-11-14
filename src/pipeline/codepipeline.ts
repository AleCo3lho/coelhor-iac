import { Stack, StackProps, Stage, StageProps, Tags } from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { CHANGE_ME_Stack } from "../stack";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new CHANGE_ME_Stack(this, "StageStack", {});
  }
}

/**
 * Stack to that creates a CDK CodePipeline pipeline
 */
export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Pipeline source: branch and Github org/repository
    const branch = "main";
    const githubRepository = "org/repo";
    /**
     * A Codestar connection to Github must be manually created using the AWS console
     * see https://docs.aws.amazon.com/codepipeline/latest/userguide/update-github-action-connections.html
     */
    const githubConnection = CodePipelineSource.connection(githubRepository, branch, {
      connectionArn:
        "arn:aws:codestar-connections:us-east-1:222222222222:connection/7d2469ff-514a-4e4f-9003-5ca4a43cdc41",
    });

    const pipeline = new CodePipeline(this, "PipelineStack", {
      pipelineName: "example-codepipeline",
      synth: new ShellStep("Synth", {
        input: githubConnection,
        commands: ["yarn", "yarn run cdk synth"],
        primaryOutputDirectory: "cdk.out",
      }),
      selfMutation: true, // Whether the pipeline will update itself.
      crossAccountKeys: false, // Create KMS keys for the artifact buckets, allowing cross-account deployments.
    });

    // A pipeline can have multiple stages (for ex. dev, staging, prod)
    pipeline.addStage(new PipelineStage(this, "PipelineStage", {}));

    // Please configure the proper tags for this project
    Tags.of(this).add("Project", "Name of project");
    Tags.of(this).add("Team", "Name of team");
  }
}
