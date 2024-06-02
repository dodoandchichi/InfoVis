document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        d3.csv("https://raw.githubusercontent.com/dodoandchichi/InfoVis/main/player.csv"),
        d3.csv("https://raw.githubusercontent.com/dodoandchichi/InfoVis/main/rank.csv")
    ]).then(datasets => {
        const playerData = datasets[0];
        const rankData = datasets[1];
        
        localStorage.setItem('rankData', d3.csvFormat(rankData)); 
        initializeDropdowns(playerData, rankData);
        const initialClub = "All";
        const initialPlayer = playerData[0].full_name;
        updateCharts(initialClub, initialPlayer, rankData);
    })

    const initializeDropdowns = (playerData, rankData) => {
        const clubs = Array.from(new Set(playerData.map(d => d['Current Club'])));
        clubs.unshift("All");

        const clubSelect = d3.select('#club-select');
        clubSelect.selectAll('option')
            .data(clubs)
            .enter()
            .append('option')
            .text(d => d);
        clubSelect.node().value = "All";

        const playerSelect = d3.select('#player-select');
        playerSelect.selectAll('option')
            .data(playerData.map(d => d.full_name))
            .enter()
            .append('option')
            .text(d => d);
        playerSelect.node().value = playerData[0].full_name;

        clubSelect.on('change', function() {
            const selectedClub = this.value;
            updateCharts(selectedClub, playerSelect.node().value, rankData);
        });

        playerSelect.on('change', function() {
            const selectedPlayer = this.value;
            updateCharts(clubSelect.node().value, selectedPlayer, rankData);
        });

        d3.selectAll('input[name="x-encoding"]').on('change', function() {
            const selectedClub = d3.select('#club-select').node().value;
            const selectedPlayer = d3.select('#player-select').node().value;
            updateCharts(selectedClub, selectedPlayer, rankData);
        });

        d3.selectAll('input[name="y-encoding"]').on('change', function() {
            const selectedClub = d3.select('#club-select').node().value;
            const selectedPlayer = d3.select('#player-select').node().value;
            updateCharts(selectedClub, selectedPlayer, rankData);
        });
    };

    const updateCharts = (selectedClub, selectedPlayer, rankData) => {
        if (selectedClub === "All") {
            lineCircleChart.update([], "All Teams");
        } else {
            const selectedTeamData = rankData.filter(d => d.Club === selectedClub);
            lineCircleChart.update(selectedTeamData, selectedClub);
        }

        const xAttribute = d3.select('input[name="x-encoding"]:checked').node().value;
        const yAttribute = d3.select('input[name="y-encoding"]:checked').node().value;
        barChart.update(selectedClub, xAttribute, yAttribute);
        radarChart.update(selectedPlayer);
    };

    document.getElementById('reset').addEventListener('click', () => {
        d3.select('#club-select').node().value = "All";
        d3.select('#player-select').node().value = d3.select('#player-select option').node().text;
        d3.select('input[name="x-encoding"][value="All"]').property('checked', true);
        d3.select('input[name="y-encoding"][value="goals_overall"]').property('checked', true);

        const selectedClub = "All";
        const selectedPlayer = d3.select('#player-select').node().value;
        const rankData = d3.csvParse(localStorage.getItem('rankData'));
        updateCharts(selectedClub, selectedPlayer, rankData);

        if (lineCircleChart.activeCircle) {
            lineCircleChart.activeCircle.attr("r", 5);
            lineCircleChart.activeCircle = null;
        }
        if (lineCircleChart.activeTooltip) {
            lineCircleChart.activeTooltip.remove();
            lineCircleChart.activeTooltip = null;
        }

        mapChart.map.setView([51.505, -0.09], 2);
        mapChart.map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                mapChart.map.removeLayer(layer);
            }
        });
    });

    const teamColors = {
        "Arsenal": "#EF0107",
        "Liverpool": "#d33118",
        "Manchester United": "#DA291C",
        "Newcastle United": "#241F20",
        "Chelsea": "#4fb2cc",
        "Southampton": "#D71920",
        "Leicester City": "#FDBE11",
        "Tottenham Hotspur": "#132257",
        "West Ham United": "#2dafe5",
        "Burnley": "#EDE939",
        "Everton": "#003399",
        "AFC Bournemouth": "#EFDBB2",
        "Cardiff City": "#0070B5",
        "Wolverhampton Wanderers": "#FDB913",
        "Manchester City": "#6CABDD",
        "Watford": "#0c7746",
        "Crystal Palace": "#D0D2D3",
        "Huddersfield Town": "#0E63AD",
        "Brighton & Hove Albion": "#0057B8",
        "Fulham": "#000000"
    };

    const barChart = new BarChart("#barchart", teamColors);
    const radarChart = new RadarChart("#radarchart");
    const lineCircleChart = new LineCircleChart("#linecirclechart");
    const mapChart = new MapChart("map");

    lineCircleChart.initialize();
    radarChart.initialize();
    mapChart.initialize();

    lineCircleChart.onCircleClick((matchDate) => {
        mapChart.update(matchDate);
    });

    barChart.onBarClick((playerName) => {
        radarChart.update(playerName);
    });
});
