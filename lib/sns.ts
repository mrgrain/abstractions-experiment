import { Key } from "npm:aws-cdk-lib/aws-kms";
import { Names } from "npm:aws-cdk-lib/core";
import { Construct } from "npm:constructs";
import { L1Resource } from "./core.ts";

export function encrypt(topic: L1Topic, key?: Key): L1Topic {
    if (!key) {
        key = new Key(topic, 'EncryptionKey');
    }
    return topic.withProperties({
        kmsMasterKeyId: key.keyArn
    });
}


export function fifo(topic: L1Topic, props: {
    contentBasedDeduplication?: boolean;
} = {}): L1Topic {
    const topicProps = {
      topicName: topic.topicName,
      fifoTopic: true,
      contentBasedDeduplication: props.contentBasedDeduplication,
    };

    if (topic.topicName && !topic.topicName.endsWith('.fifo')) {
      topicProps.topicName = topic.topicName + '.fifo';
    }
    
    if (!topic.topicName) {
      // Max length allowed by CloudFormation is 256, we subtract 5 to allow for ".fifo" suffix
      const prefixName = Names.uniqueResourceName(topic, {
        maxLength: 256 - 5,
        separator: '-',
      });
      topicProps.topicName = `${prefixName}.fifo`;
    }

    return topic.withProperties(topicProps);
}


export class L1Topic extends L1Resource {
    public constructor(scope: Construct, id: string) {
        super(scope, id, {
            type: 'AWS::SNS::Topic',
        })
    }

    public get topicName(): string {
      return this.cfnProperties.topicName;
    }
}