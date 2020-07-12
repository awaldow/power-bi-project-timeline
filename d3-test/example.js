var projects = [
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
        milestones: [
        ],
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
        milestones: [
        ],
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
        milestones: [
        ],
    },
    {
        projectName: "Pens Down Test",
        pmAssignDate: new Date("7/20/2016"),
        endDate: new Date("9/20/2016"),
        dealSign: null,
        dealClose: null,
        day2: null,
        error: false,
        activeProgram: false,
        pensDown: true,
        milestones: [
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