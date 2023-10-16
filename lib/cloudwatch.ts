import { Construct } from "npm:constructs";
import * as cdk from "npm:aws-cdk-lib/core";
import * as cloudwatch from "npm:aws-cdk-lib/aws-cloudwatch";
import { L1Props, L1Resource, VirtualResource } from "./core.ts";

type GraphWidgetModifier = (widget: L1GraphWidget) => L1GraphWidget;
export class L1GraphWidget extends VirtualResource
  implements cloudwatch.IWidget {
  public constructor(scope: Construct, id: string) {
    super(scope, id);
  }
  public width = 0;
  public height = 0;
  public warnings = [];
  public warningsV2 = {};

  public position(_x: number, _y: number): void {
  }

  protected finally(props: L1Props): L1Props {
    return new cloudwatch.GraphWidget({
      title: props.title,
      left: props.left,
    }).toJson();
  }

  public with(modifier: GraphWidgetModifier): L1GraphWidget {
    return modifier(this);
  }
}

export function title(title: string): GraphWidgetModifier {
  return (widget: L1GraphWidget) => {
    return widget.withProperties({
      title,
    });
  };
}

export function onLeft(metric: cloudwatch.IMetric): GraphWidgetModifier {
  return (widget: L1GraphWidget) => {
    return widget.withProperties({
      left: [metric],
    });
  };
}

export class L1Dashboard extends L1Resource {
  public constructor(scope: Construct, id: string) {
    super(scope, id, {
      type: "AWS::CloudWatch::Dashboard",
    });
  }

  protected rows: cloudwatch.Row[] = [];

  public addRow(row: cloudwatch.Row) {
    this.rows.push(row);
  }

  public with(modifier: DashboardModifier): L1Dashboard {
    return modifier(this);
  }

  protected get dashboardBody(): string {
    return cdk.Lazy.string({
      produce: () => {
        const column = new cloudwatch.Column(...this.rows);
        column.position(0, 0);
        return cdk.Stack.of(this).toJsonString({
          widgets: column.toJson(),
        });
      },
    });
  }

  protected finally(props: L1Props): L1Props {
    return {
      dashboardBody: this.dashboardBody,
      dashboardName: props.dashboardName,
    };
  }
}
export type DashboardModifier = (dashboard: L1Dashboard) => L1Dashboard;

export function widget(widget: L1GraphWidget) {
  return (dashboard: L1Dashboard) =>
    dashboard.addRow(new cloudwatch.Row(widget));
}
