(function($, PetitionMap) {
  PetitionMap.current_petition = PetitionMap.current_petition || undefined;
  PetitionMap.mp_data = PetitionMap.mp_data || undefined;
  PetitionMap.population_data = PetitionMap.population_data || undefined;
  PetitionMap.current_area = PetitionMap.current_area || undefined;
  PetitionMap.map_mode = PetitionMap.map_mode || undefined;
  PetitionMap.signature_buckets = PetitionMap.signature_buckets || undefined;
  PetitionMap.weighted_current_petition = PetitionMap.weighted_current_petition || undefined;
  PetitionMap.is_weighted = PetitionMap.is_weighted || true;

  var ui_hidden = false,
    spinnerOpts = { // Options for loading spinner
      lines: 13,
      length: 28,
      width: 14,
      radius: 42,
      scale: 0.5,
      corners: 1,
      color: '#000',
      opacity: 0.25,
      rotate: 0,
      direction: 1,
      speed: 1,
      trail: 60,
      fps: 20,
      zIndex: 2e9,
      className: 'spinner',
      top: '50%',
      left: '50%',
      shadow: false,
      hwaccel: false
    },
    // Start spinner and attach to target
    target = document.getElementById('spinner_area'),
    spinner = new Spinner(spinnerOpts).spin(target);

  function populatePetitionDropdown() {
    return $.getJSON("https://petition.parliament.uk/petitions.json?state=open")
      .done(function (data) {
        var petitions = data.data;
        $.each(petitions, function (index, item) {
            var dropdown_text = item.attributes.action;
            $('#petition_dropdown').append(
                $('<option></option>').val(item.id).html(dropdown_text)
            );
        });
      });
  };

  // On start load the petition data
  $(document).ready(function() {
    $.when(populatePetitionDropdown(), loadPopulationData(), loadMPData()).then(function() {
      preparePetitionAndView();
    });
  });

  // Setup petition ui and map based on initial url params
  function preparePetitionAndView() {
    var variables = getURLVariables(),
        area,
        petition_id;

    if (variables.petition !== undefined) {
      petition_id = variables.petition;
    } else {
      petition_id = $("#petition_dropdown").val();
    }

    area = 'uk';
    if (variables.area !== undefined) {
      if (possibleAreas().indexOf(variables.area) !== -1) {
        area = variables.area;
      }
    }
    PetitionMap.current_area = area;

    map_mode = 'topo';
    if (variables.map_mode !== undefined) {
      if (possibleMapModes().indexOf(variables.map_mode) !== -1) {
        map_mode = variables.map_mode;
      }
    }
    PetitionMap.map_mode = map_mode;

    $('input[name=area][value=' + area + ']').prop('checked',true);
    $('input[name=map_mode][value=' + map_mode + ']').prop('checked',true);
    $('#petition_dropdown option[value=' + petition_id + ']').prop('selected', true);
    return loadPetition(petition_id, false);
  }

  function possibleAreas() {
    var possibleAreas = [];
    $.each($('input[name=area]'), function(idx, elem) { possibleAreas[idx] = $(elem).attr('value'); });
    return possibleAreas;
  }

  function possibleMapModes() {
    var possibleMapModes = [];
    $.each($('input[name=map_mode]'), function(idx, elem) { possibleMapModes[idx] = $(elem).attr('value'); });
    return possibleMapModes;
  }

  // Extracts variables from url
  function getURLVariables() {
    var variables = {},
      keyValuePairs = window.location.search.substring(1).split('&');

    if (keyValuePairs == "") return {};
    for (var i = 0; i < keyValuePairs.length; ++i) {
      var keyValuePair = keyValuePairs[i].split('=', 2);
      if (keyValuePair.length == 1)
        variables[keyValuePair[0]] = "";
      else
        variables[keyValuePair[0]] = decodeURIComponent(keyValuePair[1].replace(/\+/g, " "));
    }
    return variables;
  };

  // Loads MP JSON data and fills constituency dropdown
  function loadMPData() {
    return $.getJSON("https://petition.parliament.uk/constituencies.json")
      .done(function (data) {
        PetitionMap.mp_data = data;
        var sorted_mp_data = []
        for (a in data) {
          sorted_mp_data.push({id: a, text: data[a].constituency})
        };
        sorted_mp_data.sort(function(a, b) {
          return a.text.localeCompare(b.text);
        }),
        $.each(sorted_mp_data, function (_idx, item) {
          $('#constituency').append(
              $('<option></option>').val(item.id).html(item.text)
          );
        });
      });
  }

  // Load population JSON data
  function loadPopulationData() {
    return $.getJSON("json/mps/population_ons.json")
      .done(function (data) {
        PetitionMap.population_data = data;
      });
  }

  function convertDataToSimplifiedFormat(current_petition) {
    var signatures = current_petition.data.attributes.signatures_by_constituency;
    var converted_data = {};
    for (i = 0; i < signatures.length; i++) {
        var ons_code = signatures[i].ons_code;
        var converted;
        if (PetitionMap.is_weighted) {
          var constituency_pop = PetitionMap.population_data[ons_code].population;
          converted = (signatures[i].signature_count / constituency_pop) * 10000;
        } else {
          converted = signatures[i].signature_count;
        }
        converted_data[signatures[i].ons_code] = converted;
    }
    return converted_data;
  }

  // Get petition Url from ref - might be a number (from params or
  // dropdown) or a full url (from text input)
  function getPetitionUrlFromReference(petitionReference) {
    petitionReference = petitionReference.trim();
    if (petitionReference.match(/^https:\/\/petition\.parliament\.uk(?:\/archived)?\/petitions\/\d+/i)) {
      return petitionReference.replace(/(\/|\.json)$/,'');
    } else if (petitionReference.match(/^\d+$/)) {
      return 'https://petition.parliament.uk/petitions/' + petitionReference;
    } else {
      return ''
    }
  }

  // Loads petition from UK Government Petition site
  function loadPetition(petitionReference) {
    var petitionUrl = getPetitionUrlFromReference(petitionReference),
      deferredPetitionLoadedAndDrawn = new $.Deferred();

    $.getJSON(petitionUrl + '.json')
      .done(function (data) {
        PetitionMap.current_petition = data;
        PetitionMap.weighted_current_petition = convertDataToSimplifiedFormat(data);
        PetitionMap.signature_buckets = SignatureBuckets(PetitionMap.weighted_current_petition);
        updateKey(PetitionMap.signature_buckets.buckets);
        $.when(reloadMap()).then(function () {
          deferredPetitionLoadedAndDrawn.resolve();
        }, function() {
          deferredPetitionLoadedAndDrawn.reject();
        });
        addPetitionToDropdown(petitionReference, data.data.attributes.action);
      })
      .fail(function() {
        alert('Petition not found! (Looking for: '+petitionReference+')');
        deferredPetitionLoadedAndDrawn.reject();
      });

    return deferredPetitionLoadedAndDrawn;
  }

  // Adds petition to dropdown list if it is not in list of most popular
  function addPetitionToDropdown(petitionReference, petitionAction) {
    if (!$('#petition_dropdown option[value=' + petitionReference + ']').val()) {
      $('#petition_dropdown').append(
        $('<option></option>').val(petitionReference).html(petitionAction)
      );
      $('#petition_dropdown option[value=' + petitionReference + ']').prop('selected', true);
    }
  }

  function updateKey(fromBuckets) {
    if (PetitionMap.is_weighted) {
      $('#t1').html("0% - " +  (fromBuckets[1] / 100) + "%");
      for (i = 1; i <= 6; i++) {
        $('#t' + (i + 1)).html((fromBuckets[i] / 100) + "% - " + (fromBuckets[i + 1] / 100) + "%");
      }
      $('#t8').html((fromBuckets[7] / 100) + "% +");
    } else {
      $('#t1').html("1 - " +  fromBuckets[1]);
      for (i = 1; i <= 6; i++) {
        $('#t' + (i + 1)).html((fromBuckets[i] + 1) + " - " +  fromBuckets[i + 1]);
      }
      $('#t8').html((fromBuckets[7] + 1) + " +");
    }
  }

  function SignatureBuckets(fromPetition) {
    function getHighestCount(fromConstituencies) {
      var highest_count = 0;

      $.each(fromConstituencies, function (index, item) {
          if (item >= highest_count) {
            highest_count = item;
          }
      });

      return highest_count;
    }

    function extractBuckets(highestCount) {
      var goalBinSize = Math.floor(highestCount / 8)
      var roundBy = Math.pow(10, Math.floor(goalBinSize.toString().length / 2))
      var binSize = Math.round(goalBinSize/ roundBy) * roundBy;

      var buckets = {};
      for (i = 0; i <= 8; i++) {
        buckets[i] = i * binSize;
      }

      return buckets;
    }

    return {
      buckets: extractBuckets(getHighestCount(fromPetition)),
      bucketFor: function(count) {
        for(var i = 0; i < 8; i++) {
          if (count <= this.buckets[i]) {
            return i;
          }
        }
        return 8;
      }
    }
  }

  // Display petition info in panel
  function displayPetitionInfo() {
    $('#petition_info').hide();

    var count = numberWithCommas(PetitionMap.current_petition.data.attributes.signature_count);

    var sign_link = 'https://petition.parliament.uk/petitions/' + PetitionMap.current_petition.data.id;
    var count_html = '<p class="signatures_count"><span class="data">' + count + '</span> signatures</p>';
    var sign_html = '<a class="flat_button sign" id="sign_petition_btn" href="' + sign_link + '"><i class="fa fa-pencil"></i> Sign Petition</a>';

    var petition_details =
      '<div class="petition-details">' +
        '<h2>' + PetitionMap.current_petition.data.attributes.action + '</h2>' +
        count_html +
        '<div>' + sign_html +'</div>' +
      '</div>';

    $('#petition_info .petition-details').replaceWith(petition_details);
    $('#petition_info').show();

    // returns the status of petition i.e. 'closed', 'open'
    var petitionStatus = PetitionMap.current_petition.data.attributes.state

    if (petitionStatus === 'open') {
      $('#sign_petition_btn').show();
    } else {
      $('#sign_petition_btn').hide();
    }
  }

  // Reset zoom and reload map with new area
  function changeArea() {
    spinner.spin(target);
    PetitionMap.current_area = $("input[name='area']:checked").val();
    PetitionMap.resetMapState();
    $.when(reloadMap()).then(function() {
      pushstateHandler();
    });
  }

  // Reset zoom and reload map with new mode
  function changeMapMode() {
    spinner.spin(target);
    PetitionMap.map_mode = $("input[name='map_mode']:checked").val();
    PetitionMap.resetMapState();
    $.when(reloadMap()).then(function() {
      pushstateHandler();
    });
  }

  function changeColouring() {
    var colouring = $("input[name='weighted']:checked").val();
    if (colouring === "percentage") {
      PetitionMap.is_weighted = true;
    } else {
      PetitionMap.is_weighted = false;
    }
    spinner.spin(target);
    preparePetitionAndView();
  }

  // Reload map
  function reloadMap() {
    var dataFile = 'json/uk/' + PetitionMap.current_area + '/' + PetitionMap.map_mode + '_wpc.json';
    return $.when(PetitionMap.loadMapData(dataFile, 'wpc')).then(function() {
      displayPetitionInfo();
      $('#key').fadeIn();
      spinner.stop();
    });
  }

  function showPetitionFromDropdown() {
    spinner.spin(target);
    var petition_id = $("#petition_dropdown").val()

    $.when(loadPetition(petition_id, false)).then(function() {
      pushstateHandler();
    });
  };

  function showPetitionFromUrlInput() {
    spinner.spin(target);

    var petition_url = $('#petition_url').val()

    $.when(loadPetition(petition_url, false)).then(function() {
      pushstateHandler();
    });
  };

  function highlightConstituencyFromDropdown() {
    var ons_code = $("#constituency").val();

    $(window).trigger('petitionmap:constituency-on', ons_code);
  };

  function selectConstituencyInDropdown(_event, constituency_id) {
    $('#constituency option[value='+constituency_id+']').prop('selected', true);
  }

  function displayConstituencyInfo(_event, constituency_id) {
    var mpForConstituency = PetitionMap.mp_data[constituency_id];
    var population = PetitionMap.population_data[constituency_id].population;
    var percentage = PetitionMap.weighted_current_petition[constituency_id];

    if (percentage !== undefined) {
      if (PetitionMap.is_weighted) {
        percentage = PetitionMap.weighted_current_petition[constituency_id] / 100;
      } else {
        percentage = (PetitionMap.weighted_current_petition[constituency_id] / population) * 100;
      }
      percentage = Math.round(percentage * 100) / 100;
    } else {
      percentage = 0;
    }

    $('#constituency_info').hide();
    $('#constituency_info').html("");

    var count = "0",
        data_found = false;

    $.each(PetitionMap.current_petition.data.attributes.signatures_by_constituency, function(i, v) {
      if (v.ons_code === constituency_id) {
        count = v.signature_count;
        return;
      }
    });

    $('#constituency_info').append('<h2>' + mpForConstituency.constituency + "</h2>");
    $('#constituency_info').append('<p class="mp">' + (mpForConstituency.mp || "") + '</p>');
    $('#constituency_info').append('<p class="party">' + (mpForConstituency.party || "") + '</p>');
    $('#constituency_info').append('<p class="signatures_count"><span class="data">' + numberWithCommas(count) + '</span> signatures</p>');
    $('#constituency_info').append('<p class="percentage">' + percentage + "% of " + numberWithCommas(population) + " constituents" + '</p>');
    if (!ui_hidden) {
      $('#constituency_info').show();
    }
  }

  function hideConstituencyInfo(_event, _constituency_id) {
    //$('#constituency_info').show();
  }

  function toggleFormUI() {
    if (ui_hidden) {
      $('#petition_info, #key, #controls, #constituency_info').fadeIn();
      $('footer .hide-ui').html("Hide UI");
      ui_hidden = false;
    } else {
      $('#petition_info, #key, #controls, #constituency_info').fadeOut();
      $('footer .hide-ui').html("Show UI");
      ui_hidden = true;
    }
  };

  function invokeAboutModal() {
    // Clone modal
    var modal_panel = $("#about-modal .about-panel").clone();

    // Open modal
    vex.dialog.open({
      message: modal_panel,
      buttons: [
        $.extend({}, vex.dialog.buttons.NO, { text: 'Close' })
      ]
    });
  }

  function invokeShareModal() {
    var state = buildCurrentState(),
      url = buildCurrentURL(state);

    // Clone modal
    var modal_panel = $("#share-modal .share-panel").clone();
    modal_panel.find('input[name=petition-link]').val(url);

    // Open modal
    vex.dialog.open({
      message: modal_panel,
      buttons: [
        $.extend({}, vex.dialog.buttons.NO, { text: 'Close' })
      ]
    });
  };

  ////////////////////////////////////////////////////////////////////////


  // Area selection
  $("input[name='area']").on('change', changeArea);

  // Map mode selection
  $("input[name='map_mode']").on('change', changeMapMode);

  // Weighted selection
  $("input[name='weighted']").on('change', changeColouring);

  // Petition selection
  $("#petition_dropdown").on('change', showPetitionFromDropdown);

  $('#petition_button').on('click', showPetitionFromUrlInput);

  // Constituency selection
  $("#constituency").on('change', highlightConstituencyFromDropdown);

  // React to constituency change events
  $(window).on('petitionmap:constituency-on', displayConstituencyInfo);
  $(window).on('petitionmap:constituency-on', selectConstituencyInDropdown);

  $(window).on('petitionmap:constituency-off', hideConstituencyInfo);

  // Create & open sharing modal
  $('.share-button').on('click', invokeShareModal);

  // Button to hide UI
  $('.hide-ui').on('click', toggleFormUI);

  // Create & open about modal
  $('.about-button').on('click', invokeAboutModal);

  function buildCurrentState() {
    var state = {};
    if (PetitionMap.current_petition !== undefined) {
      state.petition = PetitionMap.current_petition.data.id;
    }
    if (PetitionMap.current_area !== undefined) {
      state.area = PetitionMap.current_area;
    }
    if (PetitionMap.map_mode !== undefined) {
      state.map_mode = PetitionMap.map_mode;
    }
    return state;
  }

  function buildCurrentURL(state) {
    var new_url = document.createElement('a'),
      search = '?';

    for(key in state) {
      search += '' + key + '=' + encodeURIComponent(state[key]) + '&';
    }

    new_url.href = window.location.href
    new_url.search = search.slice(0,-1);

    return new_url.href;
  }

  function pushstateHandler() {
    var state = buildCurrentState();
    if (history.pushState) {
      var url = buildCurrentURL(state);
      history.pushState(state, '', url);
    }
  };

  function popstateHandler() {
    if (history.state && (history.state.area || history.state.petitionId)) {
      preparePetitionAndView();
    }
  };

  $(window).on('popstate', popstateHandler);

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Lock screen to portrait on mobile
  var previousOrientation = window.orientation;
  var check_orientation = function(){
      if(window.orientation !== previousOrientation){
          previousOrientation = window.orientation;

          if (window.orientation !== 0) {
              $("#support").fadeIn();
              setTimeout(function () {
                  alert("Landscape mode is not supported on mobile devices")
              }, 1000);
          } else {
              $("#support").fadeOut();
          }
      }
  };

  $(window).on("resize", check_orientation);
  $(window).on("orientationchange", check_orientation);

})($, window.PetitionMap = window.PetitionMap || {});
