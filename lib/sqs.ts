import * as cdk from "npm:aws-cdk-lib/core";
import * as iam from "npm:aws-cdk-lib/aws-iam";
import * as kms from "npm:aws-cdk-lib/aws-kms";
import * as sqs from "npm:aws-cdk-lib/aws-sqs";
import { L1Resource } from "./core.ts";

export function visibilityTimeout(
  queue: L1Queue,
  duration: cdk.Duration,
): L1Queue {
  return queue.withProperties({
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
export function selectPolicy(queue: L1Queue, autoCreate = true): sqs.QueuePolicy {
  const policy = queue.node.tryFindChild('Policy');
  if (!policy && autoCreate) {
    return new sqs.QueuePolicy(queue, 'Policy', { queues: [queue] });
  }

  return policy;
}

/**
 * Provide a custom resource policy to be used
 */
export function resourcePolicy(queue: L1Queue, policy: sqs.QueuePolicy): sqs.L1Queue {
  queue.wit

  return policy;
}


export function enforceSSL(queue: L1Queue): L1Queue {
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

  return queue;
}

export function encrypt(queue: L1Queue, key?: kms.Key): L1Queue {
  if (!key) {
    return queue.withProperties({
      kmsMasterKeyId: "alias/aws/sqs",
      // kmsDataKeyReusePeriodSeconds: props.dataKeyReuse &&
      //   props.dataKeyReuse.toSeconds(),
    });
  }
  return queue;
}

type EncryptModifier = (queue: L1Queue, key?: Key) => L1Queue;
export const EncryptModifier = encrypt;

type QueueModifier = (queue: L1Queue, ...args: any[]) => L1Queue;

export class L1Queue extends L1Resource {
  public readonly queueArn: string;
  public readonly queueName: string;
  public readonly queueUrl: string;

  private _policy: sqs.QueuePolicy;

  public constructor(scope: Construct, id: string) {
    super(scope, id, {
      type: "AWS::SQS::Queue",
    });

    this.queueArn = cdk.Token.asString(this.getAtt("Arn", cdk.ResolutionTypeHint.STRING));
    this.queueName = cdk.Token.asString(this.getAtt("QueueName", cdk.ResolutionTypeHint.STRING));
    this.queueUrl = cdk.Token.asString(this.getAtt("QueueUrl", cdk.ResolutionTypeHint.STRING));
  }

  public get policy(): sqs.QueuePolicy {
    if (!this._policy) {
      this._policy = selectPolicy(this, true);
    }

    return this._policy;
  }

  public set policy(policy: sqs.QueuePolicy): sqs.QueuePolicy {
    this._policy = policy;
  }  

  public addToResourcePolicy(
    statement: iam.PolicyStatement,
  ): iam.AddToResourcePolicyResult {
    if (!this.policy && this.autoCreatePolicy) {
      this.policy = new QueuePolicy(this, "Policy", { queues: [this] });
    }

    if (this.policy) {
      this.policy.document.addStatements(statement);
      return { statementAdded: true, policyDependable: this.policy };
    }

    return { statementAdded: false };
  }

  public with(modifier: QueueModifier, ...args: any[]): L1Queue;
  public with(modifier: EncryptModifier, key?: Key): L1Queue;
  public with(modifier: QueueModifier, ...args: any[]): L1Queue {
    return modifier(this, ...args);
  }

  public useEncrypt(key?: Key): L1Queue {
    return encrypt(this, key);
  }
}
