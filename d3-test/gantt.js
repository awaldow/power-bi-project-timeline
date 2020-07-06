d3.gantt = function () {
  var FIT_TIME_DOMAIN_MODE = "fit";
  var FIXED_TIME_DOMAIN_MODE = "fixed";

  var margin = {
    top: 20,
    right: 40,
    bottom: 20,
    left: 150
  };
  var timeDomainStart = d3.timeMonth.offset(new Date(), -40);
  var timeDomainEnd = d3.timeMonth.offset(new Date(), -14);
  var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
  var projects = [];
  var taskStatus = [];
  var height = document.body.clientHeight - margin.top - margin.bottom - 5;
  var width = document.body.clientWidth - margin.right - margin.left - 5;

  var tickFormat = "%m/%d/%Y";

  var keyFunction = function (d) {
    //return d.startDate + d.taskName + d.endDate;
    return d.pmAssignDate + d.projectName + d.endDate;
  };

  var rectTransform = function (d) {
    return "translate(" + x(d.pmAssignDate) + "," + y(d.projectName) + ")";
    //return "translate(" + x(d.pmAssignDate) + "," + 20 + ")";
  };

  var x, y, xAxis, yAxis;

  initAxis();

  var initTimeDomain = function () {
    if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
      if (projects === undefined || projects.length < 1) {
        timeDomainStart = d3.timeMonth.offset(new Date(), -40);
        timeDomainEnd = d3.timeMonth.offset(new Date(), -14);
        return;
      }
      projects.sort(function (a, b) {
        return a.endDate - b.endDate;
      });
      timeDomainEnd = d3.timeMonth.offset(projects[projects.length - 1].endDate, 2);
      if (isNaN(timeDomainEnd)) {
        timeDomainEnd = new Date();
      }
      projects.sort(function (a, b) {
        return a.pmAssignDate - b.pmAssignDate;
      });
      timeDomainStart = d3.timeMonth.offset(projects[0].pmAssignDate, -2);
    }
  };

  function initAxis() {
    x = d3.scaleTime().domain([timeDomainStart, timeDomainEnd]).range([0, width]).clamp(true);

    //y = d3.scaleBand().domain(projects.map(p => p.projectName)).rangeRound([0, height - margin.top - margin.bottom], .1);
    y = d3.scaleOrdinal().domain([0, projects.length]).range([0, projects.length * 20]);

    xAxis = d3.axisTop().scale(x).tickFormat(d3.timeFormat(tickFormat))
      .tickSize(8).ticks(10);

    yAxis = d3.axisLeft().scale(y).tickSize(0);
  };

  function gantt(projects) {
    initTimeDomain();
    initAxis();

    var svg = d3.select("body")
      .append("svg")
      .attr("class", "chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "gantt-chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

    svg.selectAll(".chart")
      .data(projects, keyFunction).enter()
      .append("rect")
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("class", function (d) {
        return "bar";
      })
      //.attr("y", (height / (projects.length * 2)) - margin.top)
      .attr("y", 20)
      .attr("transform", rectTransform)
      .attr("height", function (d) { return 20; })
      .attr("width", function (d) {
        return (x(d.endDate) - x(d.pmAssignDate));
      });

    svg.selectAll(".text")
      .data(projects).enter()
      .append("text")
      .attr("class", "label")
      .attr("transform", rectTransform)
      .attr("x", -40)
      //.attr("y", (height / (projects.length * 2)) - margin.top + 4)
      .attr("y", 25)
      .attr("dy", ".75em")
      .text(function (d) { return d.projectName });

    svg.append("g")
      .attr("class", "x axis")
      //.attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
      .transition()
      .call(xAxis);

    svg.append("g").attr("class", "y axis").transition().call(yAxis);

    return gantt;

  };

  gantt.redraw = function (projects) {

    initTimeDomain();
    initAxis();

    var svg = d3.select("svg");

    var ganttChartGroup = svg.select(".gantt-chart");
    var rect = ganttChartGroup.selectAll("rect").data(projects, keyFunction);

    rect.enter()
      .insert("rect", ":first-child")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("class", function (d) {
        return "bar";
      })
      .transition()
      .attr("y", 0)
      .attr("transform", rectTransform)
      .attr("height", function (d) { return y.range()[1]; })
      .attr("width", function (d) {
        return (x(d.endDate) - x(d.pmAssignDate));
      });

    rect.transition()
      .attr("transform", rectTransform)
      .attr("height", function (d) { return y.range()[1]; })
      .attr("width", function (d) {
        return (x(d.endDate) - x(d.pmAssignDate));
      });

    rect.exit().remove();

    svg.select(".x").transition().call(xAxis);
    svg.select(".y").transition().call(yAxis);

    return gantt;
  };

  gantt.margin = function (value) {
    if (!arguments.length)
      return margin;
    margin = value;
    return gantt;
  };

  gantt.timeDomain = function (value) {
    if (!arguments.length)
      return [timeDomainStart, timeDomainEnd];
    timeDomainStart = +value[0], timeDomainEnd = +value[1];
    return gantt;
  };

  /**
* @param {string}
*                vale The value can be "fit" - the domain fits the data or
*                "fixed" - fixed domain.
*/
  gantt.timeDomainMode = function (value) {
    if (!arguments.length)
      return timeDomainMode;
    timeDomainMode = value;
    return gantt;

  };

  gantt.projects = function (value) {
    if (!arguments.length)
      return projects;
    projects = value;
    return gantt;
  };

  gantt.width = function (value) {
    if (!arguments.length)
      return width;
    width = +value;
    return gantt;
  };

  gantt.height = function (value) {
    if (!arguments.length)
      return height;
    height = +value;
    return gantt;
  };

  gantt.tickFormat = function (value) {
    if (!arguments.length)
      return tickFormat;
    tickFormat = value;
    return gantt;
  };

  return gantt;
};
