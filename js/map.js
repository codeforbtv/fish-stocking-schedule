var Fish = Fish || {};

Fish.csv_file = 'irene-funding-test.csv';
Fish.json_file = 'vt.json';
Fish.cloudmade_api_key = '8ee2a50541944fb9bcedded5165f09d9';
Fish.data_field = 'fema';
Fish.default_center = [44, -72.4];
Fish.default_zoom = 8;
Fish.default_color = '#ccc';
Fish.ranges = {
    parrilla: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    bluegreen: ['#EDF8FB', '#CCECE6', '#99D8C9', '#66C2A4', '#2CA25F', '#006D2C', '#238B45', '#006D2C', '#00441B'],
    bluepurple: ['#EDF8FB', '#BFD3E6', '#9EBCDA', '#8C96C6', '#8856A7', '#810F7C', '#88419D', '#810F7C', '#4D004B'],
    greenblue: ['#F0F9E8', '#CCEBC5', '#A8DDB5', '#7BCCC4', '#43A2CA', '#0868AC', '#2B8CBE', '#0868AC', '#084081'],
    orangered: ['#FEF0D9', '#FDD49E', '#FDBB84', '#FC8D59', '#E34A33', '#B30000', '#D7301F', '#B30000', '#7F0000'],
    purpleblue: ['#F1EEF6', '#D0D1E6', '#A6BDDB', '#74A9CF', '#2B8CBE', '#045A8D', '#0570B0', '045A8D', '#023858']
}
Fish.range = Fish.ranges.parrilla;
Fish.basemaps = {
    'Cloudmade: Fine Line': new L.TileLayer.CloudMade({key: Fish.cloudmade_api_key, styleId: 1}),
    'Cloudmade: Fresh': new L.TileLayer.CloudMade({key: Fish.cloudmade_api_key, styleId: 997}),
    'Cloudmade: Red Alert': new L.TileLayer.CloudMade({key: Fish.cloudmade_api_key, styleId: 8}),
    'Cloudmade: Midnight': new L.TileLayer.CloudMade({key: Fish.cloudmade_api_key, styleId: 999}),
    'OpenStreetMap': new L.TileLayer.OpenStreetMap(),
    'OpenCycleMap': new L.TileLayer.OpenCycleMap(),
    'Mapquest OSM': new L.TileLayer.MapQuestOpen.OSM(),
    'Mapquest Aerial': new L.TileLayer.MapQuestOpen.Aerial(),
    'Mapbox: World Bright': new L.TileLayer.MapBox({user: 'mapbox', map: 'world-bright'}),
    'Mapbox: Map Vyofok3q': new L.TileLayer.MapBox({user: 'examples', map: 'map-vyofok3q'}),
    'Mapbox: Iceland': new L.TileLayer.MapBox({user: 'kkaefer', map: 'iceland'}),
    'Mapbox: Natural Earth': new L.TileLayer.MapBox({user: 'mapbox', map: 'natural-earth-2'}),
}
Fish.basemap_layer = Fish.basemaps['Mapquest OSM'];

