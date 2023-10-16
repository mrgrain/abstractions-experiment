import { CfnResource, CfnResourceProps } from "npm:aws-cdk-lib/core";
import { Construct, IConstruct } from "npm:constructs";

export abstract class VirtualResource extends Construct {
  public constructor(scope: Construct, id: string) {
    scope.node.tryRemoveChild(id);
    super(scope, id);
  }
}

export abstract class L1Resource extends CfnResource {
  private modifierStack = new Array<{ [key: string]: any }>(); // add priorities here

  public constructor(scope: IConstruct, id: string, props: CfnResourceProps) {
    scope.node.tryRemoveChild(id);
    super(scope, id, props);
  }

  public withProperties(props: { [key: string]: any }) {
    this.modifierStack.push(props);
    return this;
  }

  protected get cfnProperties(): {
    [key: string]: any;
  } {
    // @todo
    // deep-merge
    // sort by priority
    return this.modifierStack.reduce((props, current) => ({
      ...props,
      ...current,
    }), {});
  }
}
