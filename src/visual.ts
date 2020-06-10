"use strict";
import powerbi from "powerbi-visuals-api";
import * as React from "react";
import * as ReactDOM from "react-dom";

import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IViewport = powerbi.IViewport;

import "./../style/visual.less";

import { ReactGanttChart, initialState } from "./component/ReactGanttChart";

export class Visual implements IVisual {
  private viewport: IViewport;
  private target: HTMLElement;
  private reactRoot: React.ComponentElement<any, any>;

  constructor(options: VisualConstructorOptions) {
    this.reactRoot = React.createElement(ReactGanttChart, {});
    this.target = options.element;

    ReactDOM.render(this.reactRoot, this.target);
  }

  public update(options: VisualUpdateOptions) {
    if (options.dataViews && options.dataViews[0]) {
      const dataView: DataView = options.dataViews[0];

      this.viewport = options.viewport;
      const { width, height } = this.viewport;
      const size = Math.min(width, height);

      ReactGanttChart.update({
        size,
        textLabel: dataView.metadata.columns[0].displayName,
        textValue: dataView.single.value.toString(),
      });
    } else {
      this.clear();
    }
  }

  private clear() {
    ReactGanttChart.update(initialState);
  }
}
