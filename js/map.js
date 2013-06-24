var Fish = Fish || {};

Fish.csv_file = './fish.csv';
Fish.json_file = './vt.json';
Fish.cloudmade_api_key = '8ee2a50541944fb9bcedded5165f09d9';
Fish.data_field = 'total';
Fish.default_center = [44, -72.4];
Fish.default_zoom = 8;
Fish.default_color = '#ccc';
Fish.ranges = {
    'Orange Red': ['#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    'Blue Green': ['#CCECE6', '#99D8C9', '#66C2A4', '#2CA25F', '#006D2C', '#238B45', '#006D2C', '#00441B'],
    'Blue Purple': ['#BFD3E6', '#9EBCDA', '#8C96C6', '#8856A7', '#810F7C', '#88419D', '#810F7C', '#4D004B'],
    'Green Blue': ['#CCEBC5', '#A8DDB5', '#7BCCC4', '#43A2CA', '#0868AC', '#2B8CBE', '#0868AC', '#084081'],
    'Purple Blue': ['#D0D1E6', '#A6BDDB', '#74A9CF', '#2B8CBE', '#045A8D', '#0570B0', '#045A8D', '#023858']
};
Fish.range = 'Orange Red';
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
    'Mapbox: Natural Earth': new L.TileLayer.MapBox({user: 'mapbox', map: 'natural-earth-2'})
};
Fish.basemap_layer = 'OpenCycleMap';
Fish.species_acronym_map = {
    bkt: 'Brook Trout',
    lat: 'Lake Trout',
    rbt: 'Rainbow Trout',
    stt: 'Steelhead Trout',
    bnt: 'Brown Trout',
    las: 'Landlocked Salmon'
};

Fish.fill_algorithm = function(d) {
    var val = d.properties[Fish.data_field];

    if (val) {
        return Fish.color(val);
    } else {
        // return Fish.default_color;
        return null;

    }
};

Fish.get_feature_bounds = function(feature) {
    var coordinates = feature.geometry.coordinates[0],
        bounds;

    for (var i = 0; i < coordinates.length; i++) {
        var latlng = coordinates[i],
            latlng = new L.LatLng(latlng[1], latlng[0]);

        if (i === 0) {
            bounds = new L.LatLngBounds(latlng);
        }

        if (latlng.lat > 0) {
            bounds.extend(latlng);
        }
    }

    return bounds;
}

// Initialize leaflet map
Fish.map = new L.Map('map', {
    center: Fish.default_center,
    zoom: Fish.default_zoom,
    zoomControl: false
});

Fish.map.addLayer(Fish.basemaps[Fish.basemap_layer]);

