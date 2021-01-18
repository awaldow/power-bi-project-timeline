import { transforms } from "./transforms";
import { ProjectTimelineRow } from "./interfaces";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

export module graphBody {
  export const renderGraphBody = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    chart(projectContainer, projects, x, y);
    labels(projectContainer, projects, x, y);
    error(projectContainer, projects, x, y);
  }

  export const error = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    projectContainer.selectAll(".error").remove();
    projectContainer
      .selectAll(".error")
      .data(projects)
      .enter()
      .append("rect")
      .attr("class", "error")
      .attr("y", 30)
      .attr("transform", transforms.errorTransform(x, y))
      .attr("height", 1)
      .attr("display", (d: ProjectTimelineRow) => (d.error ? "" : "none"))
      .attr(
        "width",
        (d: ProjectTimelineRow) => x(d.endDate) - x(d.pmAssignDate)
      );
  };
  export const labels = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    projectContainer.selectAll(".label").remove();
    projectContainer
      .selectAll(".text")
      .data(projects)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("transform", transforms.rectTransform(x, y))
      .attr("x", -80)
      .attr("y", 25)
      .text((d: ProjectTimelineRow) => d.projectName)
      .append("tspan")
      .attr("class", "label")
      .attr("transform", transforms.rectTransform(x, y))
      .attr("x", -80)
      .attr("y", 40)
      .text((d: ProjectTimelineRow) => d.pmAssignDate.toLocaleDateString("en-US"));
  }
  export const chart = (
    projectContainer: Selection<SVGElement, SVGElement>,
    projects: ProjectTimelineRow[],
    x: (s: any) => number,
    y: (d: any) => number
  ) => {
    projectContainer.selectAll(".bar").remove();
    projectContainer
      .selectAll(".chart")
      .data(projects, transforms.keyFunction)
      .enter()
      .append("rect")
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("class", "bar")
      .attr("y", 20)
      .attr("transform", transforms.rectTransform(x, y))
      .attr("height", 20)
      .attr("display", (d: ProjectTimelineRow) => {
        if (
          d.projectName === "" ||
          d.error === null ||
          d.pensDown === null ||
          d.pmAssignDate === null ||
          d.endDate === null
        ) {
          return "none";
        }
        return "";
      })
      .attr("width", (d: ProjectTimelineRow) => x(d.endDate) - x(d.pmAssignDate));
  }
}
