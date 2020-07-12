import "./../style/visual.less";
import { event as d3Event, select as d3Select } from "d3-selection";
import { scaleLinear, scaleBand, scaleTime, scaleOrdinal } from "d3-scale";
import { timeMonth } from "d3-time";
import { timeFormat } from "d3-time-format";

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
  dealSign: Date;
  dealClose: Date;
  day2: Date;
  pensDown: boolean;
  error: boolean;
  activeProgram: boolean;

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
    dealSign: new Date("6/1/2015"),
    dealClose: new Date("7/13/2015"),
    day2: new Date("7/15/2018"),
    error: false,
    activeProgram: false,
    pensDown: false,
    milestones: [],
  },
  {
    projectName: "eASIC",
    pmAssignDate: new Date("2/2/2018"),
    endDate: new Date(),
    dealSign: new Date("8/7/2018"),
    dealClose: new Date("9/9/2018"),
    day2: null,
    error: false,
    activeProgram: true,
    pensDown: false,
    milestones: [],
  },
  {
    projectName: "MAVinci GmbH",
    pmAssignDate: new Date("7/20/2016"),
    endDate: new Date("12/18/2017"),
    dealSign: new Date("9/5/2016"),
    dealClose: new Date("10/1/2016"),
    day2: new Date("10/10/2017"),
    error: true,
    activeProgram: false,
    pensDown: false,
    milestones: [],
  },
  {
    projectName: "Pens Down Test",
    pmAssignDate: new Date("7/20/2016"),
    endDate: new Date("9/20/2016"),
    dealSign: null,
    dealClose: null,
    day2: null,
    error: false,
    activeProgram: false,
    pensDown: true,
    milestones: [],
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
  //debugger;
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
      pmAssignDate: null,
      endDate: null,
      day2: null,
      dealClose: null,
      dealSign: null,
      activeProgram: false,
      error: false,
      pensDown: false,
      milestones: [],
    };
    // for (let j = 1; j < dataViews[0].table.columns.length; j++) {
    //   let milestone: Milestone = {
    //     milestoneType: dataViews[0].table.columns[j].displayName,
    //     milestoneDate: new Date(milestones[i][j].toString()),
    //   };
    //   project.milestones.push(milestone);
    // }

    project = populateProjectWithRoles(project, milestones, i, dataViews);

    projects.push(project);
  }
  if (projects.length > 0) {
    debugger;
  }

  return {
    projects,
    settings: projectTimelineSettings,
  };
}

function populateProjectWithRoles(project : ProjectTimelineRow, milestones, index, dataViews) {
  let pmAssignDate = getRoleIndex(dataViews, "pmAssign");
  if (pmAssignDate != null) {
    project.pmAssignDate = new Date(milestones[index][pmAssignDate].toString());
  }
  let endDate = getRoleIndex(dataViews, "endDate");
  if (endDate != null) {
    project.endDate = new Date(milestones[index][endDate].toString());
    project.activeProgram = false;
  }
  else {
    project.activeProgram = true;
  }
  let dealSign = getRoleIndex(dataViews, "dealSign");
  if (dealSign != null) {
    project.dealSign = new Date(milestones[index][dealSign].toString());
  }
  let dealClose = getRoleIndex(dataViews, "dealClose");
  if (dealClose != null) {
    project.dealClose = new Date(milestones[index][dealClose].toString());
  }
  let day2 = getRoleIndex(dataViews, "day2");
  if (day2 != null) {
    project.day2 = new Date(milestones[index][day2].toString());
  }
  let error = getRoleIndex(dataViews, "error");
  if (error != null) {
    project.error = milestones[index][error];
  }
  let pensDown = getRoleIndex(dataViews, "pensDown");
  if (pensDown != null) {
    project.pensDown = milestones[index][pensDown];
    if(project.pensDown) {
      project.activeProgram = false;
    }
  }

  return project;
}

