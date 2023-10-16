import * as kms from "npm:aws-cdk-lib/aws-kms"; 
import { IConstruct } from "npm:constructs";
export * from "npm:aws-cdk-lib/aws-kms";

export class Key extends kms.Key {
  constructor(scope: IConstruct, id: string, props: kms.KeyProps) {
    scope.node.tryRemoveChild(id);
    super(scope, id, props);
  }
}
