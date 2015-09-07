$(document).ready(function() {
    $.getJSON("https://preview.epetitions.website/petitions.json?state=open", function (data) {
        petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });
        $("#petition").select2();
        change_area();
        $('#key').fadeIn();
    });
});

function change_area() {
    units = "wpc";

    var area = $("input[name='area']:checked").val();

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
}

function display_petition_info() {
    var petitions = document.getElementById('petition');
    var petition_id = petitions.options[petitions.selectedIndex].value;
    $('#petition_info').hide();
    $('#petition_info').empty();
    $('#petition_info').append('<table></table>');
    $.getJSON("https://preview.epetitions.website/petitions/" + petition_id + ".json", function (data) {
        var sign_link = "https://petition.parliament.uk/petitions/" + data.data.id + "/signatures/new";
        var count_html = "<span id=\"data-count\"><b>" + data.data.attributes.signature_count + "</b></span>";
        $('#petition_info').append(
            $('<tr></tr>').html("<b>" + data.data.attributes.action + "</b></br>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + data.data.attributes.background + "</br>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + count_html + " signatures")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br><a class=\"submitButton\" href='" + sign_link + "'>Sign Petition</a>")
        );
        $('#petition_info').show();
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

    $.getJSON("https://preview.epetitions.website/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            if (item.signature_count >= top_count) {
                top_count = item.signature_count;
                top_constituency = item.name;
            }
        });

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
    }
    colour_classes(slices, petition_id);
}

function colour_classes(slices, petition_id) {
    d3.selectAll(".coloured").attr("class", "area");
    $.getJSON("https://preview.epetitions.website/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            var id = "#" + item.ons_code;
            var index = place_in_array(slices, item.signature_count);
            var colour_class = "c" + index + " coloured";
            d3.select(id)
                .attr("class", colour_class)
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

$("#petition").on('change', function() {
    display_petition_info();
    recolour_map();
    $('#key').fadeIn();
});

d3.select('#petition_button').on('click', function() {
    code = $('#petition_code').val();
    $.getJSON("https://preview.epetitions.website/petitions/" + code + ".json", function (data) {
        console.log(data);
    });
});

