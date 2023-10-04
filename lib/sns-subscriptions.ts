import { Subscription, SubscriptionFilter, SubscriptionProtocol, Topic } from "aws-cdk-lib/aws-sns";
import * as cdk from "aws-cdk-lib/core";
import { QueueV2 } from "./sqs";
import { SqsSubscriptionProps } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";

export * from "aws-cdk-lib/aws-sns-subscriptions";

export function sqsSubscription(topic: Topic, queue: QueueV2): SqsSubscriptionV2 {
    return new SqsSubscriptionV2(queue, cdk.Names.nodeUniqueId(topic.node), {
        topic,
        queue
    });
}

export function deadLetterQueue(subscription: Subscription, deadLetterQueue: QueueV2): Subscription {
    return subscription;
}

export function filterPolicy(subscription: Subscription, filterPolicy: { [key: string]: SubscriptionFilter }): Subscription {
    return subscription;
}


export interface SqsSubscriptionV2Props extends SqsSubscriptionProps {
    topic: Topic;
    queue: QueueV2;
}

export class SqsSubscriptionV2 extends Subscription {
    constructor(scope: Construct, id: string, props: SqsSubscriptionV2Props) {
        super(scope, id, {
            ...props,
            endpoint: props.queue.queueArn,
            protocol: SubscriptionProtocol.SQS,
        });
    }
}