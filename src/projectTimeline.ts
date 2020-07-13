import "./../style/visual.less";
import { event as d3Event, select as d3Select } from "d3-selection";
import { scaleLinear, scaleBand, scaleTime, scaleOrdinal } from "d3-scale";
import { timeMonth } from "d3-time";
import { timeFormat } from "d3-time-format";
import isValid from "date-fns/isValid";

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
  },
  {
    projectName: "Pens Down Test",
    pmAssignDate: new Date("7/20/2016"),
    endDate: new Date("9/20/2016"),
    dealSign: null,
    dealClose: null,
    day2: null,
    error: true,
    activeProgram: false,
    pensDown: true,
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
      pmAssignDate: new Date(0),
      endDate: new Date(),
      day2: null,
      dealClose: null,
      dealSign: null,
      activeProgram: false,
      error: false,
      pensDown: false,
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
    projects.sort(function (a, b) {
      return a.pmAssignDate.getTime() - b.pmAssignDate.getTime();
    });
  }

  return {
    projects,
    settings: projectTimelineSettings,
  };
}

function populateProjectWithRoles(
  project: ProjectTimelineRow,
  milestones,
  index,
  dataViews
) {
  let pmAssignDate = getRoleIndex(dataViews, "pmAssign");
  if (pmAssignDate != null) {
    project.pmAssignDate = new Date(milestones[index][pmAssignDate].toString());
  }
  let endDateIdx = getRoleIndex(dataViews, "endDate");
  if (endDateIdx != null) {
    let endDate = new Date(milestones[index][endDateIdx].toString());
    if (isValid(endDate)) {
      project.endDate = endDate;
      project.activeProgram = false;
    } else {
      project.endDate = new Date();
      project.activeProgram = true;
    }
  } else {
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
    if (project.pensDown) {
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
    debugger;

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
      .range([0, this.projects.length * 35]);
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

    var innerIconTransform = function (icon) {
      return (d) => {
        let yOffset = y(d.projectName) + 18;
        let xOffset = 0;
        if (d[icon] != null && isValid(d[icon])) {
          xOffset = x(d[icon]);
        }
        return "translate(" + xOffset + "," + yOffset + ")";
      }
    }

    var endIconTransform = function (icon) {
      return (d) => {
        if (icon === 'activeProgram') {
          let yOffset = y(d.projectName) + 18;
          return "translate(" + x(new Date()) + "," + yOffset + ")";
        }
        else {
          let yOffset = y(d.projectName) + 18;
          return "translate(" + x(d.endDate) + "," + yOffset + ")";
        }
      }
    }

    // var dealsignTransform = function (d) {
    //   let yOffset = y(d.projectName) + 18;
    //   let xOffset = 0;
    //   if (d.dealSign != null && isValid(d.dealSign)) {
    //     xOffset = x(d.dealSign);
    //   }
    //   return "translate(" + xOffset + "," + yOffset + ")";
    // };

    // var dealcloseTransform = function (d) {
    //   debugger;
    //   let yOffset = y(d.projectName) + 18;
    //   let xOffset = 0;
    //   if (d.dealClose != null && isValid(d.dealClose)) {
    //     xOffset = x(d.dealClose);
    //   }
    //   return "translate(" + xOffset + "," + yOffset + ")";
    // };

    // var day2Transform = function (d) {
    //   debugger;
    //   let yOffset = y(d.projectName) + 18;
    //   let xOffset = 0;
    //   if (d.day2 != null && isValid(d.day2)) {
    //     xOffset = x(d.day2);
    //   }
    //   return "translate(" + xOffset + "," + yOffset + ")";
    // };

    // var activeProgramTransform = function (d) {
    //   let yOffset = y(d.projectName) + 18;
    //   return "translate(" + x(new Date()) + "," + yOffset + ")";
    // };

    // var transitionToSustainingTransform = function (d) {
    //   let yOffset = y(d.projectName) + 18;
    //   return "translate(" + x(d.endDate) + "," + yOffset + ")";
    // };

    // var pensDownTransform = function (d) {
    //   let yOffset = y(d.projectName) + 18;
    //   return "translate(" + x(d.endDate) + "," + yOffset + ")";
    // };

    var errorTransform = function (d) {
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

    this.projectContainer
      .selectAll(".error")
      .data(this.projects)
      .enter()
      .append("rect")
      .attr("class", "error")
      .attr("y", 30)
      .attr("transform", errorTransform)
      .attr("height", 1)
      .attr("display", function (d) {
        return d.error ? "" : "none";
      })
      .attr("width", function (d) {
        return x(d.endDate) - x(d.pmAssignDate);
      });

    this.projectContainer.selectAll(".icon").remove();
    let dealSignIcon =
      '<g><path d="M0 0h24v24H0z" fill="none" /><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#cc681f" /></g>';
    this.renderIcon(this.projectContainer, 'dealSign', dealSignIcon, innerIconTransform('dealSign'),
      function (d) {
        return d.dealSign == null || !isValid(d.dealSign) ? "none" : "";
      }
      , this.projects);
    // this.projectContainer
    // .selectAll(".chart")
    // .data(this.projects)
    // .enter()
    // .append("g")
    // .attr("class", "dealsign icon")
    // //.attr("xlink:href", "dealsign-24px.svg")
    // //.attr("transform", dealsignTransform)
    // .attr("transform", innerIconTransform("dealSign"))
    // .attr("display", function (d) {
    //   return d.dealSign == null || !isValid(d.dealSign) ? "none" : "";
    // })
    // .attr("y", 18)
    // .attr("width", 24)
    // .attr("height", 24)
    // .html(dealSignIcon);
    let dealCloseIcon =
      '<circle style="fill: rgb(94, 77, 129);" cx="32.104" cy="32.104" r="32.05" transform="matrix(7.705857, 0, 0, 7.687307, -0.362122, -0.36112)"/><text transform="matrix(12.363564, 0, 0, 13.171527, -259.909424, -342.372162)" style="fill: rgb(255, 255, 255); fill-rule: evenodd; font-family: &quot;Roboto Slab&quot;; font-size: 28px; white-space: pre;"><tspan x="35.077" y="55.291">1</tspan><tspan x="35.077" dy="1em">​</tspan></text>';
    this.renderIcon(this.projectContainer, 'dealClose', dealCloseIcon, innerIconTransform('dealClose'),
      function (d) {
        return d.dealClose == null || !isValid(d.dealClose) ? "none" : "";
      }
      , this.projects);
    // this.projectContainer
    // .selectAll(".chart")
    // .data(this.projects)
    // .enter()
    // .append("g")
    // .attr("class", "dealclose icon")
    // //.attr("xlink:href", "dealclose-day1.svg")
    // //.attr("transform", dealcloseTransform)
    // .attr("transform", innerIconTransform("dealClose"))
    // .attr("display", function (d) {
    //   return d.dealClose == null || !isValid(d.dealClose) ? "none" : "";
    // })
    // .attr("y", 19)
    // .attr("width", 24)
    // .attr("height", 24)
    // .html(dealCloseIcon);
    let day2Icon =
      '<circle style="fill: rgb(153, 136, 85);" cx="32.104" cy="32.104" r="32.05" transform="matrix(7.705857, 0, 0, 7.687307, -0.362122, -0.36112)"/><text transform="matrix(12.363564, 0, 0, 13.171527, -280.123444, -346.533875)" style="fill: rgb(255, 255, 255); fill-rule: evenodd; font-family: &quot;Roboto Slab&quot;; font-size: 28px; white-space: pre;"><tspan x="35.077" y="55.291">2</tspan><tspan x="35.077" dy="1em">​</tspan></text>';
    this.renderIcon(this.projectContainer, 'day2', day2Icon, innerIconTransform('day2'),
      function (d) {
        return d.day2 == null || !isValid(d.day2) ? "none" : "";
      }, this.projects);
    // this.projectContainer
    // .selectAll(".chart")
    // .data(this.projects)
    // .enter()
    // .append("g")
    // .attr("class", "day2 icon")
    // //.attr("xlink:href", "day2.svg")
    // //.attr("transform", day2Transform)
    // .attr("transform", innerIconTransform("day2"))
    // .attr("display", function (d) {
    //   return d.day2 == null || !isValid(d.day2) ? "none" : "";
    // })
    // .attr("y", 19)
    // .attr("width", 24)
    // .attr("height", 24)
    // .html(day2Icon);
    let activeProgramIcon =
      '<path d="M0 0h24v24H0z" fill="none" /><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="#29416c" />';
    this.renderIcon(this.projectContainer, 'activeProgram', activeProgramIcon, endIconTransform('activeProgram'),
      function (d) {
        return !d.pensDown && d.activeProgram ? "" : "none";
      }, this.projects);
    // this.projectContainer
    //   .selectAll(".chart")
    //   .data(this.projects)
    //   .enter()
    //   .append("g")
    //   .attr("class", "activeProgram icon")
    //   //.attr("xlink:href", "activeprogram.svg")
    //   //.attr("transform", activeProgramTransform)
    //   .attr("transform", endIconTransform('activeProgram'))
    //   .attr("display", function (d) {
    //     return !d.pensDown && d.activeProgram ? "" : "none";
    //   })
    //   .attr("x", -10)
    //   .attr("y", 19)
    //   .attr("width", 24)
    //   .attr("height", 24)
    //   .html(activeProgramIcon);
    let transitionToSustainingIcon = '<path d="M0 0h24v24H0z" fill="none" /><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="green" />';
    this.renderIcon(this.projectContainer, 'transitionToSustaining', transitionToSustainingIcon, endIconTransform('transitionToSustaining'), function (d) {
      return !d.activeProgram && !d.pensDown ? "" : "none";
    }, this.projects);
    // this.projectContainer
    //   .selectAll(".chart")
    //   .data(this.projects)
    //   .enter()
    //   .append("g")
    //   .attr("class", "transitionToSustaining icon")
    //   //.attr("xlink:href", "transitiontosustaining.svg")
    //   //.attr("transform", transitionToSustainingTransform)
    //   .attr("transform", endIconTransform('transitionToSustaining'))
    //   .attr("display", function (d) {
    //     return !d.activeProgram && !d.pensDown ? "" : "none";
    //   })
    //   .attr("x", -10)
    //   .attr("y", 19)
    //   .attr("width", 24)
    //   .attr("height", 24)
    //   .html(transitionToSustainingIcon);
    let pensDownIcon = '<path d="M0 0h24v24H0z" fill="none" /><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="red" />';
    this.renderIcon(this.projectContainer, 'pensDown', pensDownIcon, endIconTransform('pensDown'),
      function (d) {
        return d.pensDown ? "" : "none";
      }, this.projects);
    // this.projectContainer
    //   .selectAll(".chart")
    //   .data(this.projects)
    //   .enter()
    //   .append("g")
    //   .attr("class", "pensDown icon")
    //   //.attr("xlink:href", "pensdown-24px.svg")
    //   //.attr("transform", pensDownTransform)
    //   .attr("transform", endIconTransform('pensDown'))
    //   .attr("display", function (d) {
    //     return d.pensDown ? "" : "none";
    //   })
    //   .attr("x", -10)
    //   .attr("y", 19)
    //   .attr("width", 24)
    //   .attr("height", 24)
    //   .html(pensDownIcon);
  }

  private renderIcon(svgContainer: Selection<SVGElement, SVGElement>, iconType: string, iconSvg: string, transformFunction: (string) => string, displayFunction: (string) => string, projects: ProjectTimelineRow[]) {
    svgContainer
      .selectAll(".chart")
      .data(this.projects)
      .enter()
      .append("g")
      .attr("class", iconType + " icon")
      .attr("transform", transformFunction)
      .attr("display", displayFunction)
      .attr("y", 19)
      .attr("width", 24)
      .attr("height", 24)
      .html(iconSvg);
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
