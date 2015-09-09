var current_petition;

$(document).ready(function() {
    $.getJSON("json/petitions/petitions.json", function (data) {
        petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });

        $("#petition").select2();
        var petition_id = $("#petition").val();
        load_petition(petition_id);
    });
});

function load_petition(petition_id) {
    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        current_petition = data;
        display_petition_info(petition_id);
        reload_map();
        $('#key').fadeIn();
    })
    .fail(function() {
        alert("Petition not found!");
    });
}

function display_petition_info() {
    $('#petition_info').hide();
    $('#petition_info').empty();
    $('#petition_info').append('<table></table>');

    var sign_link = "https://petition.parliament.uk/petitions/" + current_petition.data.id + "/signatures/new";
    var count_html = "<span id=\"data-count\"><b>" + current_petition.data.attributes.signature_count + "</b></span>";
    $('#petition_info').append(
        $('<tr></tr>').html("<b>" + current_petition.data.attributes.action + "</b></br>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br>" + current_petition.data.attributes.background + "</br>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br>" + count_html + " signatures")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br><a class=\"flatButton\" href='" + sign_link + "'>Sign Petition</a>")
    );
    $('#petition_info').show();
}

function reload_map() {
    units = "wpc";

    var area = $("input[name='area']:checked").val();

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
}

$("#petition").on('change', function() {
    var petition_id = $("#petition").val()

    load_petition(petition_id);
});

d3.select('#petition_button').on('click', function() {
    petition_id = $('#petition_code').val()
    load_petition(petition_id);

    recolour_map();
});

