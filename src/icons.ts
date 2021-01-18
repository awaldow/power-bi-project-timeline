import { transforms } from "./transforms";
import isValid from "date-fns/isValid";
import { ProjectTimelineRow } from "./interfaces";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

export module icons {
  function renderIcon(
    svgContainer: Selection<SVGElement, SVGElement>,
    iconType: string,
    iconSvg: string,
    projects: ProjectTimelineRow[],
    transformFunction: (d: ProjectTimelineRow) => string,
    displayFunction: (d: ProjectTimelineRow) => string
  ) {
    svgContainer
      .selectAll(".icons")
      .data(projects)
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

  export const dealSignIcon =
    '<g><path d="M0 0h24v24H0z" fill="none" /><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#cc681f" /></g>';
  export const dealCloseIcon =
    '<svg width="24" height="24"><circle style="fill: rgb(94, 77, 129);" cx="12" cy="12" r="12" /><text style="fill: rgb(255, 255, 255); fill-rule: evenodd; font-family: &quot;Roboto Slab&quot;; font-size: 22px; white-space: pre;"><tspan x="6" y="19">1</tspan></text></svg>';
  export const day2Icon =
    '<svg width="24" height="24"><circle style="fill: rgb(153, 136, 85);" cx="12" cy="12" r="12" /><text style="fill: rgb(255, 255, 255); fill-rule: evenodd; font-family: &quot;Roboto Slab&quot;; font-size: 22px; white-space: pre;"><tspan x="7" y="19">2</tspan></text></svg>';
  export const activeProgramIcon =
    '<path d="M0 0h24v24H0z" fill="none" /><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="#29416c" />';
  export const transitionToSustainingIcon =
    '<path d="M0 0h24v24H0z" fill="none" /><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="green" />';
  export const pensDownIcon =
    '<path d="M0 0h24v24H0z" fill="none" /><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="red" />';
  export const errorIcon =
    "<svg width='24' height='24'><rect width='24' height='1' y='12' style='fill:rgb(255,0,0);'/></svg>";

  export const iconsList = [
        dealSignIcon,
        dealCloseIcon,
        day2Icon,
        pensDownIcon,
        activeProgramIcon,
        transitionToSustainingIcon,
        errorIcon,
      ];

  export const renderIcons = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
      projectContainer.selectAll(".icon").remove();
      dealSignIconGenerator(projectContainer, projects, x, y);
      dealCloseIconGenerator(projectContainer, projects, x, y);
      day2IconGenerator(projectContainer, projects, x, y);
      activeProgramIconGenerator(projectContainer, projects, x, y);
      transitionToSustainingIconGenerator(projectContainer, projects, x, y);
      pensDownIconGenerator(projectContainer, projects, x, y);
  };
  
  export const dealSignIconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "dealSign",
      dealSignIcon,
      projects,
      transforms.innerIconTransform("dealSign", x, y),
      (d: ProjectTimelineRow) =>
        d.dealSign == null || !isValid(d.dealSign) ? "none" : ""
    );
  };

  export const dealCloseIconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "dealClose",
      dealCloseIcon,
      projects,
      transforms.innerIconTransform("dealClose", x, y),
      (d: ProjectTimelineRow) =>
        d.dealClose == null || !isValid(d.dealClose) ? "none" : ""
    );
  };

  export const day2IconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "day2",
      day2Icon,
      projects,
      transforms.innerIconTransform("day2", x, y),
      (d: ProjectTimelineRow) =>
        d.day2 == null || !isValid(d.day2) ? "none" : ""
    );
  };

  export const activeProgramIconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "activeProgram",
      activeProgramIcon,
      projects,
      transforms.innerIconTransform("activeProgram", x, y),
      (d: ProjectTimelineRow) => (!d.pensDown && d.activeProgram ? "" : "none")
    );
  };

  export const transitionToSustainingIconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "transitionToSustaining",
      transitionToSustainingIcon,
      projects,
      transforms.innerIconTransform("transitionToSustaining", x, y),
      (d: ProjectTimelineRow) => (!d.activeProgram && !d.pensDown ? "" : "none")
    );
  };

  export const pensDownIconGenerator = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    renderIcon(
      projectContainer,
      "pensDown",
      pensDownIcon,
      projects,
      transforms.innerIconTransform("pensDown", x, y),
      (d: ProjectTimelineRow) => (d.pensDown ? "" : "none")
    );
  };
}
