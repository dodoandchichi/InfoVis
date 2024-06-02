class RadarChart {
    margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    constructor(selector, width = 450, height = 450) {
      this.selector = selector;
      this.width = width - this.margin.left - this.margin.right;
      this.height = height - this.margin.top - this.margin.bottom;
      this.radius = Math.min(this.width, this.height) / 2;
    }
  
    initialize() {
      d3.select(this.selector).append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", `translate(${(this.width + this.margin.left + this.margin.right) / 2}, ${(this.height + this.margin.top + this.margin.bottom) / 2})`);
    }
  
    async update(selectedPlayer) {
      const data = await d3.csv("../player.csv");
  
      function calculatePercentile(attribute, value) {
        const sortedValues = data.map(d => +d[attribute]).sort(d3.ascending);
        const rank = sortedValues.indexOf(+value) + 1;
        return (rank / sortedValues.length) * 100;
      }
  
      const playerData = data.filter(d => d.full_name === selectedPlayer);
      if (!playerData.length) return;
  
      const attributes = [
        { name: "minutes_played_overall", label: "Minutes Played" },
        { name: "appearances_overall", label: "Appearances" },
        { name: "goals_overall", label: "Goals" },
        { name: "assists_overall", label: "Assists" },
        { name: "clean_sheets_overall", label: "Clean Sheets" }
      ];
  
      const playerAttributes = attributes.map(attr => ({
        metric: attr.label,
        value: calculatePercentile(attr.name, playerData[0][attr.name]) / 100,
        percentile: Math.round(calculatePercentile(attr.name, playerData[0][attr.name]))
      }));
  
      d3.select(this.selector).selectAll("svg").remove();
  
      const svg = d3.select(this.selector).append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", `translate(${(this.width + this.margin.left + this.margin.right) / 2}, ${(this.height + this.margin.top + this.margin.bottom) / 2})`);
  
      const radarLine = d3.lineRadial()
        .radius(d => this.radius * d.value)
        .angle((d, i) => (i * 2 * Math.PI) / playerAttributes.length)
        .curve(d3.curveLinearClosed);
  
      const axisGrid = svg.append("g").attr("class", "axisWrapper");
  
      axisGrid.selectAll(".levels")
        .data(d3.range(1, 6).reverse())
        .enter().append("circle")
        .attr("class", "gridCircle")
        .attr("r", d => this.radius / 5 * d)
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", 0.1);
  
      const axes = axisGrid.selectAll(".axis")
        .data(playerAttributes)
        .enter().append("g")
        .attr("class", "axis");
  
      axes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => this.radius * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .attr("y2", (d, i) => this.radius * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .style("stroke", "white")
        .style("stroke-width", "2px");
  
      svg.append("text")
        .attr("x", -this.width / 1.6)
        .attr("y", -this.height / 2)
        .attr("text-anchor", "start")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(selectedPlayer);
  
      const radarWrapper = svg.append("g").attr("class", "radarWrapper");
  
      const radarArea = radarWrapper.append("path")
        .datum(playerAttributes)
        .attr("class", "radarArea")
        .attr("d", radarLine)
        .style("fill", "#4CAF50")
        .style("fill-opacity", 0.5)
        .style("stroke-width", "2px")
        .style("stroke", "#4CAF50")
        .style("opacity", 0.7);
  
      radarWrapper.selectAll(".radarCircle")
        .data(playerAttributes)
        .enter().append("circle")
        .attr("class", "radarCircle")
        .attr("r", 0)
        .attr("cx", (d, i) => this.radius * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .attr("cy", (d, i) => this.radius * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .style("fill", "#4CAF50")
        .style("fill-opacity", 0.8)
        .transition()
        .duration(750)
        .attr("r", 4);
  
      radarWrapper.selectAll(".radarCircle")
        .data(playerAttributes)
        .exit()
        .transition()
        .duration(750)
        .attr("r", 0)
        .remove();
  
      radarArea.transition()
        .duration(750)
        .attrTween("d", function(d) {
          const previous = this._previous || d;
          const current = d;
          this._previous = current;
          return function(t) {
            return radarLine(current.map((point, i) => ({
              ...point,
              value: previous[i].value + (current[i].value - previous[i].value) * t
            })));
          };
        });
  
      radarWrapper.selectAll(".radarCircle")
        .data(playerAttributes)
        .transition()
        .duration(750)
        .attr("cx", (d, i) => this.radius * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .attr("cy", (d, i) => this.radius * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2));
  
      axes.append("rect")
        .attr("x", (d, i) => (this.radius + 20) * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2) - 15)
        .attr("y", (d, i) => (this.radius + 20) * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2) - 10)
        .attr("width", 30)
        .attr("height", 20)
        .attr("rx", 5)
        .attr("ry", 5)
        .style("fill", "#4CAF50")
        .style("fill-opacity", 0.75);
  
      axes.append("text")
        .attr("class", "percentile")
        .text(d => d.percentile)
        .attr("x", (d, i) => (this.radius + 20) * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .attr("y", (d, i) => (this.radius + 20) * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .style("font-size", "12px")
        .style("fill", "white")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em");
  
      axes.append("text")
        .attr("class", "legend")
        .text(d => d.metric)
        .attr("x", (d, i) => this.radius * Math.cos(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .attr("y", (d, i) => this.radius * Math.sin(i * 2 * Math.PI / playerAttributes.length - Math.PI / 2))
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em");
    }
  }
  