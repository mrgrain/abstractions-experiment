import * as cdk from "npm:aws-cdk-lib/core";
import * as sns from "npm:aws-cdk-lib/aws-sns";
import { Construct } from "npm:constructs";
import { L1Resource } from "./core.ts";
import { L1Queue, grantSendMessage } from './sqs.ts';
import { L1Topic } from './sns.ts';

export class L1Subscription extends L1Resource {
  public get topicArn(): string {
    return this.cfnProperties.topicArn;
  }

  public constructor(scope: Construct, id: string) {
    super(scope, id, {
      type: "AWS::SNS::Subscription",
    });
  }

  public with(modifier: SubscriptionModifier): L1Subscription {
    return modifier(this);
  }  
}
export type SubscriptionModifier = (queue: L1Subscription) => L1Subscription;

export function deadLetterQueue(deadLetterQueue: L1Queue): SubscriptionModifier {
  return (subscription: L1Subscription) => {
    grantSendMessage(subscription.topicArn)(deadLetterQueue);

    return subscription.withProperties({
      redrivePolicy: {
        deadLetterTargetArn: deadLetterQueue.queueArn,
      },
    });
  };
}

export function filterMessages(
  policy: { [key: string]: sns.SubscriptionFilter },
): SubscriptionModifier {
  return (subscription: L1Subscription) =>
    subscription.withProperties({
      filterPolicy: policy,
    });
}

export function connect(topic: L1Topic, queue: L1Queue): SubscriptionModifier {
  const topicRegion = () => {
    if (cdk.Stack.of(topic) != cdk.Stack.of(queue)) {
      return cdk.Stack.of(topic).region;
    }
    return undefined;
  };

  return (subscription: L1Subscription) => {
    grantSendMessage(subscription.topicArn)(queue);
    subscription.node.addDependency(queue.policy);

    return subscription.withProperties({
      topicArn: topic.topicArn,
      endpoint: queue.queueArn,
      protocol: sns.SubscriptionProtocol.SQS,
      region: topicRegion(),
    });
  };
}
