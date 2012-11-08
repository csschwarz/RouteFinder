var mapModule;
var mapOptions = {
  map : $('#map_canvas'),
  alertBoxId : 'searchAlert'
};

// Load script
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?libraries=geometry,places&key=AIzaSyC6LAzdvnuFGZ3bIt6zTjGaHsGcA0_6JWM&sensor=false&callback=setup";
  document.body.appendChild(script);
};

// Setup--callback for loadScript
function setup() {
  mapModule = routeFinder().init(mapOptions);
};

// Run on page ready
$(function() {
	loadScript();
  $('#search').click(function() {
    mapModule.calcRoute($('#start').val(), $('#stop').val(), $('#transitMode .btn-info').attr('id'), 'food');
  });
  var transitMode = $('#transitMode');
  transitMode.children().click(function() {
    transitMode.children().removeClass('btn-info');
    $(this).addClass('btn-info');
    mapModule.calcRoute($('#start').val(), $('#stop').val(), $(this).attr('id'), 'food');
  })
});