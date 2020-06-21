import "./../style/visual.less";
import {
    event as d3Event,
    select as d3Select
} from "d3-selection";
import {
    scaleLinear,
    scaleBand
} from "d3-scale";

import { axisBottom } from "d3-axis";

import powerbiVisualsApi from "powerbi-visuals-api";

type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;
import ScaleLinear = d3.ScaleLinear;
const getEvent = () => require("d3-selection").event;

interface ProjectTimelineViewModel {
    projects: ProjectTimelineRow[];
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
                milestoneDate: new Date("6/1/2015")
            },
            {
                milestoneType: "Deal Close/Day 1",
                milestoneDate: new Date("7/13/2015")
            }
        ]
    },
    {
        projectName: "eASIC",
        pmAssignDate: new Date("2/2/2018"),
        endDate: new Date(""),
        milestones: [
            {
                milestoneType: "Deal Sign",
                milestoneDate: new Date("8/7/2018")
            },
            {
                milestoneType: "Deal Close/Day 1",
                milestoneDate: new Date("9/9/2018")
            }
        ]
    }
];

let viewModel: ProjectTimelineViewModel = {
    projects
};