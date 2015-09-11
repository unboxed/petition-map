var current_petition;
var mp_data;

$(document).ready(function() {
    $.getJSON("json/petitions/petitions.json", function (data) {
        petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition_dropdown').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });

        load_mp_data();

        $("#petition_dropdown").select2();
        var petition_id = $("#petition_dropdown").val();
        load_petition(petition_id, false);
    });
});

function load_mp_data() {
    $.getJSON("json/mps/constituency_party_ons.json", function (data) {
        mp_data = data;
        $.each(mp_data, function (index, item) {
            var dropdown_text = item.constituency;
            $('#constituency').append(
                $('<option></option>').val(index).html(dropdown_text)
            );
        });

        $("#constituency").select2();
    });
}

function load_petition(petition_id, is_url) {
    var petition;
    if (is_url) {
        petition = petition_id;
    } else {
        petition = "json/petitions/" + petition_id;
    }

    $.getJSON(petition + ".json", function (data) {
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
    $('#hide_petition_info').prop('checked', false);

    $('#petition_info').hide();
    $('#petition_info').empty();
    $('#petition_info').append('<table></table>');

    var count = number_with_commas(current_petition.data.attributes.signature_count);

    var sign_link = "https://petition.parliament.uk/petitions/" + current_petition.data.id + "/signatures/new";
    var count_html = "<span id=\"data-count\"><b>" + count + "</b></span>";
    var sign_html = "<a class=\"flatButton\" href='" + sign_link + "'>Sign Petition</a>";

    $('#petition_info').append(
        $('<tr></tr>').html("<b>" + current_petition.data.attributes.action + "</b></br>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br>" + current_petition.data.attributes.background + "</br>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br><div id=\"petition_count\"><strong>" + count_html + "</strong> signatures</div>")
    );
    $('#petition_info').append(
        $('<tr></tr>').html("</br>" + sign_html)
    );
    $('#petition_info').show();
}

function reload_map() {
    units = "wpc";

    var area = $("input[name='area']:checked").val();

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
}

$("#petition_dropdown").on('change', function() {
    var petition_id = $("#petition_dropdown").val()

    load_petition(petition_id, false);
});

$("#constituency").on('change', function() {
    var ons_code = $("#constituency").val()

    var constituency_data = {
        "id": ons_code
    }

    select(constituency_data);
});

$("#hide_petition_info").click(function(){
    if($(this).prop("checked") == true){
        $('#petition_info').fadeOut();
    }
    else if($(this).prop("checked") == false){
        $('#petition_info').fadeIn();
    }
});

$("#hide_map_key").click(function(){
    if($(this).prop("checked") == true){
        $('#key').fadeOut();
    }
    else if($(this).prop("checked") == false){
        $('#key').fadeIn();
    }
});

d3.select('#petition_button').on('click', function() {
    petition_url = $('#petition_url').val()
    load_petition(petition_url, true);

    recolour_map();
});