var svg = d3.select(Fish.map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

Fish.draw_features = function() {
    var topology = Fish.topology;

    for (var i = 0; i < Fish.data.length; i++) {
        var zip = "0" + Fish.data[i].parent;

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
        var yPosition = d3.mouse(this)[1] - 10;

        g.append('text')
            .attr('id', 'tooltip')
            .attr('x', function() {
                if (xPosition < 400) {
                    return xPosition + 40; }
                else if (xPosition < 420) {
                    return xPosition + 20; }
                else if (xPosition > 650) {
                    return xPosition - 20; }
                else {
                    return xPosition }})
            .attr('y', function() {
                if (yPosition < 210) { return yPosition + 30 } else {
                    return yPosition -10 }})
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

    Fish.features.on('click', Fish.select_feature);

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

Fish.select_feature = function(feature) {
    var bounds = Fish.get_feature_bounds(feature),
        town = feature.properties.town
        table_rows = [];

    // Get associated rows from csv
    var town_data = Fish.data.filter(function(row) {
        return row.parent == town;
    });

    for (var i = 0; i < town_data.length; i++) {
        var csv_row = town_data[i];

        $.each(Fish.species_acronym_map, function(k, species) {
            var count = parseInt(csv_row[k]),
                length = parseFloat(csv_row[k + '-length']),
                table_row = {
                    'town': csv_row.town,
                    'waterway': csv_row.water,
                    'species': species,
                    'length': length,
                    'count': count
                };

            if (count) {
                table_rows.push(table_row);
            }
        });
    }

    // Sort the table rows by town then waterway
    table_rows = table_rows.sort(function(a, b) {
        return a.waterway > b.waterway;
    });

    table_rows = table_rows.sort(function(a, b) {
        return a.town > b.town;
    });

    $('#infobox h3, #infobox p').hide();
    $('#infobox table').show();
    $('#infobox tbody tr').remove();

    var towns = [];

    for (var i = 0; i < table_rows.length; i++) {
        var row = table_rows[i],
            tr = $('<tr />');

        tr.append($('<td />', {html: row.town}));
        tr.append($('<td />', {html: row.waterway}));
        tr.append($('<td />', {html: row.species}));
        tr.append($('<td />', {html: row.length.toFixed(1) + '&rdquo;'}));
        tr.append($('<td />', {html: add_commas(row.count)}));

        $('#infobox tbody').append(tr);

        towns.push(row.town);
    }

    if (!table_rows.length) {
        var tr = $('<tr />');

        tr.append($('<td />', {
            colspan: 5,
            html: '<strong>No fish stocked in this town :(</strong>'
        }));

        $('#infobox tbody').append(tr);
    }

    // Hide town column if only one town_data
    towns = uniquify_array(towns);

    if (towns.length == 1) {
        $('#infobox td:first-child, #infobox th:first-child').hide();
    } else {
        $('#infobox td:first-child, #infobox th:first-child').show();
    }

    $('#infobox h2').text(town);

    Fish.map.fitBounds(bounds.pad(0.25));
    if (d3.select('#map .active')) {
        d3.select('#map .active').attr('class', '').style('fill', Fish.fill_algorithm);
    }
    d3.select(this).attr('class', 'active');
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

        Fish.build_quantiles();

        Fish.load_json();
    });
}

Fish.build_quantiles = function() {
    // Grab the values to quantile
    Fish.domain = Fish.data.map(function(row) {
        return parseInt(row[Fish.data_field]);
    });

    Fish.domain = Fish.domain.filter(function(val) {
        return val;
    });

    // Define scale to sort data values into color buckets
    Fish.color = d3.scale.quantile()
        .domain(Fish.domain)
        .range(Fish.ranges[Fish.range]);
}

Fish.init_species_menu = function() {
    var species = $('#species li');

    species.click(function() {
        $(this).parent().find('.active').removeClass('active');
        $(this).addClass('active');

        Fish.data_field = $(this).data('field');

        Fish.build_quantiles();

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

    zcta.chosen();

    zcta.change(function() {
        var town = $(this).val(),
            features = Fish.collection.features,
            bounds;

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];

            if (feature.properties.town == town) {
                Fish.select_feature(feature);
                break;
            }
        }
    });

    var color = $('#color');

    color.change(function() {
        var color = $(this).val();

        Fish.range = color;

        // Define scale to sort data values into color buckets
        Fish.color = d3.scale.quantile()
            .domain(Fish.domain)
            .range(Fish.ranges[Fish.range]);
        Fish.redraw_features();
    });

    $.each(Fish.ranges, function(k, range) {
        option = $('<option/>', {
            value: k,
            text: k
        });

        if (k == Fish.range) {
            option.attr('selected', 'selected');
        }

        color.append(option);
    });

    color.chosen();

    var basemap = $('#basemap');

    basemap.change(function() {
        Fish.map.removeLayer(Fish.basemaps[Fish.basemap_layer]);
        Fish.basemap_layer = $(this).val();
        Fish.map.addLayer(Fish.basemaps[Fish.basemap_layer]);
    });

    $.each(Fish.basemaps, function(k, v) {
        option = $('<option/>', {
            value: k,
            text: k,
        });

        if (k == Fish.basemap_layer) {
            option.attr('selected', 'selected');
        }

        basemap.append(option);
    });

    basemap.chosen();
};

Fish.update_zoom_control = function(features) {
    var select = $('#zcta');

    select.find('option').remove();

    features = features.filter(function(feature) {
        return 'MASTER' == feature.properties.water;
    });

    for (var i = 0; i < features.length; i++) {
        var feature = features[i];

        var option = $('<option/>', {
            value: feature.properties.town,
            text: feature.properties.town
        });
        select.append(option);
    }

    select.trigger('liszt:updated');
}

function add_commas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

function uniquify_array(arr) {
  var i,
      len=arr.length,
      out=[],
      obj={};

  for (i=0;i<len;i++) {
    obj[arr[i]]=0;
  }
  for (i in obj) {
    out.push(i);
  }
  return out;
}

$(document).ready(function() {
    Fish.load_csv();
    Fish.init_species_menu();
    Fish.init_controls();
});
