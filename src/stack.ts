import { RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { prodConfig } from "./config";

export class CoelhorIac extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedzone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: `${prodConfig.hostedzone}`,
      zoneName: `${prodConfig.domain}`,
    });

    const blogCert = new acm.Certificate(this, "BlogCert", {
      domainName: `${prodConfig.domain}`,
      subjectAlternativeNames: [`*.${prodConfig.domain}`],
      validation: acm.CertificateValidation.fromDns(hostedzone),
    });

    blogCert.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const blogBucket = new s3.Bucket(this, "BlogBucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });
    blogBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);
    blogBucket.grantPublicAccess();

    new ssm.StringParameter(this, "BlogBucketArn", {
      stringValue: blogBucket.bucketArn,
      parameterName: "/blog/s3/bucket-arn",
    });

    const blogCF = new cloudfront.Distribution(this, "BlogCF", {
      defaultBehavior: {
        origin: new origins.S3Origin(blogBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [`${prodConfig.domain}`, `*.${prodConfig.domain}`],
      certificate: blogCert,
    });

    blogCF.applyRemovalPolicy(RemovalPolicy.DESTROY);
    new ssm.StringParameter(this, "BlogCFID", {
      stringValue: blogCF.distributionId,
      parameterName: "/blog/cf/distribution-id",
    });

    const blogAliasRecord = new route53.ARecord(this, "BlogAliasRecord", {
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(blogCF)),
      zone: hostedzone,
      recordName: `${prodConfig.domain}`,
    });

    blogAliasRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    Tags.of(this).add("Project", "coelhor-iac");
    Tags.of(this).add("Author", "Alexandre Coelho Ramos");
  }
}
