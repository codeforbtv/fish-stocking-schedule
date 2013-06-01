var Fish = Fish || {};

Fish.csv_file = 'irene-funding-test.csv';
Fish.json_file = 'vt.json';
Fish.cloudmade_api_key = '8ee2a50541944fb9bcedded5165f09d9';
Fish.data_field = 'fema';
Fish.default_color = '#ccc';

Fish.fill_algorithm = function(d) {
    var val = d.properties[Fish.data_field];

    console.log(val);

    if (val) {
        return color(val);
    } else {
        return Fish.default_color;
    }
}

Fish.get_feature_bounds = function(feature) {
    var coordinates = feature.geometry.coordinates[0],
        bounds;

    for (var i = 0; i < coordinates.length; i++) {
        var latlng = coordinates[i],
            latlng = new L.LatLng(latlng[1], latlng[0]);

        if (i == 0) {
            bounds = new L.LatLngBounds(latlng);
        }

        bounds.extend(latlng);
    }

    return bounds;
}

// Initialize leaflet map
var map = new L.Map('map', {
      center: [43.8, -72.7],
      zoom: 8
    });

map.addLayer(new L.TileLayer('http://{s}.tile.cloudmade.com/'+ Fish.cloudmade_api_key +'/998/256/{z}/{x}/{y}.png'));

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

Fish.json_loaded = function(error, topology) {
    Fish.topology = topology;
    Fish.draw_features();
}

Fish.draw_features = function() {
    var topology = Fish.topology;

    for (var i = 0; i < Fish.data.length; i++) {
        var zip = "0" + Fish.data[i].zipcode;

        for (var j = 0; j < topology.objects.vermont.geometries.length; j++) {
            var jsonZip = topology.objects.vermont.geometries[j].properties.zipcode;

            if (zip == jsonZip) {
                topology.objects.vermont.geometries[j].properties = Fish.data[i];
                break;
            }
        }
    }

    var collection = topojson.feature(topology, topology.objects.vermont);

    Fish.collection = collection;
    // console.log(collection);

    var bounds = d3.geo.bounds(collection),
        path = d3.geo.path().projection(project);

    Fish.feature = g.selectAll("path")
        .data(collection.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', Fish.fill_algorithm);

    Fish.feature.on('mouseover', function(d) {
        var xPosition = d3.mouse(this)[0];
        var yPosition = d3.mouse(this)[1] - 30;

        g.append("text")
            .attr("id", "tooltip")
            .attr("x", xPosition)
            .attr("y", yPosition)
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr('fill', "black")
            .text(d.properties.town);

        d3.select(this).style('fill', "#509e2f");
    });

    Fish.feature.on('mouseout', function(d) {
        d3.select("#tooltip").remove();
        if (d3.select(this).attr('class') !== 'active') {
            d3.select(this).transition().duration(250).style('fill', Fish.fill_algorithm);
        }
    });

    Fish.feature.on('click', function(d) {
        var bounds = Fish.get_feature_bounds(d);
        map.fitBounds(bounds.pad(0.25));
        d3.select('.active').attr('class', '').style('fill', Fish.fill_algorithm);
        d3.select(this).attr('class', 'active').style('fill', "#509e2f");
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

        Fish.feature.attr("d", path);
    }

    // Use Leaflet to implement a D3 geographic projection.
    function project(x) {
        var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        return [point.x, point.y];
    }
}

Fish.redraw_features = function() {
    Fish.feature.transition().duration(250).style('fill', Fish.fill_algorithm);
}

Fish.load_json = function() {
    d3.json(Fish.json_file, Fish.json_loaded);
}

Fish.load_csv = function() {
    d3.csv(Fish.csv_file, function(data) {
        Fish.data = data;
        Fish.load_json();
    });
}

Fish.init_species_menu = function() {
    var menu = $('#species ul'),
        species = menu.find('li');

    species.click(function() {
        $(this).parent().find('.active').removeClass('active');
        $(this).addClass('active');

        Fish.data_field = $(this).data('field');
        Fish.redraw_features();
    });
};

$(document).ready(function() {
    Fish.load_csv();
    Fish.init_species_menu();
});