function getRoleIndex(dataView, role) {
  return dataView[0].table.columns.find((e) => e.roles[role]).index;
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
  private yAxis: Selection<SVGElement>;
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
  private tickFormat: string;

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
    this.tickFormat = "%m/%d/%Y";
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
      .attr("transform", "translate(0, 20)")
      .classed("projectContainer", true);

    this.xAxis = this.projectContainer
      .append("g")
      .attr("class", "x axis")
      .classed("xAxis", true);
    this.yAxis = this.projectContainer
      .append("g")
      .attr("class", "y axis")
      .classed("yAxis", true);

    // this.initAverageLine();

    // const helpLinkElement: Element = this.createHelpLinkElement();
    // options.element.appendChild(helpLinkElement);

    // this.helpLinkElement = d3Select(helpLinkElement);

    // this.handleContextMenu();
  }

  public update(options: VisualUpdateOptions) {
    let viewModel: ProjectTimelineViewModel = visualTransform(
      options,
      this.host
    );
    let settings = (this.projectTimelineSettings = viewModel.settings);
    this.projects = viewModel.projects;
    if (this.projects.length > 0) {
      debugger;
    }

    // Turn on landing page in capabilities and remove comment to turn on landing page!
    // this.HandleLandingPage(options);

    let width = options.viewport.width;
    let height = options.viewport.height;

    this.svg.attr("width", width).attr("height", height);
    //.style("fill", settings.enableAxis.fill);

    // let yScale = scaleLinear()
    //     .domain([0, viewModel.dataMax])
    //     .range([height, 0]);
    let y = scaleBand()
      .domain(this.projects.map((p) => p.projectName))
      .range([0, this.projects.length * 50]);
    //let yScale = scaleOrdinal().domain(this.projects.map(p => p.projectName)).range([0, this.projects.length]);

    let timeDomainStart = timeMonth.offset(
      this.firstStartDate(this.projects),
      -5
    );
    let timeDomainEnd = timeMonth.offset(this.lastEndDate(this.projects), 2);

    let x = scaleTime()
      .domain([timeDomainStart, timeDomainEnd])
      .rangeRound([0, width])
      .nice();

    let xAxis = axisTop(x)
      .tickFormat(timeFormat(this.tickFormat))
      .tickSize(8)
      .ticks(10);
    let yAxis = axisLeft(y).tickSize(0);
    this.xAxis.call(xAxis);
    this.yAxis.call(yAxis);

    //let yAxis = axisLeft(yScale);

    // const textNodes = this.xAxis.selectAll("text")
    //ProjectTimeline.wordBreak(textNodes, xScale.bandwidth(), height);

    // this.projectSelection = this.projectContainer
    //     .selectAll('.project')
    //     .data(this.projects);
    var keyFunction = function (d) {
      return d.pmAssignDate + d.projectName + d.endDate;
    };

    var rectTransform = function (d) {
      return "translate(" + x(d.pmAssignDate) + "," + y(d.projectName) + ")";
    };

    this.projectContainer.selectAll(".bar").remove();
    this.projectContainer
      .selectAll(".chart")
      .data(this.projects, keyFunction)
      .enter()
      .append("rect")
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("class", function (d) {
        return "bar";
      })
      .attr("y", 20)
      .attr("transform", rectTransform)
      .attr("height", function (d) {
        return 20;
      })
      .attr("width", function (d) {
        return x(d.endDate) - x(d.pmAssignDate);
      });

    this.projectContainer.selectAll(".label").remove();
    this.projectContainer
      .selectAll(".text")
      .data(this.projects)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("transform", rectTransform)
      .attr("x", -80)
      .attr("y", 25)
      .text(function (d) {
        return d.projectName;
      })
      .append("tspan")
      .attr("class", "label")
      .attr("transform", rectTransform)
      .attr("x", -80)
      .attr("y", 40)
      .text(function (d) {
        return d.pmAssignDate.toLocaleDateString("en-US");
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
    }

    return objectEnumeration;
  }

  public destroy(): void {
    // Perform any cleanup tasks here
  }
}
