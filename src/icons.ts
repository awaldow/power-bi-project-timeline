import { transforms } from './transforms';
import isValid from "date-fns/isValid";
import { ProjectTimelineRow } from './interfaces';

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

export module icons {
    function renderIcon(
        svgContainer: Selection<SVGElement, SVGElement>,
        iconType: string,
        iconSvg: string,
        transformFunction: (d: ProjectTimelineRow) => string,
        displayFunction: (d: ProjectTimelineRow) => string
      ) {
        svgContainer
          .selectAll(".icons")
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

    export const dealSignIcon = (projectContainer: Selection<SVGElement, SVGElement>, icon: string, x: (s: any) => number, y: (d: any) => number) => {
        projectContainer.selectAll(".icon").remove();
        renderIcon(
          projectContainer,
          "dealSign",
          icon,
          transforms.innerIconTransform("dealSign", x, y),
          (d: ProjectTimelineRow) => d.dealSign == null || !isValid(d.dealSign) ? "none" : ""
        );
    };
}