import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

export class AbstractionsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * A topic will receive data from somewhere
     */
    const sourceTopic = new sns.Topic(this, "IncomingMessages", {
      masterKey: new kms.Key(this, "TopicKey"),
    });


    /**
     * Subscribe the topic to a queue, using a filter
     * other messages will go onto the DLQ
     */
    const targetQueue = new sqs.Queue(this, "AcceptedMessages", {
      visibilityTimeout: cdk.Duration.seconds(300),
      encryptionMasterKey: new kms.Key(this, "AcceptedQueueKey"),
    });

    const dlq = new sqs.Queue(this, "FilteredMessages", {
      encryptionMasterKey: new kms.Key(this, "FilteredQueueKey"),
    });

    sourceTopic.addSubscription(
      new subscriptions.SqsSubscription(targetQueue, {
        deadLetterQueue: dlq,
        filterPolicy: {
          color: sns.SubscriptionFilter.stringFilter({
            allowlist: ["red", "orange"],
            matchPrefixes: ["bl"],
          }),
        },
      })
    );

    /**
     * Setup a dashboard with widgets for all used resources
     */
    const dashboard = new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: "Observability",
    });
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Processed Messages',
        left: [
          sourceTopic.metricNumberOfMessagesPublished(),
          targetQueue.metricNumberOfMessagesReceived()
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Filtered Messages',
        left: [
          sourceTopic.metricNumberOfNotificationsFilteredOut(),
          dlq.metricNumberOfMessagesReceived()
        ]
      })
    );
  }
}

const app = new cdk.App();
new AbstractionsStack(app, "YogaAbstractionsStack", {});
