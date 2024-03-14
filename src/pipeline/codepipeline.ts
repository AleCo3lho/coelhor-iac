import { Stack, StackProps, Stage, StageProps, Tags } from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { BlogIac } from "../stack";
import { prodConfig } from "../config";
import { BlogPipelineStack } from "./blogpipeline";

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const blogIac = new BlogIac(this, "InfraStack", prodConfig);

    const blogPipeline = new BlogPipelineStack(this, "BlogPipeline", prodConfig);

    blogPipeline.addDependency(blogIac);
  }
}

export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const branch = "main";
    const githubRepository = "AleCo3lho/coelhor-iac";

    const githubConnection = CodePipelineSource.connection(githubRepository, branch, {
      connectionArn:
        "arn:aws:codestar-connections:us-east-1:239828624774:connection/c6e747f6-7996-4583-bdb6-fe659a6ab9e3",
    });

    const pipeline = new CodePipeline(this, "PipelineStack", {
      pipelineName: "BlogIacPipeline",
      synth: new ShellStep("Synth", {
        input: githubConnection,
        commands: ["yarn", "yarn run cdk synth"],
        primaryOutputDirectory: "cdk.out",
      }),
      selfMutation: true,
      crossAccountKeys: false,
      publishAssetsInParallel: false,
    });

    pipeline.addStage(new PipelineStage(this, "Prod", {}));

    Tags.of(this).add("Project", "Coelhor.dev");
    Tags.of(this).add("Author", "Alexandre Coelho Ramos");
  }
}
