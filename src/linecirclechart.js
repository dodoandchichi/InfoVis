class LineCircleChart {
    margin = { top: 40, right: 20, bottom: 50, left: 70 };
  
    constructor(selector, width = 800, height = 400) {
      this.selector = selector;
      this.width = width - this.margin.left - this.margin.right;
      this.height = height - this.margin.top - this.margin.bottom;
      this.activeCircle = null;
      this.activeTooltip = null;
      this.handlers = {};
    }
  
    initialize() {
      this.svg = d3.select(this.selector).append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  
      this.xScale = d3.scaleLinear().range([0, this.width]);
      this.yScale = d3.scaleLinear().range([this.height, 0]);
    }
  
    update(teamData, teamName) {
      this.svg.selectAll("*").remove();
  
      if (this.activeTooltip) {
        this.activeTooltip.remove();
        this.activeTooltip = null;
      }
  
      if (teamName === "All Teams") {
        this.xScale.domain([1, 38]);
        this.yScale.domain([20, 1]);
  
        const xAxis = d3.axisBottom(this.xScale).ticks(38);
        this.svg.append("g")
          .attr("transform", `translate(0,${this.height})`)
          .call(xAxis)
          .append("text")
          .attr("x", this.width / 2)
          .attr("y", 40)
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Matches Played");
  
        this.svg.append("g")
          .call(d3.axisLeft(this.yScale))
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -50)
          .attr("x", -this.height / 2)
          .attr("dy", "1em")
          .attr("fill", "black")
          .style("text-anchor", "middle")
          .text("Rank");
  
        this.svg.append("text")
          .attr("x", this.margin.left)
          .attr("y", this.margin.top / 2)
          .attr("fill", "black")
          .style("font-size", "16px")
          .style("font-weight", "bold")
          .text(teamName);
  
        return;
      }
  
      if (!teamData.length) {
        return;
      }
  
      const maxMatch = d3.max(teamData, d => +d.Match);
      this.xScale.domain([1, maxMatch]);
      this.yScale.domain([20, 1]);
  
      const lineGenerator = d3.line()
        .x(d => this.xScale(+d.Match))
        .y(d => this.yScale(+d.Rank))
        .curve(d3.curveMonotoneX);
  
      const path = this.svg.append("path")
        .datum(teamData)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);
  
      const totalLength = path.node().getTotalLength();
      path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
  
      const circles = this.svg.selectAll(".match-point")
        .data(teamData);
  
      circles.enter()
        .append("circle")
        .attr("class", "match-point")
        .attr("cx", d => this.xScale(+d.Match))
        .attr("cy", d => this.yScale(+d.Rank))
        .attr("r", 0)
        .attr("fill", d => d.Result === 'Win' ? "green" : d.Result === 'Draw' ? "grey" : "red")
        .on("click", (event, d) => {
          if (this.activeCircle) {
            this.activeCircle.attr("r", 5);
            this.activeCircle = null;
          }
          if (this.activeTooltip) {
            this.activeTooltip.remove();
            this.activeTooltip = null;
          }
  
          this.activeCircle = d3.select(event.currentTarget);
          this.activeCircle.attr("r", 10);
  
          const tooltip = d3.select("body").append("div")
            .attr("class", "circle-tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("padding", "5px")
            .style("border", "1px solid black")
            .style("border-radius", "5px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("z-index", 1000)
            .html(`${d.home_team_name} vs ${d.away_team_name}<br>Score: ${d.home_team_goal_count} - ${d.away_team_goal_count}`)
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 40}px`);
  
          this.activeTooltip = tooltip;
  
          if (this.handlers["circleClick"]) {
            this.handlers["circleClick"](d.date_GMT);
          }
        })
        .merge(circles)
        .transition()
        .duration(750)
        .attr("r", 5);
  
      circles.exit()
        .transition()
        .duration(750)
        .attr("r", 0)
        .remove();
  
      const xAxis = d3.axisBottom(this.xScale).ticks(maxMatch);
      this.svg.append("g")
        .attr("transform", `translate(0,${this.height})`)
        .call(xAxis)
        .append("text")
        .attr("x", this.width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Matches Played");
  
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -this.height / 2)
        .attr("dy", "1em")
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Rank");
  
      this.svg.append("text")
        .attr("x", this.margin.left)
        .attr("y", this.margin.top / 2)
        .attr("fill", "black")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(teamName);
    }
  
    onCircleClick(handler) {
      this.handlers["circleClick"] = handler;
    }
  }
  