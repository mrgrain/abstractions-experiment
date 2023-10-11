import * as kms from "npm:aws-cdk-lib/aws-kms"; 
export * from "npm:aws-cdk-lib/aws-kms";

export class Key extends kms.Key {
  constructor(scope, id, props) {
    scope.node.tryRemoveChild(id);
    super(scope, id, props);
  }
}
