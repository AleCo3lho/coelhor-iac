import { RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2integ from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ses from "aws-cdk-lib/aws-ses";
import * as sesactions from "aws-cdk-lib/aws-ses-actions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as go from "@aws-cdk/aws-lambda-go-alpha";

export interface BlogIacProps extends StackProps {
  readonly domain: string;
}

export class BlogIac extends Stack {
  constructor(scope: Construct, id: string, props: BlogIacProps) {
    super(scope, id, props);

    const hostedzone = new route53.HostedZone(this, `${props.domain}-HostedZone`, {
      zoneName: props.domain,
    });

    const blogCert = new acm.Certificate(this, `${props.domain}-BlogCert`, {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: acm.CertificateValidation.fromDns(hostedzone),
    });
    blogCert.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const blogBucket = new s3.Bucket(this, `${props.domain}-BlogBucket`, {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });
    blogBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);

    new ssm.StringParameter(this, `${props.domain}-BlogBucketArn`, {
      stringValue: blogBucket.bucketArn,
      parameterName: "/blog/s3/bucket-arn",
    });

    const blogCF = new cloudfront.Distribution(this, `${props.domain}-BlogCF`, {
      defaultBehavior: {
        origin: new origins.S3Origin(blogBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          {
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            function: new cloudfront.Function(this, `${props.domain}-BlogCFRedirect`, {
              code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                  var request = event.request;
                  var uri = request.uri;
                  if (uri.endsWith('/')) {
                    request.uri += 'index.html';
                  } 
                  else if (!uri.includes('.')) {
                    request.uri += '/index.html';
                  }
                  return request;
                }`),
            }),
          },
        ],
      },
      domainNames: [`${props.domain}`, `*.${props.domain}`],
      certificate: blogCert,
    });

    blogCF.applyRemovalPolicy(RemovalPolicy.DESTROY);
    new ssm.StringParameter(this, `${props.domain}-BlogCFID`, {
      stringValue: blogCF.distributionId,
      parameterName: "/blog/cf/distribution-id",
    });

    const blogAliasRecord = new route53.ARecord(this, `${props.domain}-BlogAliasRecord`, {
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(blogCF)),
      zone: hostedzone,
      recordName: props.domain,
    });
    blogAliasRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const sesBucket = new s3.Bucket(this, `${props.domain}-SESBucket`, {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
    });
    sesBucket.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const sesReceive = new ses.ReceiptRuleSet(this, `${props.domain}-SESReceive`, {
      rules: [
        {
          recipients: [`newsletter@${props.domain}`],
          enabled: true,
          actions: [
            new sesactions.S3({
              bucket: sesBucket,
              objectKeyPrefix: "emails/newsletter/",
            }),
          ],
        },
      ],
    });
    sesReceive.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const sesSend = new ses.ConfigurationSet(this, `${props.domain}-SESSend`, {});
    sesSend.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const sesEmailIdentity = new ses.EmailIdentity(this, "SESIdentity", {
      identity: ses.Identity.publicHostedZone(hostedzone),
      configurationSet: sesSend,
    });
    sesEmailIdentity.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const simpleSubscribeDB = new dynamodb.TableV2(this, `${props.domain}-SimpleSubscribeDB`, {
      partitionKey: {
        name: "email",
        type: dynamodb.AttributeType.STRING,
      },
      billing: dynamodb.Billing.onDemand(),
    });
    simpleSubscribeDB.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const fnSimpleSubscribe = new go.GoFunction(this, `${props.domain}-SimpleSubscribeFunc`, {
      entry: "src/utils/lambdas/simpleSubscriber",
      environment: {
        DB_TABLE_NAME: simpleSubscribeDB.tableName,
        BASE_URL: `https://${props.domain}/`,
        API_URL: `https://api.${props.domain}/`,
        ERROR_PAGE: "error",
        SUCCESS_PAGE: "success",
        CONFIRM_SUBSCRIBE_PAGE: "confirm",
        CONFIRM_UNSUBSCRIBE_PAGE: "unsubscribed",
        SUBSCRIBE_PATH: "signup",
        UNSUBSCRIBE_PATH: "unsubscribe",
        VERIFY_PATH: "verify",
        SENDER_EMAIL: `no-reply@${props.domain}`,
        SENDER_NAME: "Alexandre Coelho Ramos",
      },
    });
    fnSimpleSubscribe.applyRemovalPolicy(RemovalPolicy.DESTROY);
    fnSimpleSubscribe.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: [`arn:aws:ses:us-east-1:${props.env?.account}:*`],
      }),
    );
    simpleSubscribeDB.grantFullAccess(fnSimpleSubscribe);

    const fnRssMailer = new go.GoFunction(this, `${props.domain}-RssMailerFunc`, {
      entry: "src/utils/lambdas/rss-mailer",
      environment: {
        DB_TABLE_NAME: simpleSubscribeDB.tableName,
        WEBSITE: `https://${props.domain}/`,
        UNSUBSCRIBE_LINK: `https://api.${props.domain}/unsubscribe/`,
        SENDER_EMAIL: `no-reply@${props.domain}`,
        SENDER_NAME: "Alexandre Coelho Ramos",
        TITLE: "Coelhor.dev Posts",
      },
    });
    fnRssMailer.applyRemovalPolicy(RemovalPolicy.DESTROY);
    fnRssMailer.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: [`arn:aws:ses:us-east-1:${props.env?.account}:*`],
      }),
    );
    simpleSubscribeDB.grantFullAccess(fnRssMailer);

    const fnSimpleSubscribeIntegration = new apigwv2integ.HttpLambdaIntegration(
      `${props.domain}-SimpleSubscribeIntegration`,
      fnSimpleSubscribe,
      { payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0 },
    );
    const apiDomain = new apigwv2.DomainName(this, `${props.domain}-APIDomain`, {
      certificate: blogCert,
      domainName: `api.${props.domain}`,
    });
    apiDomain.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const api = new apigwv2.HttpApi(this, `${props.domain}-APIV2`, {
      defaultIntegration: fnSimpleSubscribeIntegration,
      createDefaultStage: true,
      defaultDomainMapping: {
        domainName: apiDomain,
      },
    });
    api.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const apiARecord = new route53.ARecord(this, `${props.domain}-ApiARecord`, {
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayv2DomainProperties(apiDomain.regionalDomainName, apiDomain.regionalHostedZoneId),
      ),
      zone: hostedzone,
      recordName: "api",
    });
    apiARecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const sesMXRecord = new route53.MxRecord(this, `${props.domain}-SESMXRecord`, {
      zone: hostedzone,
      values: [
        {
          hostName: `inbound-smtp.${props.env?.region}.amazonaws.com`,
          priority: 10,
        },
      ],
    });
    sesMXRecord.applyRemovalPolicy(RemovalPolicy.DESTROY);

    Tags.of(this).add("Project", `${props.domain}`);
    Tags.of(this).add("Author", "Alexandre Coelho Ramos");
  }
}
