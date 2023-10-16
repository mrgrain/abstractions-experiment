import * as cdk from "npm:aws-cdk-lib/core";
import * as iam from "npm:aws-cdk-lib/aws-iam";
import * as kms from "npm:aws-cdk-lib/aws-kms";
import * as sqs from "npm:aws-cdk-lib/aws-sqs";
import { L1Resource } from "./core.ts";
import { Construct, IConstruct } from "npm:constructs";

export function visibilityTimeout(
  queue: L1Queue,
  duration: cdk.Duration,
): L1Queue {
  return queue.withProperties({
    visibilityTimeout: duration.toSeconds(),
  });
}

export function visibilityTimeoutStrict(
  duration: cdk.Duration,
): StrictQueueModifier {
  return (queue: L1Queue) =>
    queue.withProperties({
      visibilityTimeout: duration.toSeconds(),
    });
}

/**
 * Queues are encrypted by default, this disables the encryption
 */
export function unencrypted(queue: L1Queue): L1Queue {
  return queue.withProperties({
    sqsManagedSseEnabled: false,
  });
}

/**
 * Selector/Creator for sub-resource
 */
export function selectPolicy(
  queue: L1Queue,
  autoCreate = true,
): sqs.QueuePolicy {
  const policy = queue.node.tryFindChild("Policy") as sqs.QueuePolicy;
  if (!policy && autoCreate) {
    return new sqs.QueuePolicy(queue, "Policy", { queues: [queue as any] });
  }

  return policy!;
}

export function resourcePolicyStatement(
  statement: iam.PolicyStatement,
): StrictQueueModifier {
  return (queue: L1Queue) => {
    queue.addToResourcePolicy(statement);
    return queue;
  }
}

export function grantSendMessage(topicArn: string): StrictQueueModifier {
  return (queue: L1Queue) => {
    return resourcePolicyStatement(
      new iam.PolicyStatement({
        resources: [queue.queueArn],
        actions: ["sqs:SendMessage"],
        principals: [new iam.ServicePrincipal("sns.amazonaws.com")],
        conditions: {
          ArnEquals: { "aws:SourceArn": topicArn },
        },
      }),
    )(queue);
  };
}

// export function enforceSSL(queue: L1Queue): L1Queue;
export function enforceSSL(construct: IConstruct): IConstruct {
  const addPolicy = (queue: L1Queue) => {
    const statement = new iam.PolicyStatement({
      actions: ["sqs:*"],
      conditions: {
        Bool: { "aws:SecureTransport": "false" },
      },
      effect: iam.Effect.DENY,
      resources: [queue.queueArn],
      principals: [new iam.AnyPrincipal()],
    });
    selectPolicy(queue, true).document.addStatements(statement);
  };

  construct.node
    .findAll()
    .filter(L1Queue.isL1Queue)
    .map((q) => addPolicy(q));

  return construct;
}

interface KeyRef {
  keyArn: string;
}

interface QueueEncryptionProps {
  dataKeyReuse?: cdk.Duration;
}

/**
 * @param queue The subject
 * @param key The object
 * @param props Additional configuration
 * @returns
 */
export function encrypt(
  queue: L1Queue,
  key?: KeyRef,
  props?: QueueEncryptionProps,
): L1Queue {
  if (!key) {
    return queue.withProperties({
      sqsManagedSseEnabled: true,
    });
  }

  return encryptWithKey(queue, key, props);
}

/**
 * @param queue The subject
 * @param key The object
 * @param props Additional configuration
 * @returns
 */
export function encryptWithKey(
  queue: L1Queue,
  key?: KeyRef,
  props: QueueEncryptionProps = {},
): L1Queue {
  if (!key) {
    key = new kms.Key(queue, "Key", {
      description: `Created by ${queue.node.path}`,
    });
  }

  return queue.withProperties({
    kmsMasterKeyId: key.keyArn,
    kmsDataKeyReusePeriodSeconds: props.dataKeyReuse &&
      props.dataKeyReuse.toSeconds(),
  });
}

export function encryptWithKeyStrict(
  key?: KeyRef,
  props: QueueEncryptionProps = {},
): StrictQueueModifier {
  return (queue: L1Queue) => encryptWithKey(queue, key, props);
}

type EncryptModifier = (queue: L1Queue, key?: kms.Key) => L1Queue;
export const EncryptModifier = encrypt;

type StrictQueueModifier = (queue: L1Queue) => L1Queue;
type QueueModifier = (queue: L1Queue, ...args: any[]) => L1Queue;

export class L1Queue extends L1Resource {
  public static type = "AWS::SQS::Queue";
  public static isL1Queue(construct: IConstruct): construct is L1Queue {
    return (
      cdk.CfnResource.isCfnResource(construct) &&
      construct.cfnResourceType === L1Queue.type
    );
  }

  public readonly queueArn: string;
  public readonly queueName: string;
  public readonly queueUrl: string;

  private _policy?: sqs.QueuePolicy;

  public constructor(scope: Construct, id: string) {
    super(scope, id, {
      type: L1Queue.type,
    });

    this.queueArn = cdk.Token.asString(
      this.getAtt("Arn", cdk.ResolutionTypeHint.STRING),
    );
    this.queueName = cdk.Token.asString(
      this.getAtt("QueueName", cdk.ResolutionTypeHint.STRING),
    );
    this.queueUrl = cdk.Token.asString(
      this.getAtt("QueueUrl", cdk.ResolutionTypeHint.STRING),
    );
  }

  public get policy(): sqs.QueuePolicy {
    if (!this._policy) {
      this._policy = selectPolicy(this, true);
    }

    return this._policy;
  }

  public set policy(policy: sqs.QueuePolicy) {
    this._policy = policy;
  }

  public addToResourcePolicy(
    statement: iam.PolicyStatement,
  ): void {
    if (!this.policy) {
      this.policy = new sqs.QueuePolicy(this, "Policy", { queues: [this as any] });
    }

    if (this.policy) {
      this.policy.document.addStatements(statement);
    }

  }

  public with(modifier: QueueModifier, ...args: any[]): L1Queue;
  public with(modifier: EncryptModifier, key?: kms.Key): L1Queue;
  public with(modifier: QueueModifier, ...args: any[]): L1Queue {
    return modifier(this, ...args);
  }

  public useEncryptWithKey(key?: kms.Key): L1Queue {
    return encryptWithKey(this, key);
  }
}
