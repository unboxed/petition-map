var current_petition;
var mp_data;

$(document).ready(function() {
    $.getJSON("https://petition.parliament.uk/petitions.json?state=open", function (data) {
        petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition_dropdown').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
            $('#petition_dropdown_mobile').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });

        load_mp_data();

        var variables = get_url_variables();

        $("#petition_dropdown").select2();
        $("#petition_dropdown_mobile").select2();
        $("#area_dropdown").select2();

        var petition_id;
        if ($(window).width() > 720) {
            console.log("desktop")
            petition_id = $("#petition_dropdown").val();
        } else {
            console.log("mobile");
            petition_id = $("#petition_dropdown_mobile").val();
        }

        if (!jQuery.isEmptyObject(variables)) {
            petition_id = variables.petition;
            $("input[name='area'][value=" + variables.area + "]").prop("checked",true);
        }

        load_petition(petition_id, false);
    });
});

function get_url_variables() {
    var variables = {}, hash;
    var hashes = window.location.href
                    .slice(window.location.href.indexOf('?') + 1)
                    .split('&');

    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        variables[hash[0]] = hash[1];
    }

    if (!hash[1]) {
        variables = {};
    }

    return variables;
}

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
        petition = "https://petition.parliament.uk/petitions/" + petition_id;
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
    var count_html = "<span id=\"data_count\">" + count + "</span>";
    var sign_html = "<a class=\"flat_button sign\" href='" + sign_link + "'><i class=\"fa fa-pencil\"></i> Sign Petition</a>";

    if ($(window).width() > 720) {
        $('#petition_info').append(
            $('<tr></tr>').html("<div id=\"petition_action\">" + current_petition.data.attributes.action + "<div>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + current_petition.data.attributes.background + "</br>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br><div>" + count_html + " <span id=\"signatures\">signatures</span></div>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + sign_html)
        );
        $('#petition_info').show();
    } else {
        $('#petition_info').append(
            $('<tr></tr>').html("<div id=\"petition_action\">" + current_petition.data.attributes.action + "<div>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br><div>" + count_html + " <span id=\"signatures\">signatures</span></div>")
        );
        $('#petition_info').append(
            $('<tr></tr>').html("</br>" + sign_html)
        );
        $('#petition_info').show();
    }
}

function reload_map() {
    units = "wpc";

    var area = $("input[name='area']:checked").val();

    if ($(window).width() < 720) {
        area = $("#area_dropdown").val();
    }

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
}

$("#area_dropdown").on('change', function() {
    units = "wpc";

    var area = $("#area_dropdown").val()
    console.log(area);

    var f = 'json/uk/' + area + '/topo_' + units + '.json';
    load_data(f, units);
});

$("#petition_dropdown").on('change', function() {
    var petition_id = $("#petition_dropdown").val()

    load_petition(petition_id, false);
});

$("#petition_dropdown_mobile").on('change', function() {
    var petition_id = $("#petition_dropdown_mobile").val()

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

$('#petition_get_link').click(function() {
    var root_url = window.location.origin;
    var petition = current_petition.data.id;
    var area = $("input[name='area']:checked").val();
    var link = root_url + "/?" + "petition=" + petition + "&area=" + area;

    $('#petition_link').val(link);
    $('#petition_link').fadeIn();
    $('#petition_link').focus().select();

    $('#link_help').fadeIn();

    console.log(link);
});

d3.select('#petition_button').on('click', function() {
    petition_url = $('#petition_url').val()
    load_petition(petition_url, true);

    recolour_map();
});

