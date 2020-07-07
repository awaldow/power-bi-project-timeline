var projects = [
    {
        projectName: "Altera",
        pmAssignDate: new Date("6/1/2015"),
        endDate: new Date("11/30/2018"),
        milestones: [
            {
                milestoneType: "Deal Sign",
                milestoneDate: new Date("6/1/2015"),
            },
            {
                milestoneType: "Deal Close/Day 1",
                milestoneDate: new Date("7/13/2015"),
            },
        ],
    },
    {
        projectName: "eASIC",
        pmAssignDate: new Date("2/2/2018"),
        endDate: new Date(),
        milestones: [
            {
                milestoneType: "Deal Sign",
                milestoneDate: new Date("8/7/2018"),
            },
            {
                milestoneType: "Deal Close/Day 1",
                milestoneDate: new Date("9/9/2018"),
            },
        ],
    },
];

projects.sort(function (a, b) {
    return a.pmAssignDate - b.pmAssignDate;
});

// tasks.sort(function (a, b) {
//     return a.endDate - b.endDate;
// });
// var maxDate = tasks[tasks.length - 1].endDate;
// tasks.sort(function (a, b) {
//     return a.startDate - b.startDate;
// });
// var minDate = tasks[0].startDate;

var format = "%m/%d/%Y";

var gantt = d3.gantt().projects(projects).tickFormat(format);
gantt(projects);