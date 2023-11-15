import { RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

export class CoelhorIac extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedzone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: "Z0595012323F7RI1KVDD2",
      zoneName: "coelhor.dev",
    });

    const blogCert = new acm.Certificate(this, "BlogCert", {
      domainName: "coelhor.dev",
      subjectAlternativeNames: ["*.coelhor.dev"],
      validation: acm.CertificateValidation.fromDns(hostedzone),
    });

    const blogBucket = new s3.Bucket(this, "BlogBucket", {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new cloudfront.CloudFrontWebDistribution(this, "BlogCF", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: blogBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(blogCert, {
        aliases: ["coelhor.dev"],
      }),
    });

    Tags.of(this).add("Project", "coelhor-iac");
    Tags.of(this).add("Author", "Alexandre Coelho Ramos");
  }
}
