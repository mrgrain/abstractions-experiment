import { CfnResource, CfnResourceProps } from "npm:aws-cdk-lib/core";
import * as cloudwatch from "npm:aws-cdk-lib/aws-cloudwatch";
import { Construct, IConstruct } from "npm:constructs";
import { deepMerge } from "https://deno.land/std@0.204.0/collections/deep_merge.ts";

export abstract class VirtualResource extends Construct {
  private modifierStack = new Array<{ [key: string]: any }>(); // add priorities here

  public constructor(scope: Construct, id: string) {
    scope.node.tryRemoveChild(id);
    super(scope, id);
  }

  protected get props(): L1Props {
    // @todo sort by priority    
    return this.finally(this.modifierStack.reduce((props, current) => deepMerge(props, current, {
      arrays: "merge",
    }), {}));
  }

  public withProperties(props: { [key: string]: any }) {
    this.modifierStack.push(props);
    return this;
  }

  protected finally(props: L1Props): L1Props {
    return props;
  }

  public toJson(): any {
    return this.props;
  }
}

export type L1Props = {
  [key: string]: any;
};

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

  protected get cfnProperties(): L1Props {
    // @todo sort by priority
    return this.finally(this.modifierStack.reduce((props, current) => deepMerge(props, current, {
      arrays: "merge",
    }), {}));
  }

  protected finally(props: L1Props): L1Props {
    return props;
  }

  public metric(metric: (subject: L1Resource) => cloudwatch.Metric): cloudwatch.Metric {
    return metric(this);
  }
}
