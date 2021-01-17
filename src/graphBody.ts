import { transforms } from './transforms';
import { ProjectTimelineRow } from './interfaces';

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

export module graphBody {
  export const error = (projectContainer: Selection<SVGElement, SVGElement>, projects: ProjectTimelineRow[], x: (s: any) => number, y: (d: any) => number) => {
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
      .attr("display", (d: ProjectTimelineRow) => d.error ? "" : "none")
      .attr("width", (d: ProjectTimelineRow) => x(d.endDate) - x(d.pmAssignDate));
  };
}
