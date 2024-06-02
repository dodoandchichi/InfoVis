class MapChart {
    constructor(selector) {
        this.selector = selector;
        this.map = null;
    }

    initialize() {
        this.map = L.map(this.selector).setView([51.505, -0.09], 2); 
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
    }

    async update(matchDate) {
        console.log("함수 호출 되나?:", matchDate); 
        const matches = await d3.csv("../matches_with_coordinates.csv");
        const match = matches.find(d => d.date_GMT === matchDate);

        if (match) {
            const lat = +match.Latitude;
            const lon = +match.Longitude;

            console.log("매치 발견:", match); 
            this.map.flyTo([lat, lon], 13, { duration: 2 }); 

            const homeTeamIcon = L.icon({
                iconUrl: `../logos/${match.home_team_name}.png`, 
                iconSize: [50, 50], 
                iconAnchor: [25, 25], 
                popupAnchor: [0, -25] 
            });

            const marker = L.marker([lat, lon], { icon: homeTeamIcon }).addTo(this.map);
            marker.bindPopup(`
                <div style="text-align:center;">
                    <strong>${match.stadium_name}</strong><br>
                    ${match.date_GMT}
                </div>
            `);
            marker.openPopup();
        } else {
            console.log("맞는 매치가 없음:", matchDate); 
        }
    }
}
