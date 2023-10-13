import * as cdk from "npm:aws-cdk-lib/core";
import { Construct } from "npm:constructs";
import { stringify } from "https://deno.land/std@0.202.0/yaml/mod.ts";

export function stack() {
  return new cdk.Stack();
}

export function templateForStack(stack: cdk.Stack): Record<string, any> {
  return clean(
    cdk.App.of(stack)?.synth({ force: true }).stacks.find((s) =>
      s.stackName === stack.stackName
    )?.template,
  );
}

export function templateForConstructs(
  ...constructs: Construct[]
): Record<string, any> {
  const stack = cdk.Stack.of(constructs[0]);
  const template = templateForStack(cdk.Stack.of(constructs[0]));
  if (cdk.Stack.isStack(constructs[0])) {
    return template;
  }

  const relevant = constructs.flatMap((c) =>
    c.node.findAll()
      .filter((c) => cdk.CfnElement.isCfnElement(c))
      .map((c) => stack.getLogicalId(c))
  );

  for (const logicalId of Object.keys(template.Resources)) {
    if (!relevant.includes(logicalId)) {
      delete template.Resources[logicalId];
    }
  }

  return template;
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

export function toYaml(...constructs: Construct[]): string {
  return stringify(templateForConstructs(...constructs).Resources);
}

export function print(...constructs: Construct[]): void {
  return console.log(toYaml(...constructs));
}
