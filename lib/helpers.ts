import * as cdk from 'npm:aws-cdk-lib/core'
import { stringify } from "https://deno.land/std@0.202.0/yaml/mod.ts";

export function stack() {
    return new cdk.Stack(new cdk.App(), 'a'+(Math.random() + 1).toString(36).substring(7));
}

export function templateForStack(stack: cdk.Stack): Record<string, any> {
    return cdk.App.of(stack)?.synth().stacks.find(s => s.stackName === stack.stackName)?.template;
}

export function clean(template: Record<string, any>): Record<string, any> {
    delete template.Parameters?.BootstrapVersion;
    delete template.Rules?.CheckBootstrapVersion;

    if (Object.keys(template.Parameters).length === 0) {
        delete template.Parameters;
    }
    if (Object.keys(template.Rules).length === 0) {
        delete template.Rules;
    }

    return template;
}

export function toYaml(stack: cdk.Stack): string {
    return stringify(clean(templateForStack(stack)));
}

export function print(stack: cdk.Stack): void {
    return console.log(toYaml(stack));
}