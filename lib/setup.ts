import { IConstruct } from "npm:constructs";
import { cdk, cloudwatch, kms, magic, nb, sns, sqs, sub } from "./index.ts";

// Libs
globalThis.stack = nb.stack();
globalThis.print = nb.print;
globalThis.printOnly = nb.printOnly;
globalThis.cdk = cdk;
globalThis.cw = cloudwatch;
globalThis.kms = kms;
globalThis.sqs = sqs;
globalThis.sns = sns;
globalThis.sub = sub;
globalThis.magic = magic;
globalThis.any = <T extends IConstruct>(
  predicate: (construct: IConstruct) => construct is T,
  modifier: (construct: T) => T,
): (construct: T) => T => {
  return (construct) => {
    construct.node
      .findAll()
      .filter(predicate)
      .map((c) => modifier(c));

    return construct;
  };
};
