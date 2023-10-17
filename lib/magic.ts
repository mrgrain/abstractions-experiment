import { Construct } from "npm:constructs";
import { L1Resource } from "./core.ts";

export interface IModifier {
  subject: L1Resource;
}

let modifierCounter = 1;
export abstract class Modifier extends Construct implements IModifier {
  public constructor(public subject: L1Resource) {
    super(subject, `${new.target.name}#${++modifierCounter}`);
  }
}

export type IUnicornModifier = { 
  new(subject: L1Unicorn): any;
}


export class L1Unicorn extends L1Resource {
  public static paintHorn(color?: string): IUnicornModifier {
    return class extends Modifier {
      public constructor(public subject: L1Unicorn) {
        super(subject);
        const colors = ["rainbow", "mushroom-red", "fairy-purple", "elvish-green"];
        this.subject.withProperties({
          hornColor: color ?? colors[Math.floor(Math.random()*colors.length)],
        });
      }
    };
  }

  public constructor(scope: Construct, id: string) {
    super(scope, id, {
      type: "AWS::Magic::Unicorn",
      properties: {
        hornColor: "silver",
      },
    });
  }

  public with(modifier: IUnicornModifier) {
    new modifier(this);
    return this;
  }
}
