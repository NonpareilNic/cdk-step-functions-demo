import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CreateConsume extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const editorialBucket = new s3.Bucket(this, 'EditorialBucket', {
      versioned: true,
      eventBridgeEnabled: true, // Enable EventBridge integration
    });

    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      versioned: true,
    });


    const s3EventRule = new events.Rule(this, 'S3EventRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created', 'Object Deleted'],  // Listen for create and delete events
        detail: {
          bucket: {
            name: [editorialBucket.bucketName]
          }
        }
      },
    });
    
    const copyObjectLambda = new lambda.Function(this, 'CopyObjectLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/copyObject'),
      handler: 'index.lambda_handler',
      environment: {
        CONTENT_BUCKET: contentBucket.bucketName,
      },
    });

    const copyObjectTask = new tasks.LambdaInvoke(this, 'CopyObjectTask', {
      lambdaFunction: copyObjectLambda,
      outputPath: '$.Payload',
    });

    const deleteObjectLambda = new lambda.Function(this, 'DeleteObjectLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/deleteObject'),
      handler: 'index.lambda_handler',
      environment: {
        CONTENT_BUCKET: contentBucket.bucketName,
      },
    });

    const deleteObjectTask = new tasks.LambdaInvoke(this, 'DeleteObjectTask', {
      lambdaFunction: deleteObjectLambda,
      outputPath: '$.Payload',
    });

    // Permissions for the Lambdas to interact with the content bucket
    contentBucket.grantReadWrite(copyObjectLambda);
    contentBucket.grantReadWrite(deleteObjectLambda);

    // Choice state to determine if it's a Create or Remove event
    const isCreateEvent = new sfn.Choice(this, 'IsCreateEvent')
      .when(sfn.Condition.stringEquals('$.detail-type', 'Object Created'), copyObjectTask)
      .when(sfn.Condition.stringEquals('$.detail-type', 'Object Deleted'), deleteObjectTask);

    // Define the Step Function workflow
    const stepFunctionDefinition = isCreateEvent;

    const stepFunction = new sfn.StateMachine(this, 'S3EventStepFunction', {
      definition: stepFunctionDefinition,
    });


    // Create an EventBridge rule to trigger the Step Function
    s3EventRule.addTarget(new targets.SfnStateMachine(stepFunction));

  }
}
