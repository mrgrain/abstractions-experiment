import * as cdk from 'npm:aws-cdk-lib/core'
import { stringify } from "https://deno.land/std@0.202.0/yaml/mod.ts";

export function stack() {
    return new cdk.Stack();
}

export function templateForStack(stack: cdk.Stack): Record<string, any> {
    return cdk.App.of(stack)?.synth({ force: true }).stacks.find(s => s.stackName === stack.stackName)?.template;
}

export function clean(template: Record<string, any>): Record<string, any> {
    delete template.Parameters?.BootstrapVersion;
    delete template.Rules?.CheckBootstrapVersion;

    if (template.Parameters && Object.keys(template.Parameters).length === 0) {
        delete template.Parameters;
    }
    if (template.Rules && Object.keys(template.Rules).length === 0) {
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