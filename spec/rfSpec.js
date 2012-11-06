describe("The map module", function() {

	var options = {
		mapId : 'map_canvas',
		origId : 'start',
		destId : 'stop',
		alertBoxId : 'searchAlert'
	};

	beforeEach(function() {
		$('body').append('<div id="fixture">\
			<input type="text" id="orig"/>\
			<input type="text" id="dest"/>\
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

  xit("should get directions", function() {
  	expect(false).toBe(true);
  });

  xit("should find corners", function() {
  	expect(false).toBe(true);
  })
});