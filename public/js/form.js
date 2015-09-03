$(document).ready(function() {
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

function change_area() {
    units = "wpc";

    var top_level_select = document.getElementById('top_level');
    var area = top_level_select.options[top_level_select.selectedIndex].value;

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
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
        if (i < 7 && i > 0) {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " - " +  Math.floor(current_slice + slice));
        } else if (i === 7) {
            $('#t' + (i+1)).html(Math.ceil(current_slice) + " +");
        } else {
            $('#t' + (i+1)).html("1 - " +  Math.floor(current_slice + slice));
        }
        slices[i] = current_slice;
        current_slice += slice;
        // console.log(current_slice);
    }
    // console.log(slices);
    colour_classes(slices, petition_id);
}

function colour_classes(slices, petition_id) {
    d3.selectAll(".coloured").attr("class", "area");
    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            // console.log(item);
            var id = "#" + item.ons_code;
            var index = place_in_array(slices, item.signature_count);
            var colour_class = "c" + index + " coloured";
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
    $('#key').fadeIn();
});

d3.select("#top_level").on('change', function(){
    change_area();
});

change_area();
