import "./../style/visual.less";
import { select as d3Select } from "d3-selection";
import { scaleBand, scaleTime } from "d3-scale";
import { timeMonth } from "d3-time";
import { timeFormat } from "d3-time-format";
import isValid from "date-fns/isValid";
import {
  ProjectTimelineRow,
  ProjectTimelineSettings,
  ProjectTimelineViewModel,
} from "./interfaces";
import { transforms } from "./transforms";
import { icons } from './icons';
import { graphBody } from './graphBody';

import { axisBottom, axisTop, axisLeft } from "d3-axis";

import { getValue } from "./objectEnumerationUtility";

import powerbiVisualsApi from "powerbi-visuals-api";
import powerbi = powerbiVisualsApi;

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisual = powerbi.extensibility.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

import {
  createTooltipServiceWrapper,
  TooltipEventArgs,
  ITooltipServiceWrapper,
} from "./tooltipServiceWrapper";

function visualTransform(
  options: VisualUpdateOptions,
  host: IVisualHost
): ProjectTimelineViewModel {
  let dataViews = options.dataViews;
  let defaultSettings: ProjectTimelineSettings = {
    showLegend: {
      show: true,
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

  let projectTimelineSettings: ProjectTimelineSettings = {
    showLegend: {
      show: getValue<boolean>(
        objects,
        "showLegend",
        "show",
        defaultSettings.showLegend.show
      ),
    },
  };

  for (let i = 0, len = Math.max(milestones.length, 0); i < len; i++) {
    const selectionId: ISelectionId = host
      .createSelectionIdBuilder()
      .withTable(dataViews[0].table, i)
      .createSelectionId();
    let project: ProjectTimelineRow = {
      projectName: "",
      pmAssignDate: null,
      endDate: null,
      day2: null,
      dealClose: null,
      dealSign: null,
      activeProgram: false,
      error: false,
      pensDown: null,
      transitionToSustaining: null,
      selectionId,
    };
    project = populateProjectWithRoles(project, milestones, i, dataViews);

    projects.push(project);
    projects.sort(
      (a, b) => a.pmAssignDate.getTime() - b.pmAssignDate.getTime()
    );
  }

  return {
    projects,
    settings: projectTimelineSettings,
  };
}

function populateProjectWithRoles(
  project: ProjectTimelineRow,
  milestones: powerbiVisualsApi.DataViewTableRow[],
  index: number,
  dataViews: powerbiVisualsApi.DataView[]
) {
  let projectName = getRoleIndex(dataViews, "project");
  if (projectName >= 0) {
    project.projectName = milestones[index][projectName].toString();
  }

  let pmAssignDate = getRoleIndex(dataViews, "pmAssign");
  if (pmAssignDate >= 0) {
    project.pmAssignDate = new Date(milestones[index][pmAssignDate].toString());
  }
  let endDateIdx = getRoleIndex(dataViews, "endDate");
  if (endDateIdx >= 0) {
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
  if (dealSign >= 0 && milestones[index][dealSign] != null) {
    project.dealSign = new Date(milestones[index][dealSign].toString());
  }
  else {
    project.dealSign = null;
  }
  let dealClose = getRoleIndex(dataViews, "dealClose");
  if (dealClose >= 0 && milestones[index][dealClose] != null) {
    project.dealClose = new Date(milestones[index][dealClose].toString());
  }
  else {
    project.dealClose = null;
  }
  let day2 = getRoleIndex(dataViews, "day2");
  if (day2 >= 0 && milestones[index][day2] != null) {
    project.day2 = new Date(milestones[index][day2].toString());
  }
  else {
    project.day2 = null;
  }
  let error = getRoleIndex(dataViews, "error");
  if (error >= 0) {
    project.error = Boolean(milestones[index][error].valueOf());
  }

  let pensDown = getRoleIndex(dataViews, "pensDown");
  if (pensDown >= 0 && milestones[index][pensDown] != null) {
    project.pensDown = new Date(milestones[index][pensDown].toString());
  }
  else {
    project.pensDown = null;
  }

  let transitionToSustaining = getRoleIndex(dataViews, "transitionToSustaining");
  if (transitionToSustaining >= 0 && milestones[index][transitionToSustaining] != null) {
    let transitionDate = new Date(milestones[index][transitionToSustaining].toString());
    if (isValid(transitionDate)) {
      project.transitionToSustaining = transitionDate;
    }
    else {
      if (endDateIdx >= 0) {
        project.transitionToSustaining = new Date(milestones[index][endDateIdx].toString());
      }
      else {
        project.transitionToSustaining = new Date();
      }
    }
  }
  else {
    project.transitionToSustaining = null;
  }

  return project;
}

function getRoleIndex(dataView: powerbiVisualsApi.DataView[], role: string) {
  const found = dataView[0].table.columns.find((e) => e.roles[role]);
  if (found !== undefined) {
    return found.index;
  } else {
    return -1;
  }
}

export class ProjectTimeline implements IVisual {
  private svg: Selection<any>;
  private host: IVisualHost;
  private projectContainer: Selection<SVGElement>;
  private xAxis: Selection<SVGElement>;
  private yAxis: Selection<SVGElement>;
  private projects: ProjectTimelineRow[];
  private projectTimelineSettings: ProjectTimelineSettings;
  private tooltipServiceWrapper: ITooltipServiceWrapper;
  private locale: string;
  private tickFormat: string;
  private events: IVisualEventService;

  static Config = {
    xScalePadding: 0.1,
    solidOpacity: 1,
    transparentOpacity: 0.4,
    margins: {
      top: 0,
      right: 30,
      bottom: 25,
      left: 30,
    },
    xAxisFontMultiplier: 0.04,
  };

  constructor(options: VisualConstructorOptions) {
    this.tickFormat = "%m/%d/%Y";
    this.host = options.host;
    this.locale = options.host.locale;
    this.events = options.host.eventService;
    options.element.style.overflowY = 'auto';

    this.tooltipServiceWrapper = createTooltipServiceWrapper(
      this.host.tooltipService,
      options.element
    );

    this.svg = d3Select(options.element)
      .append("svg")
      .classed("projectTimeline", true);

    this.projectContainer = this.svg
      .append("g")
      .attr(
        "transform",
        "translate(" + ProjectTimeline.Config.margins.left + ", 20)"
      )
      .classed("projectContainer", true);

    this.xAxis = this.projectContainer
      .append("g")
      .attr("class", "x axis")
      .classed("xAxis", true);
    this.yAxis = this.projectContainer
      .append("g")
      .attr("class", "y axis")
      .classed("yAxis", true);
  }

  public update(options: VisualUpdateOptions) {
    this.events.renderingStarted(options);
    let viewModel: ProjectTimelineViewModel = visualTransform(
      options,
      this.host
    );
    let settings = (this.projectTimelineSettings = viewModel.settings);
    this.projects = viewModel.projects;

    let legendHeight = settings.showLegend.show ? 40 : 0;

    let width = options.viewport.width - 15;
    //let height = options.viewport.height - legendHeight;
    let height = legendHeight + 30 + (35 * this.projects.length);

    this.svg.attr("width", width).attr("height", height);
    let y = scaleBand()
      .domain(this.projects.map((p) => p.projectName))
      .range([0, this.projects.length * 35]);

    let timeDomainStart = timeMonth.offset(
      this.firstStartDate(this.projects),
      -5
    );
    let timeDomainEnd = timeMonth.offset(this.lastEndDate(this.projects), 2);

    let x = scaleTime()
      .domain([timeDomainStart, timeDomainEnd])
      .rangeRound([
        0,
        width -
        ProjectTimeline.Config.margins.left -
        ProjectTimeline.Config.margins.right,
      ])
      .nice();

    let xAxis = axisTop(x).tickFormat(timeFormat(this.tickFormat)).tickSize(8);
    let yAxis = axisLeft(y).tickSize(0);
    this.xAxis.call(xAxis);
    this.yAxis.call(yAxis);

    try {
      graphBody.renderGraphBody(this.projectContainer, this.projects, x, y);
      icons.renderIcons(this.projectContainer, this.projects, x, y);
    }
    catch (e) {
      this.events.renderingFailed(options, e.message);
    }

    this.tooltipServiceWrapper.addTooltip(
      this.projectContainer.selectAll(".bar"),
      "bar",
      (tooltipEvent: TooltipEventArgs<ProjectTimelineRow>) =>
        this.getRowTooltipData(tooltipEvent.data),
      (tooltipEvent: TooltipEventArgs<ProjectTimelineRow>) =>
        tooltipEvent.data.selectionId
    );

    this.tooltipServiceWrapper.addTooltip(
      this.projectContainer.selectAll(".icon"),
      "icon",
      (tooltipEvent: TooltipEventArgs<ProjectTimelineRow>) =>
        this.getIconTooltipData(tooltipEvent.data, tooltipEvent.context),
      (tooltipEvent: TooltipEventArgs<ProjectTimelineRow>) =>
        tooltipEvent.data.selectionId
    );

    if (settings.showLegend.show === true) {
      this.showLegend(icons.iconsList);
      this.projectContainer.attr(
        "transform",
        "translate(" +
        ProjectTimeline.Config.margins.left +
        ", " +
        (20 + legendHeight) +
        ")"
      );
    } else {
      this.hideLegend();
      this.projectContainer.attr(
        "transform",
        "translate(" + ProjectTimeline.Config.margins.left + ", 20)"
      );
    }
    this.events.renderingFinished(options);
  }

  private showLegend(icons: string[]): void {
    const legendValues = [
      "Deal Sign",
      "Deal Close/Day 1",
      "Day 2",
      "Pens Down",
      "Active Program",
      "Transition to Sustaining",
      "Error",
    ];
    var legendIconTransform = (d: string) => {
      let ret = "translate(";
      let index = ProjectTimeline.getLegendIconXOffset(d);
      ret += index;
      ret += ",";
      ret += "0)";
      return ret;
    };
    var legendTextTransform = (d: string) => {
      let ret = "translate(";
      let index = ProjectTimeline.getLegendTextXOffset(d);
      ret += index;
      ret += ",";
      ret += "16)";
      return ret;
    };
    d3Select(".projectTimeline")
      .selectAll(".legend")
      .data(legendValues)
      .enter()
      .append("g")
      .attr("class", "legend icon")
      .attr("width", 24)
      .attr("height", 24)
      .attr("transform", legendIconTransform)
      .html((d) => {
        switch (d) {
          case "Deal Sign":
            return icons[0];
          case "Deal Close/Day 1":
            return icons[1];
          case "Day 2":
            return icons[2];
          case "Pens Down":
            return icons[3];
          case "Active Program":
            return icons[4];
          case "Transition to Sustaining":
            return icons[5];
          case "Error":
            return icons[6];
          default:
            return "Unknown legend value"
        }
      });
    d3Select(".projectTimeline")
      .selectAll(".legend-text")
      .data(legendValues)
      .enter()
      .append("text")
      .attr("class", "legend-text")
      .attr("width", 100)
      .attr("height", 24)
      .attr("transform", legendTextTransform)
      .text((d) => d);
  }

  private static getLegendIconXOffset(d: string) {
    switch (d) {
      case "Deal Sign":
        return 30;
      case "Deal Close/Day 1":
        return 140;
      case "Day 2":
        return 300;
      case "Pens Down":
        return 380;
      case "Active Program":
        return 490;
      case "Transition to Sustaining":
        return 630;
      case "Error":
        return 835;
    }
  }

  private static getLegendTextXOffset(d: string) {
    switch (d) {
      case "Deal Sign":
        return 58;
      case "Deal Close/Day 1":
        return 168;
      case "Day 2":
        return 328;
      case "Pens Down":
        return 403;
      case "Active Program":
        return 513;
      case "Transition to Sustaining":
        return 655;
      case "Error":
        return 865;
    }
  }

  private hideLegend(): void {
    d3Select(".projectTimeline").selectAll(".legend").remove();
    d3Select(".projectTimeline").selectAll(".legend-text").remove();
  }

  private getRowTooltipData(value: any): VisualTooltipDataItem[] {
    return [
      {
        displayName: value.projectName,
        value: this.getProjectDateRange(value),
        color: "white",
        header: "Project",
      },
    ];
  }

  private getIconTooltipData(
    value: any,
    context: HTMLElement
  ): VisualTooltipDataItem[] {
    //let language = getLocalizedString(this.locale, "LanguageKey");
    return [
      {
        displayName: value.projectName,
        value: this.getIconTooltip(value, context),
        color: "white",
        header: this.getIconHeader(context),
      },
    ];
  }

  private getIconTooltip(
    project: ProjectTimelineRow,
    context: HTMLElement
  ): string {
    let icon = "";
    context.classList.forEach((value: string) => {
      if (value !== "icon") {
        icon = value;
      }
    });
    if (isValid(new Date(project[icon])) && project[icon] instanceof Date) {
      return new Date(project[icon]).toLocaleDateString("en-US");
    } else {
      if (icon === "activeProgram") {
        return "Ongoing";
      } else if (icon === "transitionToSustaining" || icon === "pensDown") {
        return project.endDate.toLocaleDateString("en-US");
      }
    }
    return project[icon];
  }

  private getIconHeader(context: HTMLElement): string {
    let icon = "";
    context.classList.forEach((value: string) => {
      if (value !== "icon") {
        icon = value;
      }
    });
    return this.deCamelCase(icon);
  }

  private replaceAt(str: string, index: number, replacement: string) {
    return (
      str.substr(0, index) +
      replacement +
      str.substr(index + replacement.length)
    );
  }

  private deCamelCase(icon: string): string {
    let converted = icon.repeat(1);
    converted = this.replaceAt(converted, 0, converted[0].toUpperCase());
    let splitConverted = converted.split(/(?=[A-Z0-9])/g);
    return splitConverted.join(" ");
  }

  private getProjectDateRange(project: ProjectTimelineRow): string {
    let ret = project.pmAssignDate.toLocaleDateString("en-US") + " to ";
    if (isValid(project.endDate)) {
      ret += project.endDate.toLocaleDateString("en-US");
    } else {
      ret += "now";
    }
    return ret;
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

  public enumerateObjectInstances(
    options: EnumerateVisualObjectInstancesOptions
  ): VisualObjectInstanceEnumeration {
    let objectName = options.objectName;
    let objectEnumeration: VisualObjectInstance[] = [];

    if (!this.projectTimelineSettings || !this.projects) {
      return objectEnumeration;
    }

    switch (objectName) {
      case "showLegend":
        objectEnumeration.push({
          objectName: objectName,
          properties: {
            show: this.projectTimelineSettings.showLegend.show,
          },
          selector: null,
        });
    }

    return objectEnumeration;
  }
}
