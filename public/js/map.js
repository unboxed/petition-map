// get the width of the area we're displaying in
var width;
// but we're using the full window height
var height;

// variables for map drawing
var projection, svg, path, g;
var boundaries, units;

function compute_size() {
    var margin = 50;
    width = parseInt(d3.select("#map").style("width"));
    height = window.innerHeight - (2 * margin);
}

compute_size();
// initialise the map
init(width, height);

function clear_info() {
    $('#data_table').hide();
    $('#data_table').empty();
}

function init(width, height) {

    // pretty boring projection
    projection = d3.geo.albers()
        .rotate([0, 0]);

    path = d3.geo.path()
        .projection(projection);

    // create the svg element for drawing onto
    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    // graphics go here
    g = svg.append("g");
}

// select a map area
function select(d) {
    var petitions = document.getElementById('petition');
    var petition_id = petitions.options[petitions.selectedIndex].value;

    $('#data_table').empty();
    $('#data_table').show();
    $('#data_table').append('<table></table>');
    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        var name;
        var mp;
        var count;
        $.each(data.data.attributes.signatures_by_constituency, function(i, v) {
                if (v.ons_code === d.id) {
                    name = v.name;
                    mp = v.mp;
                    count = v.signature_count;
                    return;
                }
        });
        var name_html = "<div id=\"data-name\">" + name + "</div>";
        var mp_html = "<div id=\"data-mp\">" + mp + "<div>";
        var count_html = "<span id=\"data-count\"><b>" + count + "</b></span>";
        if (name && mp && count) {
            $('#data_table').append(
                $('<tr></tr>').html(name_html + mp_html + count_html + " signatures")
            );
        }
    });
}

// draw our map on the SVG element
function draw(boundaries) {

    projection
        .scale(1)
        .translate([0,0]);

    // compute the correct bounds and scaling from the topoJSON
    var b = path.bounds(topojson.feature(boundaries, boundaries.objects[units]));
    var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);

    // add an area for each feature in the topoJSON
    g.selectAll(".area")
        .data(topojson.feature(boundaries, boundaries.objects[units]).features)
        .enter().append("path")
        .attr("class", "area")
        .attr("id", function(d) {return d.id})
        .attr("d", path)
        .on("mouseenter", function(d){ return select(d)})
        .on("mouseleave", function(d){ return clear_info(d)});

    // add a boundary between areas
    g.append("path")
        .datum(topojson.mesh(boundaries, boundaries.objects[units], function(a, b){ return a !== b }))
        .attr('d', path)
        .attr('class', 'boundary');
}

// called to redraw the map - removes map completely and starts from scratch
function redraw() {
    compute_size();

    d3.select("svg").remove();

    init(width, height);
    draw(boundaries);
}

// loads data from the given file and redraws and recolours the map
function load_data(filename, u) {
    units = u;
    var f = filename;

    d3.json(f, function(error, b) {
        if (error) return console.error(error);
        boundaries = b;
        redraw();
        recolour_map();
        display_petition_info();
    });
}

// when the window is resized, redraw the map
window.addEventListener('resize', redraw);


