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

    export const dealSignIcon = '<g><path d="M0 0h24v24H0z" fill="none" /><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#cc681f" /></g>';
    export const dealSignIconGenerator = (projectContainer: Selection<SVGElement, SVGElement>, x: (s: any) => number, y: (d: any) => number) => {
        projectContainer.selectAll(".icon").remove();
        renderIcon(
          projectContainer,
          "dealSign",
          dealSignIcon,
          transforms.innerIconTransform("dealSign", x, y),
          (d: ProjectTimelineRow) => d.dealSign == null || !isValid(d.dealSign) ? "none" : ""
        );
    };
}