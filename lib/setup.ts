import { cdk, kms, nb, sns, sqs, sub } from "./index.ts";

// Libs
globalThis.stack = nb.stack();
globalThis.print = nb.print;
globalThis.cdk = cdk;
globalThis.kms = kms;
globalThis.sqs = sqs;
globalThis.sns = sns;
globalThis.sub = sub;
