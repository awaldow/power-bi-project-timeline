import "./../style/visual.less";
import { event as d3Event, select as d3Select } from "d3-selection";
import { scaleLinear, scaleBand, scaleTime, scaleOrdinal } from "d3-scale";

import { axisBottom, axisTop, axisLeft } from "d3-axis";

import {
  getValue,
  getCategoricalObjectValue,
} from "./objectEnumerationUtility";

import powerbiVisualsApi from "powerbi-visuals-api";
import powerbi = powerbiVisualsApi;

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;
import ScaleLinear = d3.ScaleLinear;
const getEvent = () => require("d3-selection").event;

import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewObjects = powerbi.DataViewObjects;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import Fill = powerbi.Fill;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import {
  createTooltipServiceWrapper,
  TooltipEventArgs,
  ITooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";

interface ProjectTimelineSettings {
  milestonesMarkPhases: {
    show: boolean;
  };
}

interface ProjectTimelineViewModel {
  projects: ProjectTimelineRow[];
  settings: ProjectTimelineSettings;
}

interface ProjectTimelineRow {
  projectName: string;
  pmAssignDate: Date;
  endDate: Date;
  milestones: Milestone[];
}

interface Milestone {
  milestoneType: string;
  milestoneDate: Date;
}

let projects: ProjectTimelineRow[] = [
  {
    projectName: "Altera",
    pmAssignDate: new Date("6/1/2015"),
    endDate: new Date("11/30/2018"),
    milestones: [
      {
        milestoneType: "Deal Sign",
        milestoneDate: new Date("6/1/2015"),
      },
      {
        milestoneType: "Deal Close/Day 1",
        milestoneDate: new Date("7/13/2015"),
      },
    ],
  },
  {
    projectName: "eASIC",
    pmAssignDate: new Date("2/2/2018"),
    endDate: new Date(""),
    milestones: [
      {
        milestoneType: "Deal Sign",
        milestoneDate: new Date("8/7/2018"),
      },
      {
        milestoneType: "Deal Close/Day 1",
        milestoneDate: new Date("9/9/2018"),
      },
    ],
  },
];

let viewModel: ProjectTimelineViewModel = {
  projects,
  settings: <ProjectTimelineSettings>{},
};

/**
 * Function that converts queried data into a view model that will be used by the visual
 *
 * @function
 * @param {VisualUpdateOptions} options - Contains references to the size of the container
 *                                        and the dataView which contains all the data
 *                                        the visual had queried.
 * @param {IVisualHost} host            - Contains references to the host which contains services
 */
function visualTransform(
  options: VisualUpdateOptions,
  host: IVisualHost
): ProjectTimelineViewModel {
  /*Convert dataView to your viewModel*/
  debugger;
  let dataViews = options.dataViews;
  let defaultSettings: ProjectTimelineSettings = {
    milestonesMarkPhases: {
      show: false,
    },
  };
  let viewModel: ProjectTimelineViewModel = {
    projects: [],
    settings: <ProjectTimelineSettings>{},
  };

  if (
    !dataViews ||
    !dataViews[0] ||
    !dataViews[0].table ||
    !dataViews[0].table.rows
  ) {
    return viewModel;
  }

  let milestones = dataViews[0].table.rows;

  let projects: ProjectTimelineRow[] = [];

  let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;
  let objects = dataViews[0].metadata.objects;

  const strokeColor: string = getColumnStrokeColor(colorPalette);

  let projectTimelineSettings: ProjectTimelineSettings = {
    milestonesMarkPhases: {
      show: getValue<boolean>(
        objects,
        "milestonesMarkPhases",
        "show",
        defaultSettings.milestonesMarkPhases.show
      ),
    },
  };

  const strokeWidth: number = getColumnStrokeWidth(colorPalette.isHighContrast);

  for (let i = 0, len = Math.max(milestones.length, 0); i < len; i++) {
    let project: ProjectTimelineRow = {
      projectName: milestones[i][0].toString(),
      pmAssignDate: new Date(),
      endDate: new Date(),
      milestones: [],
    };
    for (let j = 1; (len = dataViews[0].table.columns.length); i++) {
      let milestone: Milestone = {
        milestoneType: dataViews[0].table.columns[j].displayName,
        milestoneDate: new Date(milestones[i][j].toString())
      }
      project.milestones.push(milestone);
    }
    projects.push(project);
  }

  return {
    projects,
    settings: projectTimelineSettings,
  };
}

function getColumnColorByIndex(
  category: DataViewCategoryColumn,
  index: number,
  colorPalette: ISandboxExtendedColorPalette
): string {
  if (colorPalette.isHighContrast) {
    return colorPalette.background.value;
  }

  const defaultColor: Fill = {
    solid: {
      color: colorPalette.getColor(`${category.values[index]}`).value,
    },
  };

  return getCategoricalObjectValue<Fill>(
    category,
    index,
    "colorSelector",
    "fill",
    defaultColor
  ).solid.color;
}

function getColumnStrokeColor(
  colorPalette: ISandboxExtendedColorPalette
): string {
  return colorPalette.isHighContrast ? colorPalette.foreground.value : null;
}

function getColumnStrokeWidth(isHighContrast: boolean): number {
  return isHighContrast ? 2 : 0;
}

export class ProjectTimeline implements IVisual {
  private svg: Selection<any>;
  private host: IVisualHost;
  private selectionManager: ISelectionManager;
  private projectContainer: Selection<SVGElement>;
  private xAxis: Selection<SVGElement>;
  private projects: ProjectTimelineRow[];
  private projectTimelineSettings: ProjectTimelineSettings;
  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private locale: string;
  private helpLinkElement: Selection<any>;
  private element: HTMLElement;
  private isLandingPageOn: boolean;
  private LandingPageRemoved: boolean;
  private LandingPage: Selection<any>;
  private averageLine: Selection<SVGElement>;

  private projectSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>;

  static Config = {
    xScalePadding: 0.1,
    solidOpacity: 1,
    transparentOpacity: 0.4,
    margins: {
      top: 0,
      right: 0,
      bottom: 25,
      left: 30,
    },
    xAxisFontMultiplier: 0.04,
  };

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.element = options.element;
    this.selectionManager = options.host.createSelectionManager();
    this.locale = options.host.locale;

    // this.selectionManager.registerOnSelectCallback(() => {
    //     this.syncSelectionState(this.projectSelection, <ISelectionId[]>this.selectionManager.getSelectionIds());
    // });

    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      this.host.tooltipService,
      options.element
    );

    this.svg = d3Select(options.element)
      .append("svg")
      .classed("projectTimeline", true);

    this.projectContainer = this.svg
      .append("g")
      .classed("projectContainer", true);

    this.xAxis = this.svg.append("g").classed("xAxis", true);

    // this.initAverageLine();

    // const helpLinkElement: Element = this.createHelpLinkElement();
    // options.element.appendChild(helpLinkElement);

    // this.helpLinkElement = d3Select(helpLinkElement);

    // this.handleContextMenu();
  }

  public update(options: VisualUpdateOptions) {
    debugger;
    let viewModel: ProjectTimelineViewModel = visualTransform(
      options,
      this.host
    );
    let settings = (this.projectTimelineSettings = viewModel.settings);
    this.projects = viewModel.projects;

    // Turn on landing page in capabilities and remove comment to turn on landing page!
    // this.HandleLandingPage(options);

    let width = options.viewport.width;
    let height = options.viewport.height;

    this.svg.attr("width", width).attr("height", height);

    this.xAxis
      .style(
        "font-size",
        Math.min(height, width) * ProjectTimeline.Config.xAxisFontMultiplier
      )
      .style("fill", "#000000");
    //.style("fill", settings.enableAxis.fill);

    // let yScale = scaleLinear()
    //     .domain([0, viewModel.dataMax])
    //     .range([height, 0]);

    //let yScale = scaleOrdinal().domain(this.projects.map(p => p.projectName)).range([0, this.projects.length]);

    let xScale = scaleTime()
      .domain([
        this.firstStartDate(viewModel.projects),
        this.lastEndDate(viewModel.projects),
      ])
      .rangeRound([0, width]);

    let xAxis = axisTop(xScale);
    this.xAxis.attr("transform", "translate(0, " + height + ")").call(xAxis);

    //let yAxis = axisLeft(yScale);

    // const textNodes = this.xAxis.selectAll("text")
    //ProjectTimeline.wordBreak(textNodes, xScale.bandwidth(), height);

    // this.projectSelection = this.projectContainer
    //     .selectAll('.project')
    //     .data(this.projects);
  }

  // private handleClick(barSelection: d3.Selection<d3.BaseType, any, d3.BaseType, any>) {
  //     // Clear selection when clicking outside a bar
  //     this.svg.on('click', (d) => {
  //         if (this.host.allowInteractions) {
  //             this.selectionManager
  //                 .clear()
  //                 .then(() => {
  //                     this.syncSelectionState(barSelection, []);
  //                 });
  //         }
  //     });
  // }

  private handleContextMenu() {
    this.svg.on("contextmenu", () => {
      const mouseEvent: MouseEvent = getEvent();
      const eventTarget: EventTarget = mouseEvent.target;
      let dataPoint: any = d3Select(<d3.BaseType>eventTarget).datum();
      this.selectionManager.showContextMenu(
        dataPoint ? dataPoint.selectionId : {},
        {
          x: mouseEvent.clientX,
          y: mouseEvent.clientY,
        }
      );
      mouseEvent.preventDefault();
    });
  }

  private firstStartDate(projects: ProjectTimelineRow[]): Date {
    return Math.min.apply(
      null,
      projects.map((p) => p.pmAssignDate)
    );
  }

  private lastEndDate(projects: ProjectTimelineRow[]): Date {
    return Math.max.apply(
      null,
      projects.map((p) => p.endDate)
    );
  }

  // private syncSelectionState(
  //     selection: Selection<BarChartDataPoint>,
  //     selectionIds: ISelectionId[]
  // ): void {
  //     if (!selection || !selectionIds) {
  //         return;
  //     }

  //     if (!selectionIds.length) {
  //         const opacity: number = this.barChartSettings.generalView.opacity / 100;
  //         selection
  //             .style("fill-opacity", opacity)
  //             .style("stroke-opacity", opacity);

  //         return;
  //     }

  //     const self: this = this;

  //     selection.each(function (barDataPoint: BarChartDataPoint) {
  //         const isSelected: boolean = self.isSelectionIdInArray(selectionIds, barDataPoint.selectionId);

  //         const opacity: number = isSelected
  //             ? BarChart.Config.solidOpacity
  //             : BarChart.Config.transparentOpacity;

  //         d3Select(this)
  //             .style("fill-opacity", opacity)
  //             .style("stroke-opacity", opacity);
  //     });
  // }

  private isSelectionIdInArray(
    selectionIds: ISelectionId[],
    selectionId: ISelectionId
  ): boolean {
    if (!selectionIds || !selectionId) {
      return false;
    }

    return selectionIds.some((currentSelectionId: ISelectionId) => {
      return currentSelectionId.includes(selectionId);
    });
  }

  /**
   * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
   *
   * @function
   * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
   */
  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstanceEnumeration {
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];

    if (
      !this.projectTimelineSettings ||
      !this.projectTimelineSettings.milestonesMarkPhases ||
      !this.projects
    ) {
      return objectEnumeration;
    }

    switch (objectName) {
      case "milestonesMarkPhases":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: this.projectTimelineSettings.milestonesMarkPhases.show,
          },
          selector: null,
        });
        break;
      // case 'enableAxis':
      //     objectEnumeration.push({
      //         objectName: objectName,
      //         properties: {
      //             show: this.barChartSettings.enableAxis.show,
      //             fill: this.barChartSettings.enableAxis.fill,
      //         },
      //         selector: null
      //     });
      //     break;
      // case 'colorSelector':
      //     for (let barDataPoint of this.barDataPoints) {
      //         objectEnumeration.push({
      //             objectName: objectName,
      //             displayName: barDataPoint.category,
      //             properties: {
      //                 fill: {
      //                     solid: {
      //                         color: barDataPoint.color
      //                     }
      //                 }
      //             },
      //             selector: barDataPoint.selectionId.getSelector()
      //         });
      //     }
      //     break;
      // case 'generalView':
      //     objectEnumeration.push({
      //         objectName: objectName,
      //         properties: {
      //             opacity: this.barChartSettings.generalView.opacity,
      //             showHelpLink: this.barChartSettings.generalView.showHelpLink
      //         },
      //         validValues: {
      //             opacity: {
      //                 numberRange: {
      //                     min: 10,
      //                     max: 100
      //                 }
      //             }
      //         },
      //         selector: null
      //     });
      //     break;
      // case 'averageLine':
      //     objectEnumeration.push({
      //         objectName: objectName,
      //         properties: {
      //             show: this.barChartSettings.averageLine.show,
      //             displayName: this.barChartSettings.averageLine.displayName,
      //             fill: this.barChartSettings.averageLine.fill,
      //             showDataLabel: this.barChartSettings.averageLine.showDataLabel
      //         },
      //         selector: null
      //     });
      //     break;
    }

    return objectEnumeration;
  }

  /**
   * Destroy runs when the visual is removed. Any cleanup that the visual needs to
   * do should be done here.
   *
   * @function
   */
  public destroy(): void {
    // Perform any cleanup tasks here
  }

  // private getTooltipData(value: any): VisualTooltipDataItem[] {
  //     let language = getLocalizedString(this.locale, "LanguageKey");
  //     return [{
  //         displayName: value.category,
  //         value: value.value.toString(),
  //         color: value.color,
  //         header: language && "displayed language " + language
  //     }];
  // }

  private createHelpLinkElement(): Element {
    let linkElement = document.createElement("a");
    linkElement.textContent = "?";
    linkElement.setAttribute("title", "Open documentation");
    linkElement.setAttribute("class", "helpLink");
    linkElement.addEventListener("click", () => {
      this.host.launchUrl(
        "https://microsoft.github.io/PowerBI-visuals/tutorials/building-bar-chart/adding-url-launcher-element-to-the-bar-chart/"
      );
    });
    return linkElement;
  }

  private handleLandingPage(options: VisualUpdateOptions) {
    if (!options.dataViews || !options.dataViews.length) {
      if (!this.isLandingPageOn) {
        this.isLandingPageOn = true;
        const SampleLandingPage: Element = this.createSampleLandingPage();
        this.element.appendChild(SampleLandingPage);

        this.LandingPage = d3Select(SampleLandingPage);
      }
    } else {
      if (this.isLandingPageOn && !this.LandingPageRemoved) {
        this.LandingPageRemoved = true;
        this.LandingPage.remove();
      }
    }
  }

  private createSampleLandingPage(): Element {
    let div = document.createElement("div");

    let header = document.createElement("h1");
    header.textContent = "Sample Bar Chart Landing Page";
    header.setAttribute("class", "LandingPage");
    let p1 = document.createElement("a");
    p1.setAttribute("class", "LandingPageHelpLink");
    p1.textContent = "Learn more about Landing page";

    p1.addEventListener("click", () => {
      this.host.launchUrl(
        "https://microsoft.github.io/PowerBI-visuals/docs/overview/"
      );
    });

    div.appendChild(header);
    div.appendChild(p1);

    return div;
  }

  private getColorValue(color: Fill | string): string {
    // Override color settings if in high contrast mode
    if (this.host.colorPalette.isHighContrast) {
      return this.host.colorPalette.foreground.value;
    }

    // If plain string, just return it
    if (typeof color === "string") {
      return color;
    }
    // Otherwise, extract string representation from Fill type object
    return color.solid.color;
  }

  private initAverageLine() {
    this.averageLine = this.svg.append("g").classed("averageLine", true);

    this.averageLine.append("line").attr("id", "averageLine");

    this.averageLine.append("text").attr("id", "averageLineLabel");
  }

  // private handleAverageLineUpdate(height: number, width: number, yScale: ScaleLinear<number, number>) {
  //     let average = this.calculateAverage();
  //     let fontSize = Math.min(height, width) * BarChart.Config.xAxisFontMultiplier;
  //     let chosenColor = this.getColorValue(this.barChartSettings.averageLine.fill);
  //     // If there's no room to place lable above line, place it below
  //     let labelYOffset = fontSize * ((yScale(average) > fontSize * 1.5) ? -0.5 : 1.5);

  //     this.averageLine
  //         .style("font-size", fontSize)
  //         .style("display", (this.barChartSettings.averageLine.show) ? "initial" : "none")
  //         .attr("transform", "translate(0, " + Math.round(yScale(average)) + ")");

  //     this.averageLine.select("#averageLine")
  //         .style("stroke", chosenColor)
  //         .style("stroke-width", "3px")
  //         .style("stroke-dasharray", "6,6")
  //         .attr("x1", 0)
  //         .attr("x1", "" + width);

  //     this.averageLine.select("#averageLineLabel")
  //         .text("Average: " + average.toFixed(2))
  //         .attr("transform", "translate(0, " + labelYOffset + ")")
  //         .style("fill", this.barChartSettings.averageLine.showDataLabel ? chosenColor : "none");
  // }

  // private calculateAverage(): number {
  //     if (this.barDataPoints.length === 0) {
  //         return 0;
  //     }

  //     let total = 0;

  //     this.barDataPoints.forEach((value: BarChartDataPoint) => {
  //         total += <number>value.value;
  //     });

  //     return total / this.barDataPoints.length;
  // }
}
