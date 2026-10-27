// 1. CREATE THE MAP

const map = L.map("map").setView([-25.7545, 28.2330], 16);

const basemap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
    }
).addTo(map);


// 2. LOAD THE GEOJSON FILES

const files = {
    campus: "campus",
    buildings: "footprints",
    pathway: "pathway",
    am: "traffic_am",
    midday: "traffic_mid",
    pm: "traffic_pm",
    bathroom: "bathroom",
    eatery: "eatery"
};

async function loadData(file) {
    try {
        const response = await fetch("data/" + file + ".geojson");

        if (!response.ok) {
            throw new Error("Could not load " + file);
        }

        return await response.json();

    } catch (error) {
        console.log(error);

        return {
            type: "FeatureCollection",
            features: []
        };
    }
}


// 3. POD LOCATIONS 

const pods = [
    {
        name: "Law Building",
        position: [-25.753856, 28.234189]
    },
    {
        name: "Geography Building",
        position: [-25.753581, 28.230406]
    },
    {
        name: "Graduate Centre",
        position: [-25.755231, 28.234380]
    },
    {
        name: "Akanyang & UP Shop",
        position: [-25.7554609883, 28.2343203724]
    }
];


// 4. ADD MAP LAYERS 

async function startMap() {

    const data = {};

    for (const key in files) {
        data[key] = await loadData(files[key]);
    }

    const layers = {};

    layers["Campus"] = L.geoJSON(data.campus, {
        style: {
            color: "#5b3f86",
            fillColor: "#9b7cb8",
            fillOpacity: 0.5
        }
    }).addTo(map);
// add builings and display names of buildings on the map
    layers["Buildings"] = L.geoJSON(data.buildings, {
    style: {
        color: "#b36b00",
        fillColor: "#ff9f1a",
        fillOpacity: 0.85
    },
    onEachFeature: function (feature, layer) {
        const props = feature.properties || {};
        const nameKey = Object.keys(props).find(function (key) {
            return key.toLowerCase() === "name";
        });

        const buildingName = nameKey ? props[nameKey] : "Building";

        layer.bindTooltip(buildingName);
        layer.bindPopup(buildingName);
    }
}).addTo(map);

    layers["Pathways"] = L.geoJSON(data.pathway, {
        style: {
            color: "#e48aa6",
            weight: 2
        }
    }).addTo(map);


    // Add point layers 

    function addPoints(geoData, colour, size) {
        return L.geoJSON(geoData, {
            pointToLayer: function (feature, position) {
                return L.circleMarker(position, {
                    radius: size,
                    color: "#333",
                    fillColor: colour,
                    fillOpacity: 0.85
                });
            }
        }).addTo(map);
    }

    layers["Traffic AM"] = addPoints(data.am, "#f2d02f", 4);
    layers["Traffic Mid"] = addPoints(data.midday, "#a0693c", 4);
    layers["Traffic PM"] = addPoints(data.pm, "#6b3b1c", 4);
    layers["Bathrooms"] = addPoints(data.bathroom, "#e31a1c", 6);
    layers["Eateries"] = addPoints(data.eatery, "#7e6ba8", 7);


    //Add bathroom and eatery names 

    ["Bathrooms", "Eateries"].forEach(function (key) {

        layers[key].eachLayer(function (layer) {

            const props = layer.feature.properties || {};

            const nameKey = Object.keys(props).find(
                name => name.toLowerCase() === "name"
            );

            const name = nameKey ? props[nameKey] : "";

            if (key === "Bathrooms") {
                layer.bindTooltip(name ? "Bathroom - " + name : "Bathroom");
            } else {
                layer.bindTooltip(name || "Unnamed eatery");
            }
        });
    });


    //5. ADD POD MARKERS 

    layers["Pods"] = L.layerGroup();

    pods.forEach(function (pod) {

        const label =
            '<div class="pod-box">' +
                '<div class="pod-name">' + pod.name + '</div>' +
                '<span class="chip chip-syncstudy">SyncStudy</span>' +
                '<span class="chip chip-syncrest">SyncRest</span>' +
            '</div>';

        const marker = L.marker(pod.position, {
            icon: L.divIcon({
                className: "pod-label",
                html: label,
                iconSize: [200, 55],
                iconAnchor: [100, 55]
            })
        });

        marker.bindPopup(
            "<b>" + pod.name + "</b><br>" +
            "SyncStudy and SyncRest"
        );

        marker.addTo(layers["Pods"]);
    });

    layers["Pods"].addTo(map)


    // 6. LAYER CONTROL 

    L.control.layers(
        { "OpenStreetMap": basemap },
        layers,
        {
            collapsed: false,
            position: "topleft"
        }
    ).addTo(map);

    

    /* 7. ZOOM TO THE MAP DATA */

    const bounds = L.featureGroup([
        layers["Campus"],
        layers["Buildings"],
        layers["Pathways"],
        layers["Eateries"],
        layers["Pods"]
    ]).getBounds();

    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

startMap();


