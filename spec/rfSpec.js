describe("The map module", function() {
	
	var map;
	var nwPath = [ // 3055 n sheffield to jefferson park (truncated)
		new google.maps.LatLng(41.93808000000001, -87.65406),
		new google.maps.LatLng(41.938030000000005, -87.65769),
		new google.maps.LatLng(41.93795, -87.66312),
		new google.maps.LatLng(41.937900000000006, -87.66616), // corner
		new google.maps.LatLng(41.93813, -87.66652),
		new google.maps.LatLng(41.938750000000006, -87.66738000000001),
		new google.maps.LatLng(41.93968, -87.66864000000001), // corner
		new google.maps.LatLng(41.93963, -87.67344000000001),
		new google.maps.LatLng(41.939620000000005, -87.67428000000001),
		new google.maps.LatLng(41.93939, -87.69782000000001),
		new google.maps.LatLng(41.93941, -87.69833000000001), // corner
		new google.maps.LatLng(41.93967000000001, -87.69873000000001),
	];
	var sePath = [ // 3055 n sheffield to 200 e randolph
		new google.maps.LatLng(41.937870000000004, -87.65405000000001),
		new google.maps.LatLng(41.934450000000005, -87.65392000000001),
		new google.maps.LatLng(41.93216, -87.65384),
		new google.maps.LatLng(41.929, -87.65373000000001), // corner (3)
		new google.maps.LatLng(41.92857, -87.65313),
		new google.maps.LatLng(41.92848, -87.65301000000001),
		new google.maps.LatLng(41.92723, -87.65128000000001),
		new google.maps.LatLng(41.925740000000005, -87.64917000000001),
		new google.maps.LatLng(41.924420000000005, -87.64732000000001),
		new google.maps.LatLng(41.92365, -87.64628),
		new google.maps.LatLng(41.923300000000005, -87.64575),
		new google.maps.LatLng(41.92221000000001, -87.64425000000001),
		new google.maps.LatLng(41.92009, -87.64131),
		new google.maps.LatLng(41.918380000000006, -87.63891000000001),
		new google.maps.LatLng(41.918260000000004, -87.63871),
		new google.maps.LatLng(41.91664, -87.63646000000001),
		new google.maps.LatLng(41.91649, -87.63626000000001),
		new google.maps.LatLng(41.91548, -87.63484000000001), // corner (17)
		new google.maps.LatLng(41.91561, -87.63434000000001), // corner (18)
		new google.maps.LatLng(41.915240000000004, -87.63412000000001),
		new google.maps.LatLng(41.914750000000005, -87.63383),
		new google.maps.LatLng(41.913700000000006, -87.63318000000001),
		new google.maps.LatLng(41.91315, -87.63286000000001),
		new google.maps.LatLng(41.91304, -87.63277000000001),
		new google.maps.LatLng(41.912600000000005, -87.63250000000001),
		new google.maps.LatLng(41.91133000000001, -87.63174000000001),
		new google.maps.LatLng(41.91116, -87.63169),
		new google.maps.LatLng(41.910790000000006, -87.63166000000001),
		new google.maps.LatLng(41.909420000000004, -87.63163),
		new google.maps.LatLng(41.907830000000004, -87.63159),
		new google.maps.LatLng(41.905770000000004, -87.6315),
		new google.maps.LatLng(41.90391, -87.63144000000001), // corner (31)
		new google.maps.LatLng(41.90391, -87.63071000000001),
		new google.maps.LatLng(41.90393, -87.62932),
		new google.maps.LatLng(41.903940000000006, -87.62868), // corner (34)
		new google.maps.LatLng(41.90364, -87.62867000000001),
		new google.maps.LatLng(41.90317, -87.62865000000001),
		new google.maps.LatLng(41.902570000000004, -87.62841),
		new google.maps.LatLng(41.90236, -87.62831000000001),
		new google.maps.LatLng(41.901720000000005, -87.62796),
		new google.maps.LatLng(41.90156, -87.62791000000001),
		new google.maps.LatLng(41.899950000000004, -87.62711),
		new google.maps.LatLng(41.89916, -87.62676),
		new google.maps.LatLng(41.897540000000006, -87.62598000000001),
		new google.maps.LatLng(41.896710000000006, -87.62556000000001),
		new google.maps.LatLng(41.89660000000001, -87.62553000000001),
		new google.maps.LatLng(41.89649, -87.6255),
		new google.maps.LatLng(41.89332, -87.62542),
		new google.maps.LatLng(41.892500000000005, -87.62540000000001), // corner (48)
		new google.maps.LatLng(41.892520000000005, -87.62484),
		new google.maps.LatLng(41.89253, -87.62429), // corner (50)
		new google.maps.LatLng(41.89197, -87.62427000000001),
		new google.maps.LatLng(41.89139, -87.62425),
		new google.maps.LatLng(41.890660000000004, -87.62423000000001),
		new google.maps.LatLng(41.890130000000006, -87.6242),
		new google.maps.LatLng(41.8896, -87.62426),
		new google.maps.LatLng(41.8883, -87.62458000000001),
		new google.maps.LatLng(41.888180000000006, -87.62458000000001),
		new google.maps.LatLng(41.88788, -87.62462000000001),
		new google.maps.LatLng(41.88676, -87.6246),
		new google.maps.LatLng(41.885760000000005, -87.6246),
		new google.maps.LatLng(41.884510000000006, -87.62457), // corner (61)
		new google.maps.LatLng(41.884510000000006, -87.62369000000001),
		new google.maps.LatLng(41.8845, -87.62335),
		new google.maps.LatLng(41.88452, -87.62159000000001),
		new google.maps.LatLng(41.88452, -87.62144)
	];

	beforeEach(function() {
		$('body').append('<div id="fixture" class="hidden">\
			<input type="text" id="start"/>\
			<input type="text" id="stop"/>\
			<div id="map_canvas"></div>\
			<div id="searchAlert"></div>\
			</div>');
		var options = {
			map : $('#map_canvas'),
			alertBoxId : 'searchAlert'
		};
		map = routeFinder().init(options);
	});

	afterEach(function() {
		$('#fixture').remove();
		delete map;
	});

  it("should initialize the map", function() {
  	expect(map).toBeDefined();
  });

  it("should be able to get directions", function() {
  	map.calcRoute("3055 n sheffield chicago", "belmont harbor chicago", "WALKING");
  	waitsFor(function() {
  		return map.directions.length > 0;
  	}, "directions.", 1000);
  	runs(function() {
  		expect(map.directions.length).toEqual(30);
  	});
  });

  it("should set search radius to at least 450m", function() {
  	// under threshold
  	map.setSearchRadius(15, 1);
  	expect(map.searchRadius).toEqual(450);
  	// over threshold
  	map.setSearchRadius(15, 20000);
  	expect(map.searchRadius).toEqual(1333);
  });

  it("should find the right corners", function() {
  	var corners = map.findCorners(nwPath);
  	expect(corners).toEqual([3, 6, 10]);

  	corners = map.findCorners(sePath);
  	expect(corners).toEqual([3, 17, 18, 31, 34, 48, 50, 61]);
  });

  it("should pick acceptable search points", function() {
  	var points = map.determineSearchPoints(nwPath);
  	expect(points).toEqual([0, 1, 3, 8, 9, 10, 11]);

  	var points = map.determineSearchPoints(sePath);
  	expect(points).toEqual([0, 1, 3, 7, 11, 13, 17, 28, 31, 42, 48, 56, 61, 65]);
  });

  it("should search google places", function() {
  	map.totalSearchPoints = 14;
  	map.searchPlaces('food', sePath, [0, 1, 3, 7, 11, 13, 17, 28, 31, 42, 48, 56, 61, 65]);
  	waitsFor(function() {
  		return map.searchResults.length > 0;
  	}, "places results.", 1000);
  	waitsFor(function() {
  		return map.totalSearchPoints == 0;
  	}, "all places results.", 5000);
  });

  xit("should work end-to-end", function() {
  	expect(false).toBe(true);
  });
});