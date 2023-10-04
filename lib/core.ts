import { CfnResource, Stack } from "npm:aws-cdk-lib/core";



export abstract class L1Resource extends CfnResource {
    private modifierStack = new Array<{ [key: string]: any }>(); // add priorities here

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
        }), {})
    }
}
