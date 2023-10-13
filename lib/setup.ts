import { IConstruct } from "npm:constructs";
import { cdk, kms, nb, sns, sqs, sub } from "./index.ts";

// Libs
globalThis.stack = nb.stack();
globalThis.print = nb.print;
globalThis.printOnly = nb.printOnly;
globalThis.cdk = cdk;
globalThis.kms = kms;
globalThis.sqs = sqs;
globalThis.sns = sns;
globalThis.sub = sub;
globalThis.any = (
  predicate: (construct: IConstruct) => IConstruct,
  modifier: <T>(construct: T) => T,
): <T>(construct: T) => T => {
  return (construct) => {
    construct.node
      .findAll()
      .filter(predicate)
      .map(modifier);

    return construct;
  };
};
