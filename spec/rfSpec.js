describe("The map module", function() {

	var options = {
		mapId : 'map_canvas',
		origId : 'start',
		destId : 'stop',
		alertBoxId : 'searchAlert'
	};

	beforeEach(function() {
		$('body').append('<div id="fixture">\
			<input type="text" id="start"/>\
			<input type="text" id="stop"/>\
			<div id="map_canvas"></div>\
			<div id="searchAlert"></div>\
			</div>');
	});

	afterEach(function() {
		$('#fixture').remove();
	});

  it("should initialize the map", function() {
  	var map = routeFinder().init(options);
  	expect(map).toBeDefined();
  });

  it("should be able to get directions", function() {
  	map = routeFinder().init(options);
  	map.getDirections("3055 n sheffield chicago", "belmont harbor chicago");
  	waitsFor(function() {
  		return map.directions.length > 0;
  	}, "directions.", 1000);
  	runs(function() {
  		expect(map.directions.length).toEqual(30);
  	});
  });

  xit("should find the right corners", function() {
  	expect(false).toBe(true);
  });

  xit("should pick acceptable search points", function() {
  	expect(false).toBe(true);
  });

  xit("should calculate a bounding polygon", function() {
  	expect(false).toBe(true);
  });

  xit("should search google places", function() {
  	expect(false).toBe(true);
  });
});