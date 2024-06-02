class BarChart {
    constructor(selector, teamColors) {
        this.selector = selector;
        this.teamColors = teamColors;
        this.width = 400; 
        this.height = 300; 
        this.margin = { top: 20, right: 20, bottom: 50, left: 100 };
        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.selector).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    async update(selectedClub, xAttribute, yAttribute) {
        const data = await d3.csv("https://raw.githubusercontent.com/dodoandchichi/InfoVis/main/player.csv");
        const filteredData = data.filter(d => (selectedClub === "All" || d['Current Club'] === selectedClub) && (xAttribute === "All" || d.position === xAttribute))
            .sort((a, b) => +b[yAttribute] - +a[yAttribute])
            .slice(0, 10);

        d3.select(this.selector).selectAll("svg").remove();

        const svg = d3.select(this.selector).append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[yAttribute])])
            .range([0, this.width]);

        const yScale = d3.scaleBand()
            .domain(filteredData.map(d => d.full_name))
            .range([0, this.height])
            .padding(0.1);

        const bars = svg.selectAll(".bar")
            .data(filteredData);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.full_name))
            .attr("width", 0)
            .attr("height", yScale.bandwidth())
            .attr("fill", d => this.teamColors[d['Current Club']])
            .attr("data-bs-toggle", "tooltip")
            .attr("data-bs-placement", "top")
            .attr("title", d => `Player: ${d.full_name}\nClub: ${d['Current Club']}\n${yAttribute.replace(/_/g, " ")}: ${d[yAttribute]}`)
            .on("click", (event, d) => {
                if (this.handlers["barClick"]) {
                    this.handlers["barClick"](d.full_name);
                }
            })
            .on("mouseover", function (event) {
                const tooltip = bootstrap.Tooltip.getInstance(this);
                if (tooltip) {
                    tooltip.show();
                } else {
                    bootstrap.Tooltip.getOrCreateInstance(this);
                }
            })
            .on("mouseout", function () {
                const tooltip = bootstrap.Tooltip.getInstance(this);
                if (tooltip) {
                    tooltip.hide();
                }
            })
            .transition()
            .duration(1000)
            .attr("width", d => xScale(+d[yAttribute]));

        bars.transition()
            .duration(1000)
            .attr("y", d => yScale(d.full_name))
            .attr("width", d => xScale(+d[yAttribute]));

        bars.exit().remove();

        const logoSize = 30;
        const logos = svg.selectAll(".logo")
            .data(filteredData);

        logos.enter()
            .append("image")
            .attr("class", "logo")
            .attr("x", d => xScale(+d[yAttribute]) + 5)
            .attr("y", d => yScale(d.full_name) + (yScale.bandwidth() - logoSize) / 2)
            .attr("width", 0)
            .attr("height", logoSize)
            .attr("xlink:href", d => `https://dodoandchichi.github.io/InfoVis/logos/${d['Current Club']}.png`)
            .transition()
            .duration(1000)
            .attr("width", logoSize);

        logos.transition()
            .duration(1000)
            .attr("x", d => xScale(+d[yAttribute]) + 5)
            .attr("y", d => yScale(d.full_name) + (yScale.bandwidth() - logoSize) / 2)
            .attr("width", logoSize)
            .attr("height", logoSize);

        logos.exit().remove();

        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.height + this.margin.bottom - 10)
            .attr("text-anchor", "middle")
            .text(yAttribute.replace("_overall", "").replace(/_/g, " ").toUpperCase());
    }

    onBarClick(handler) {
        this.handlers["barClick"] = handler;
    }
}
