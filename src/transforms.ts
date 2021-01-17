import { ProjectTimelineRow } from './interfaces';
import isValid from "date-fns/isValid";

export module transforms {
    export const keyFunction = (d: ProjectTimelineRow) => d.pmAssignDate + d.projectName + d.endDate;

    export const rectTransform = (x: (s: any) => number, y: (d: any) => number) => (d: ProjectTimelineRow) => "translate(" + x(d.pmAssignDate) + "," + y(d.projectName) + ")";

    export const innerIconTransform = (icon: string, x: (s: any) => number, y: (d: any) => number) =>
      (d: ProjectTimelineRow) => {
        let yOffset = y(d.projectName) + 18;
        let xOffset = 0;
        if (d[icon] != null && isValid(d[icon])) {
          xOffset = x(d[icon]);
        }
        return "translate(" + xOffset + "," + yOffset + ")";
      };

    export const endIconTransform = (icon: string, x: (s: any) => number, y: (d: any) => number) =>
      (d: ProjectTimelineRow) => {
        if (icon === "activeProgram") {
          let yOffset = y(d.projectName) + 18;
          return "translate(" + x(new Date()) + "," + yOffset + ")";
        } else {
          let yOffset = y(d.projectName) + 18;
          return "translate(" + x(d.endDate) + "," + yOffset + ")";
        }
      };

    export const errorTransform = (x: (s: any) => number, y: (d: any) => number) => (d: ProjectTimelineRow) =>
      "translate(" + x(d.pmAssignDate) + "," + y(d.projectName) + ")";
}