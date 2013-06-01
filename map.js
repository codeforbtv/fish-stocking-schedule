var Fish = Fish || {};

// Initialize leaflet map
var cloudmade_api_key = '8ee2a50541944fb9bcedded5165f09d9',
    cloudmade_attribution,
    map = new L.Map('map', {
      center: [43.8, -72.7],
      zoom: 8
    });

map.addLayer(new L.TileLayer('http://{s}.tile.cloudmade.com/'+ cloudmade_api_key +'/998/256/{z}/{x}/{y}.png'));

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

// Define scale to sort data values into color buckets
var color = d3.scale.threshold()
    .domain([1000, 10000, 50000, 100000, 200000, 500000, 1000000, 2500000])
    .range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]);

var y = d3.scale.sqrt()
    .domain([0, 2700000])
    .range([0,325]);

var yAxis = d3.svg.axis()
    .scale(y)
    .tickValues(color.domain())
    .orient("right");

var json_loaded = function(error, vt) {
    // console.log(topology);

    for (var i = 0; i < Fish.data.length; i++) {
        var dataTown = Fish.data[i].town;
        var dataZip = "0" + Fish.data[i].zipcode;
        var dataFEMA = parseFloat(Fish.data[i].fema);

        for (var j = 0; j < vt.objects.vermont.geometries.length; j++) {
            var jsonZip = vt.objects.vermont.geometries[j].properties.zipcode;

            if (dataZip == jsonZip) {
                vt.objects.vermont.geometries[j].properties.town = dataTown;
                vt.objects.vermont.geometries[j].properties.fema = dataFEMA;

                break;
            }
        }
    }

    var collection = topojson.feature(vt, vt.objects.vermont);
    // console.log(collection);

    var bounds = d3.geo.bounds(collection),
        path = d3.geo.path().projection(project);

    var feature = g.selectAll("path")
        .data(collection.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function(d) {
            var fema = d.properties.fema;

            if (fema) {
                return color(fema);
            } else {
                return "#ccc";
            }
        })

        .on("mouseover", function(d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1] - 30;

            svg.append("text")
                .attr("id", "tooltip")
                .attr("x", xPosition)
                .attr("y", yPosition)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "black")
                .text(d.properties.town);

            d3.select(this)
            .style("fill", "#509e2f");
        })
        .on("mouseout", function(d) {
            d3.select("#tooltip").remove();

            d3.select(this)
            .transition()
            .duration(250)
            .style("fill", function(d) {
            var fema = d.properties.fema;

            if (fema) {
                return color(fema);
            } else {
                return "#ccc";
            }
        });
    });

    map.on('viewreset', reset);
    reset();

    // Reposition the SVG to cover the features.
    function reset() {
        var bottomLeft = project(bounds[0]),
            topRight = project(bounds[1]);

        svg.attr("width", topRight[0] - bottomLeft[0])
            .attr("height", bottomLeft[1] - topRight[1])
            .style("margin-left", bottomLeft[0] + "px")
            .style("margin-top", topRight[1] + "px");

        g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");

        feature.attr("d", path);
    }

    // Use Leaflet to implement a D3 geographic projection.
    function project(x) {
        var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        return [point.x, point.y];
    }
}

var load_json = function() {
    d3.json('vt.json', json_loaded);
}

var csv_loaded = function(data) {
    Fish.data = data;
    load_json();
}

var load_csv = function() {
    d3.csv('irene-funding.csv', csv_loaded);
}

load_csv();
