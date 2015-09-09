var width, height;

var active = d3.select(null);

var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoomed);

var projection, svg, path, g;
var boundaries, units;

function compute_size() {
    var margin = 15;
    width = parseInt(d3.select("#map").style("width"));
    height = window.innerHeight - margin;
}

compute_size();
init(width, height);

function init(width, height) {

    projection = d3.geo.albers()
        .rotate([0, 0]);

    path = d3.geo.path()
        .projection(projection);

    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
            .call(zoom)
        .append("g")
        .on("click", stopped, true);

    g = svg.append("g");
}


function select(d) {
    var petition_id = localStorage.getItem("petition_id");

    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        $('#data-box').fadeIn("fast");
        $('#data-box').html("");
        var name, mp, count;
        $.each(data.data.attributes.signatures_by_constituency, function(i, v) {
            if (v.ons_code === d.id) {
                name = v.name;
                mp = v.mp;
                count = v.signature_count;
                return;
            }
        });

        $('#data-box').append('<div id="data-name">' + name + "</div>");
        $('#data-box').append('<div id="data-mp">' + mp + '</div>');
        $('#data-box').append('<div id="data-count"><strong>' + count + '</strong> signatures</div>');
    });
}

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .3 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
}

function interpolateZoom (translate, scale) {
    var self = this;
    return d3.transition().duration(350).tween("zoom", function () {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
            iScale = d3.interpolate(zoom.scale(), scale);
        return function (t) {
            zoom
                .scale(iScale(t))
                .translate(iTranslate(t));
            zoomed();
        };
    });
}

function zoomButton() {
    var clicked = d3.event.target,
        direction = 1,
        factor = 0.2,
        target_zoom = 1,
        center = [width / 2, height / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    d3.event.preventDefault();
    direction = (this.id === 'zoom_in') ? 1 : -1;
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
    view.k = target_zoom;
    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    interpolateZoom([view.x, view.y], view.k);
}

function zoomed() {
  svg.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function reset() {
    active.classed("active", false);
    active = d3.select(null);

    svg.transition()
        .call(zoom.translate([0, 0]).scale(1).event);
}

$("#reset").on('click', function() {
    reset();
});

d3.selectAll('.zoom').on('click', zoomButton);

// draw our map on the SVG element
function draw(boundaries) {

    projection
        .scale(1)
        .translate([0,0]);

    // compute the correct bounds and scaling from the topoJSON
    var b = path.bounds(topojson.feature(boundaries, boundaries.objects[units]));
    var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);
    var t = [((width - s * (b[1][0] + b[0][0])) / 1.8), (height - s * (b[1][1] + b[0][1])) / 2];

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
        .on("mouseleave", function(d){ return $('#data-box').show() })
        .on("click", clicked);

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
        var petition_id = localStorage.getItem("petition_id")
        recolour_map(petition_id);
        display_petition_info(petition_id);
    });
}

function recolour_map(petition_id) {
    get_highest_count(petition_id);
}

function get_highest_count(petition_id) {
    var top_count = 0;
    var top_constituency;

    constituencies = current_petition.data.attributes.signatures_by_constituency;
    $.each(constituencies, function (index, item) {
        if (item.signature_count >= top_count) {
            top_count = item.signature_count;
            top_constituency = item.name;
        }
    });

    draw_slices(top_count, petition_id);
}

function draw_slices(top_count, petition_id) {
    var goalBinSize = Math.floor(top_count / 8)
    var roundBy = Math.pow(10, Math.floor(goalBinSize.toString().length / 2))
    var binSize = Math.round(goalBinSize/ roundBy) * roundBy;

    slices = {};
    for (i = 0; i <= 8; i++) {
        slices[i] = i * Math.round(goalBinSize / roundBy) * roundBy;
    }

    for (i = 0; i <= 8; i++) {
        $('#t' + (i+1)).html("");
        if (i === 0) {
            $('#t' + (i+1)).html("1 - " +  slices[i + 1]);
        } else if (i === 7) {
            $('#t' + (i + 1)).html(slices[i] + " +");
        } else {
            $('#t' + (i + 1)).html(slices[i] + " - " +  slices[i + 1]);
        }
    }

    colour_classes(slices, petition_id);
}

function colour_classes(slices, petition_id) {
    d3.selectAll(".coloured").attr("class", "area");

    constituencies = current_petition.data.attributes.signatures_by_constituency;
    $.each(constituencies, function (index, item) {
        var id = "#" + item.ons_code;
        var index = place_in_array(slices, item.signature_count);
        var colour_class = "c" + index + " coloured";
        d3.select(id)
            .attr("class", colour_class)
    });
}

function place_in_array(slices, count) {
    var slice = slices[1];
    for (i = 0; i < 8; i++) {
        if (count >= slices[i] && count < (slices[i] + slice)) {
            return i+1;
        } else if (count === (slices[1] * 8)) {
            return 8;
        }
    }
}

// when the window is resized, redraw the map
window.addEventListener('resize', redraw);
