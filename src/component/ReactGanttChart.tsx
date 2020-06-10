"use strict";

import * as React from "react";

export interface State {
  size: number;
  textLabel: string;
  textValue: string;
}

export const initialState: State = {
  textLabel: "",
  textValue: "",
  size: 200,
};

export class ReactGanttChart extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);
    this.state = initialState;
  }

  private static updateCallback: (data: object) => void = null;

  public static update(newState: State) {
    if (typeof ReactGanttChart.updateCallback === "function") {
      ReactGanttChart.updateCallback(newState);
    }
  }

  public state: State = initialState;

  public componentWillMount() {
    ReactGanttChart.updateCallback = (newState: State): void => {
      this.setState(newState);
    };
  }

  public componentWillUnmount() {
    ReactGanttChart.updateCallback = null;
  }

  render() {
    const { textLabel, textValue, size } = this.state;

    const style: React.CSSProperties = { width: size, height: size };

    return (
      <div className="circleCard" style={style}>
        {/* ... */}
      </div>
    );
  }
}

export default ReactGanttChart;