Fish.fill_algorithm = function(d) {
    var val = d.properties[Fish.data_field];

    if (val) {
        return Fish.color(val);
    } else {
        // return Fish.default_color;
        return null;

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
Fish.map = new L.Map('map', {
    center: Fish.default_center,
    zoom: Fish.default_zoom,
    zoomControl: false
});

Fish.map.addLayer(Fish.basemap_layer);

var svg = d3.select(Fish.map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

// var y = d3.scale.sqrt()
//     .domain([0, 2700000])
//     .range([0,325]);

// var yAxis = d3.svg.axis()
//     .scale(y)
//     .tickValues(Fish.color.domain())
//     .orient("right");

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

    var bounds = d3.geo.bounds(collection),
        path = d3.geo.path().projection(project);

    Fish.features = g.selectAll("path")
        .data(collection.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', Fish.fill_algorithm);

    Fish.features.on('mouseover', function(d) {
        var xPosition = d3.mouse(this)[0];
        var yPosition = d3.mouse(this)[1] - 30;

        g.append('text')
            .attr('id', 'tooltip')
            .attr('x', xPosition)
            .attr('y', yPosition)
            .attr('text-anchor', 'middle')
            .text(d.properties.town);

        d3.select(this).style('fill', "#509e2f");
    });

    Fish.features.on('mouseout', function(d) {
        d3.select("#tooltip").remove();
        if (d3.select(this).attr('class') !== 'active') {
            d3.select(this).transition().duration(250).style({'fill': Fish.fill_algorithm, opacity: 0.75});
        }
    });

    Fish.features.on('click', function(d) {
        var bounds = Fish.get_feature_bounds(d);
        Fish.map.fitBounds(bounds.pad(0.25));
        if (d3.select('#map .active')) {
            d3.select('#map .active').attr('class', '').style('fill', Fish.fill_algorithm);
        }
        d3.select(this).attr('class', 'active');
    });

    Fish.map.on('viewreset', reset);
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

        Fish.features.attr("d", path);
    }

    // Use Leaflet to implement a D3 geographic projection.
    function project(x) {
        var point = Fish.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        return [point.x, point.y];
    }
}

Fish.redraw_features = function() {
    Fish.features.transition().duration(500).style('fill', Fish.fill_algorithm);
}

Fish.load_json = function() {
    d3.json(Fish.json_file, function(error, topology) {
        // Store the topology
        Fish.topology = topology;

        Fish.draw_features();

        Fish.update_zoom_control(Fish.collection.features);
    });
}

Fish.load_csv = function() {
    d3.csv(Fish.csv_file, function(data) {
        // Store the data
        Fish.data = data;

        // Grab the values to quantile
        Fish.domain = Fish.data.map(function(row) {
            return row[Fish.data_field];
        });

        // Define scale to sort data values into color buckets
        Fish.color = d3.scale.quantile()
            .domain(Fish.domain)
            .range(Fish.range);

        Fish.load_json();
    });
}

Fish.init_species_menu = function() {
    var species = $('#species li');

    species.click(function() {
        $(this).parent().find('.active').removeClass('active');
        $(this).addClass('active');

        Fish.data_field = $(this).data('field');
        Fish.redraw_features();
    });
};

Fish.init_controls = function() {
    var buttons = $('#zoom button');

    buttons.click(function() {
        var zoom = $(this).data('zoom');

        switch(zoom) {
            case 'state':
                Fish.map.setView(Fish.default_center, Fish.default_zoom);
            case 'zoom-in':
                Fish.map.zoomIn();
            case 'zoom-out':
                Fish.map.zoomOut();
        }
    });

    var zcta = $('#zcta');

    zcta.change(function() {
        var town = $(this).val(),
            features = Fish.collection.features,
            bounds;

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];

            if (feature.properties.town == town) {
                bounds = Fish.get_feature_bounds(feature);
                Fish.map.fitBounds(bounds.pad(0.25));
                break;
            }
        }
    });

    var color = $('#color');

    color.change(function() {
        var color = $(this).val();

        Fish.range = Fish.ranges[color];

        // Define scale to sort data values into color buckets
        Fish.color = d3.scale.quantile()
            .domain(Fish.domain)
            .range(Fish.range);
        Fish.redraw_features();
    });

    $.each(Fish.ranges, function(k, range) {
        option = $('<option/>', {
            value: k,
            text: k
        });
        color.append(option);
    });

    var basemap = $('#basemap');

    basemap.change(function() {
        Fish.map.removeLayer(Fish.basemap_layer);
        Fish.basemap_layer = Fish.basemaps[$(this).val()];
        Fish.map.addLayer(Fish.basemap_layer);
    });

    $.each(Fish.basemaps, function(k, v) {
        option = $('<option/>', {
            value: k,
            text: k
        });
        basemap.append(option);
    });
};

Fish.update_zoom_control = function(features) {
    var select = $('#zcta');

    select.find('option').remove();

    for (var i = 0; i < features.length; i++) {
        var feature = features[i],
            option = $('<option/>', {
            value: feature.properties.town,
            text: feature.properties.town
        });
        select.append(option);
    }
}

$(document).ready(function() {
    Fish.load_csv();
    Fish.init_species_menu();
    Fish.init_controls();
});
