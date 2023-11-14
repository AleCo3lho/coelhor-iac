import { Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";

export class CHANGE_ME_Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Please configure the proper tags for this project
    Tags.of(this).add("Project", "Name of project");
    Tags.of(this).add("Team", "Name of team");
  }
}
