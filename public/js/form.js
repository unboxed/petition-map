$(document).ready(function() {
    console.log( "ready!" );
    $.getJSON("json/petitions/petitions.json", function (data) {
        console.log("something");
        petitions = data.data;
        console.log(petitions);
        $.each(petitions, function (index, item) {
            $('#petition').append(
                $('<option></option>').val(item.id).html(item.attributes.action)
            );
            console.log(item.id + " - " + item.attributes.action);
        });
    });
    console.log("done!");
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
        // if(area === 'wal') {
        //     options_string += '<option value = "nawc">National Assembly Wales Constituencies</option>';
        //     options_string += '<option value = "nawer">National Assembly Wales Electoral Regions</option>';
        // } else if(area === 'sco') {
        //     options_string += '<option value = "spc">Scottish Parliament Constituencies</option>';
        //     options_string += '<option value = "sper">Scottish Parliament Electoral Regions</option>';
        // }
    } else {
        // options_string += '<option value="wpc">Westminster Parliamentary Constituencies</option><option value="wards">Westminster Parliamentary Wards</option>';
        // if(area === 'eng' || area === 'wal') {
        //     options_string += '<option value="msoa">Middle Layer Super Output Areas</option>';
        //     options_string += '<option value="lsoa">Lower Layer Super Output Areas</option>';
        // } else if (area === 'sco') {
        //     options_string += '<option value="idz">Intermediate Data Zones</option>';
        //     options_string += '<option value="dz">Data Zones</option>';
        // }
        // options_string += '<option value="oa">Output Areas</option>';
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
        var f = 'json/' + area + '/topo_' + units + '.json';
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

    $.getJSON("json/petitions/" + petition_id + ".json", function (data) {
        constituencies = data.data.attributes.signatures_by_constituency;
        $.each(constituencies, function (index, item) {
            // console.log(item);
            var id = "#" + item.ons_code;
            var colour_class = get_colour_class(item.signature_count);
            d3.select(id)
                .attr("class", colour_class);
        });
    });
}

function get_colour_class(count) {
    if (count <= 50) {
        return "c0-50";
    } else if (count > 50 && count <= 100) {
        return "c51-100";
    } else if (count > 100 && count <= 150) {
        return "c101-150";
    } else if (count > 150 && count <= 200) {
        return "c151-200";
    } else if (count > 200 && count <= 250) {
        return "c201-250";
    } else if (count > 250 && count <= 300) {
        return "c251-300";
    } else if (count > 300 && count <= 350) {
        return "c301-350";
    } else if (count > 350) {
        return "c350on";
    } else {
        return "area";
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
