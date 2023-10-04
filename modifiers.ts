import * as cdk from "npm:aws-cdk-lib/core";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as kms from "aws-cdk-lib/aws-kms";
import * as sns from "./lib/sns";
import * as sqs from "./lib/sqs";
import * as subscriptions from "./lib/sns-subscriptions";

export class AbstractionsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * A topic will receive data from somewhere
     */
    const sourceTopic = new sns.Topic(this, "IncomingMessages");
    sns.encrypt(sourceTopic, new kms.Key(this, "TopicKey"))
    sns.fifo(sourceTopic, {
      // contentBasedDeduplication: true,
    })

    // /**
    //  * Subscribe the topic to a queue, using a filter
    //  * other messages will go onto the DLQ
    //  */
    // const targetQueue = new sqs.QueueV2(this, "AcceptedMessages")
    //   .with(sqs.visibilityTimeout, cdk.Duration.seconds(300))
    //   .with(sqs.EncryptModifier, new kms.Key(this, "AcceptedQueueKey"))
    //   .useEncrypt();

    // const dlq = new sqs.QueueV2(this, "FilteredMessages");
    // sqs.encrypt(dlq, new kms.Key(this, "FilteredQueueKey"))
    // sqs.visibilityTimeout(dlq, cdk.Duration.seconds(300));
     

    // const topic2queue = subscriptions.sqsSubscription(sourceTopic, targetQueue);
    // // const topic2queueAlt = new subscriptions.SqsSubscriptionV2(this, 'FilterMessages', {
    // //   topic: sourceTopic,
    // //   queue: targetQueue,
    // // });    
    // subscriptions.deadLetterQueue(topic2queue, dlq);
    // subscriptions.filterPolicy(topic2queue, {
    //     color: sns.SubscriptionFilter.stringFilter({
    //       allowlist: ["red", "orange"],
    //       matchPrefixes: ["bl"],
    //     }),
    //   });



    // /**
    //  * Setup a dashboard with widgets for all used resources
    //  */
    // const dashboard = new cloudwatch.Dashboard(this, "Dashboard");
    // dashboard.addWidgets(
    //   new cloudwatch.GraphWidget({
    //     title: 'Processed Messages',
    //     left: [
    //       sourceTopic.metricNumberOfMessagesPublished(),
    //       targetQueue.metricNumberOfMessagesReceived()
    //     ]
    //   }),
    //   new cloudwatch.GraphWidget({
    //     title: 'Filtered Messages',
    //     left: [
    //       sourceTopic.metricNumberOfNotificationsFilteredOut(),
    //       dlq.metricNumberOfMessagesReceived()
    //     ]
    //   })
    // );
  }
}

const app = new cdk.App();
new AbstractionsStack(app, "YogaAbstractionsStack", {});

app.synth();