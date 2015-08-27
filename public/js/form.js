$(document).ready(function() {
    console.log("READY!");
    $.getJSON("json/petitions/petitions.json", function (data) {
        petitions = data.data;
        // console.log(petitions);
        $.each(petitions, function (index, item) {
            $('#petition').append(
                $('<option></option>').val(item.id).html(item.attributes.action)
            );
            // console.log(item.id + " - " + item.attributes.action);
        });
    });
});

function update_lad_select() {
    var top_level_select = document.getElementById('top_level');
    var area = top_level_select.options[top_level_select.selectedIndex].value;

    options_string = '<option value="national">National</option><option disabled>──────────</option>';
    if(area === 'eng') {
        for (var key in e_lads) {
            if (e_lads.hasOwnProperty(key)) {
                options_string += '<option value=' + key + '>' + e_lads[key] + '</option>';
            }
        }
    } else if(area === 'sco') {
        for (var key in s_lads) {
            if (s_lads.hasOwnProperty(key)) {
                options_string += '<option value=' + key + '>' + s_lads[key] + '</option>';
            }
        }
    } else if(area === 'wal') {
        for (var key in w_lads) {
            if (w_lads.hasOwnProperty(key)) {
                options_string += '<option value=' + key + '>' + w_lads[key] + '</option>';
            }
        }
    } else if(area === 'uk') {

    }
    d3.select('#lad').html(options_string);
}


function update_resolution_select() {
    var top_level_select = document.getElementById('top_level');
    var area = top_level_select.options[top_level_select.selectedIndex].value;

    var lad_select = document.getElementById('lad');
    var lad = lad_select.options[lad_select.selectedIndex].value;

    options_string = '';
    if(lad === 'national') {
        options_string += '<option value="wpc">Westminster Parliamentary Constituencies</option>';
    }
    d3.select('#resolution').html(options_string);
}


function change_area() {
    d3.select('#download').html("");
    var resolution_select = document.getElementById('resolution');
    units = resolution_select.options[resolution_select.selectedIndex].value;

    var top_level_select = document.getElementById('top_level');
    var area = top_level_select.options[top_level_select.selectedIndex].value;

    var lad_select = document.getElementById('lad');
    var lad = lad_select.options[lad_select.selectedIndex].value;

    var f;
    if(lad === 'national') {
        var f = 'json/uk/' + area + '/topo_' + units + '.json';
        d3.select('#download').attr('href', f).attr('target', '_blank').text('download topoJSON');
        load_data(f, units);
    } else {
        var f = 'json/' + area + '/' + units + '_by_lad/topo_' + lad + '.json';
        d3.select('#download').attr('href', f).attr('target', '_blank').text('download topoJSON');
        load_data(f, lad);
    }
}

function display_petition_info() {
    var petitions = document.getElementById('petition');
    var petition_id = petitions.options[petitions.selectedIndex].value;
    // console.log(petition_id);
    $('#petition-info').html("");
    $('#petition-info').append('<table></table>');
    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        $('#petition-info').append(
            $('<tr></tr>').html(data.data.attributes.action + "</br>")
        );
        $('#petition-info').append(
            $('<tr></tr>').html("</br>" + data.data.attributes.background + "</br>")
        );
        $('#petition-info').append(
            $('<tr></tr>').html("</br>" + data.data.attributes.signature_count + " signatures")
        );
        // console.log(data.data.attributes.background);
        country_data = data.data.attributes.signatures_by_country;
        // console.log(country_data);
        $('#countries-info').html("Signatures by Country:" + "</br>");
        $('#countries-info').append('<table></table>');
        $.each(country_data, function(index, item) {
            $('#countries-info').append(
                $('<tr></tr>').html(item.name + " - " + item.signature_count)
            );
        });
    });
}

function recolour_map() {
    var petitions = document.getElementById('petition');
    var petition_id = petitions.options[petitions.selectedIndex].value;
    get_highest_count(petition_id);
}

function get_highest_count(petition_id) {
    var top_count = 0;
    var top_constituency;

    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            if (item.signature_count >= top_count) {
                top_count = item.signature_count;
                top_constituency = item.name;
            }
        });

        // console.log(top_count);
        // console.log(top_constituency);
        get_slices(top_count, petition_id);
    });
}

function get_slices(top_count, petition_id) {
    var slice = top_count / 8;
    var slices = {};
    var current_slice = 0;
    for (i = 0; i <= 8; i++) {
        $('#t' + (i+1)).html("");
        if (i < 7) {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " - " +  Math.floor(current_slice + slice));
        } else {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " +");
        }
        slices[i] = current_slice;
        current_slice += slice;
        // console.log(current_slice);
    }
    // console.log(slices);
    colour_classes(slices, petition_id);
}

function colour_classes(slices, petition_id) {
    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            // console.log(item);
            var id = "#" + item.ons_code;
            var index = place_in_array(slices, item.signature_count);
            var colour_class = "c" + index;
            d3.select(id)
                .attr("class", colour_class);
        });
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


d3.select('#petition').on('change', function(){
    display_petition_info();
    recolour_map();
});

d3.select('#lad').on('change', function(){
    update_resolution_select();
    change_area();
});

d3.select("#top_level").on('change', function(){
    update_lad_select();
    update_resolution_select();
    change_area();
});

d3.select("#resolution").on('change', function(){
    change_area();
});

update_lad_select();
change_area();
