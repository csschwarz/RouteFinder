var finder; // object containing all functionality

/**
 * Factory for route finder objects
 */
function routeFinder() {
  var self = {
    btnMappings: {
      'transitBtn': google.maps.TravelMode.TRANSIT,
      'walkBtn': google.maps.TravelMode.WALKING,
      'bikeBtn': google.maps.TravelMode.BICYCLING,
      'driveBtn': google.maps.TravelMode.DRIVING
    },
    directionsService: new google.maps.DirectionsService(),
    transitLayer: new google.maps.TransitLayer(),
    searchRadius: 500,
    numSearches: 15
  };

  /**
   * Initialize map object and attach functions
   */
  function initialize() {
    var mapOptions = {
      center: new google.maps.LatLng(41.937871, -87.653911), // my apt
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };

    self.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
    self.directionsDisplay = new google.maps.DirectionsRenderer();
    self.directionsDisplay.setMap(self.map);

  	self.transitLayer.setMap(self.map);
    self.transitMode = google.maps.TravelMode.WALKING; // WALKING by default

    return self;
  };

  /**
   * Calculate and display a route if fields filled in
   */
  self.calcRoute = function() {
    var start = $('#start').val();
    var stop = $('#stop').val();
    var alertBox = $('#searchAlert');
    if(start != '' && stop != '') {
      var request = {
        origin: start,
        destination: stop,
        travelMode: self.transitMode
      };
      self.directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          self.directionsDisplay.setDirections(result);
          self.directions = result;
          self.setSearchRadius(self.numSearches);
          if(self.searchRadius > 50000) {
            showAlert(alertBox, "<strong>Sorry!</strong> Your route is too long.", "alert-error");
          } else {
            self.showDirectionsMarkers(self.directions['routes'][0]);
            //self.drawDirectionsPath();
            self.boundingBox(.001, self.directions['routes'][0]['overview_path']);
          }
        } else {
          showAlert(alertBox, "<strong>Sorry!</strong> I can't find a route.", "alert-error");
        }
      });
    }
  }

  /**
   * Determine size of search circles
   */
  self.setSearchRadius = function(numSearches) {
    var distance = self.directions['routes'][0]['legs'][0]['distance']['value'];
    console.log("ROUTE DISTANCE: "+distance);
    var newRadius = Math.floor(distance/numSearches);
    self.searchRadius = Math.max(newRadius, 500); // 500 seems the best minimum
  }

  /**
   * Calculate points to search at based on a route
   * TODO: new logic: get corners (sorted by angle), add biggest ones, then fill in
   */
  self.calcSearchPoints = function(route) {
    var searchPoints = new Array(); // needs to contain a point
    var path = route['overview_path'];

    var maxDist = (self.searchRadius * 2) - 0.25 * self.searchRadius;
    var minDist = self.searchRadius / 1.25;
    console.log("max dist: "+maxDist);
    console.log("min dist: "+minDist);
    
    var curPoint = path[0];
    searchPoints.push(curPoint); // Always search at first point

    var corners = self.findCorners(route);
    var curCornerId = 0;
    console.log(corners.length+" corners");
    // Add corners, if there's space, in order of turniness
    for(var i=0; i<corners.length; i++) {
      var cornerId = corners[i].id;
      if(distance(path[cornerId], closestSearchPoint(path[cornerId], searchPoints)) > minDist) {
        searchPoints.push(path[cornerId]);
      }
    }
    // Add non-corner points
    for(var i=0; i<path.length-1; i++) {
      if(inArrayAndBeingUsed(i, corners, searchPoints)) {
        curPoint = path[i];
      } else if(distance(curPoint, path[i+1]) > maxDist) { // if next point is too far
        curPoint = path[i];
        searchPoints.push(curPoint);
      }
    }
    // Add last point if it makes sense to
    if(distance(closestSearchPoint(path[path.length-1], searchPoints), path[path.length-1]) > minDist) {
      searchPoints.push(path[path.length-1]);
    }
    return searchPoints;
  }

  // helper for corners array--returns whether corner in arr with id index is a point in resultsArr
  function inArrayAndBeingUsed(index, arr, resultsArr) {
    for(var i=0; i<arr.length; i++) {
      if(index == arr[i].id) { 
        for(var j=0; j<resultsArr.length; j++) {
          if(resultsArr[j].lat() == arr[i].point.lat() && resultsArr[j].lng() == arr[i].point.lng()) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // helper--finds closest point in arr to point
  function closestSearchPoint(point, arr) {
    var minDistance = Number.MAX_VALUE;
    var minId;
    for(var i=0; i<arr.length; i++) {
      if(distance(point, arr[i]) < minDistance) {
        minDistance = distance(point, arr[i]);
        minId = i;
      }
    }
    return arr[minId];
  }

  // helper--finds abs distance between two points
  function distance(pointA, pointB) {
    var R = 6371000; // m
    var lat1 = pointA.lat().toRad(); // need lats & longs in radians
    var lat2 = pointB.lat().toRad();
    var lng1 = pointA.lng().toRad();
    var lng2 = pointB.lng().toRad();
    return Math.acos(Math.sin(lat1)*Math.sin(lat2) + // spherical law of cosines
                  Math.cos(lat1)*Math.cos(lat2) *
                  Math.cos(lng2-lng1)) * R;
  }

  /**
   * Finds corners in the route
   */
  self.findCorners = function(route) {
    var corners = new Array();
    var path = route['overview_path'];
    var threshold = 0.25; // ~45deg turns or greater (0-1, 1=180 turn)
    var curBearing = getBearing(path[0], path[1]);
    for(var i=0; i<path.length-1; i++) {
      var newBearing = getBearing(path[i], path[i+1]) || curBearing; // Ignore point if too close to last one
      var turniness = getBearingFactor(curBearing, newBearing);
      if(turniness > threshold) {
        corners.push({id: i, degree: turniness, point: path[i]});
        curBearing = newBearing;
      }
    }
    sort('degree', corners);
    return corners;
  }

  // helper function to get bearing for corner finding
  function getBearing(center, point) {
    var quadrantMappings = [0, Math.PI/2, Math.PI, 3.0*Math.PI/2];
    var quadrant;
    if(point.lng() > center.lng() && point.lat() > center.lat()) { quadrant = 0; }
    else if(point.lng() < center.lng() && point.lat() > center.lat()) { quadrant = 1; }
    else if(point.lng() < center.lng() && point.lat() < center.lat()) { quadrant = 2; }
    else if(point.lng() > center.lng() && point.lat() < center.lat()) { quadrant = 3; }
    else { return null; } // shouldn't be comparing points to themselves anyway

    var bearing = Math.abs(Math.atan2(point.lat() - center.lat(), point.lng() - center.lng()));
    if(quadrant == 0 || quadrant == 2) {
      bearing += quadrantMappings[quadrant];
    } else {
      bearing = (Math.PI/2 - bearing) + quadrantMappings[quadrant];
    }
    return bearing;
  }

  // helper function to get value specifying how sharp an angle is (0:no change - 1:turned around)
  function getBearingFactor(bearing1, bearing2) {
    var factor = Math.abs(bearing2 - bearing1);
    return (factor > Math.PI ? (factor-Math.PI)/Math.PI : factor/Math.PI);
  }

  // helper function to sort arrays by object property as string
  function sort(prop, arr) {
    arr.sort(function (a, b) {
        if (a[prop] < b[prop]) {
            return 1;
        } else if (a[prop] > b[prop]) {
            return -1;
        } else {
            return 0;
        }
    });
  };

  /**
   * Create bounding box for directions route at specified distance
   */
  self.boundingBox = function(maxDist, path) {
    var lastBearing = 0;
    var leftSide = new Array();
    var rightSide = new Array();
    for(var i=0; i<path.length-1; i++) {
      var newBearing = getBearing(path[i], path[i+1]) || lastBearing;
      var perpendiculars = perpendicularBearings((newBearing+lastBearing)/2);
      lastBearing = newBearing;
      leftSide.push(newPointFromBearing(path[i], perpendiculars.left, maxDist));
      console.log(i+": "+newBearing+", l:"+perpendiculars.left+", r:"+perpendiculars.right);
    }
    var routePath = new google.maps.Polyline({
      path: leftSide,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    routePath.setMap(self.map);
    console.log(leftSide.length);
  }

  // helper--gets perpendicular bearings
  function perpendicularBearings(bearing) {
    return {
      left: (bearing+Math.PI/2 > 2*Math.PI ? bearing-3*Math.PI/2 : bearing+Math.PI/2),
      right: (bearing-Math.PI/2 > 0 ? bearing-Math.PI/2 : bearing+3*Math.PI/2)
    };
  }

  // helper--makes new LatLng at given distance and bearing from point
  function newPointFromBearing(point, bearing, dist) {
    return new google.maps.LatLng(point.lat() + Math.sin(bearing)*dist, point.lng() + Math.cos(bearing)*dist);
  }

  /**
   ******************* DEBUG METHOD ********************
   * Show a marker for each point on directions route
   * Show a circle for each search point
   * (clear old stuff first)
   */
  self.markers = new Array();
  self.circles = new Array();
  self.showDirectionsMarkers = function(resultPath) {
    for(var i=0; i<self.markers.length; i++) { self.markers[i].setMap(null); }
    self.markers = new Array();
    for(var i=0; i<self.circles.length; i++) { self.circles[i].setMap(null); }
    self.circles = new Array();

    var route = resultPath; // One route by default, though could have more
    var path = route['overview_path'];
    var searchPoints = self.calcSearchPoints(route);
    
    for(var i=0; i<path.length; i++) {
      self.markers.push(new google.maps.Marker({
        position: path[i],
        map: self.map,
        title: ''+i
      }));
      self.attachMessage(self.markers[i], '#'+i);
    }

    // Draw circles for search points
    for(var i=0; i<searchPoints.length; i++) {
      self.circles.push(new google.maps.Circle({
        strokeColor: "#0000FF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#0000FF",
        fillOpacity: 0.2,
        map: self.map,
        center: searchPoints[i],
        radius: self.searchRadius
      }));
    }
    console.log("Searches: "+self.circles.length);
  }

  /**
   ******************* DEBUG METHOD ********************
   * Show the path as an offset polygon
   */
  self.drawDirectionsPath = function() {
    var coords = self.directions['routes'][0]['overview_path'];
    var offsetLower = new Array();
    var offsetUpper = new Array();
    for(var i=0; i<coords.length; i++) {
      offsetLower.push(new google.maps.LatLng(coords[i].lat()-.005, coords[i].lng()-.005));
      offsetUpper.push(new google.maps.LatLng(coords[i].lat()+.005, coords[i].lng()+.005));
    }
    routePath = new google.maps.Polyline({
      path: coords,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    routeOffsetLowerPath = new google.maps.Polyline({
      path: offsetLower,
      strokeColor: "#00FF00",
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    routePath.setMap(self.map);
    routeOffsetLowerPath.setMap(self.map);
  }

  // Helper function to show alerts briefly
  var pendingTimeouts = [];
  function showAlert(element, message, typeClass) { // alert-success, -failure, -info
    for(var i=0; i<pendingTimeouts.length; i++) {
      clearTimeout(pendingTimeouts[i]);
    }
    element.css('display', 'none');
    element.addClass(typeClass);
    element.html(message);
    element.fadeIn(100);
    pendingTimeouts.push(setTimeout(function() { element.fadeOut(100); }, 2000));
  }

  /**
   * Transit option button handler
   * RECALCULATES ROUTE (for convenience)
   */
  self.setTransitModeButtons = function(btnContainer, buttonId) {
    self.transitMode = self.btnMappings[buttonId];
    btnContainer.children().removeClass('btn-info');
    btnContainer.children('#'+buttonId).addClass('btn-info');
    self.calcRoute();
  }

  /**
   * Attach a popup to a marker when clicked
   */
  self.attachMessage = function(marker, theMessage) {
  	var message = theMessage;
  	var infowindow = new google.maps.InfoWindow(
  	  { content: message,
    	  size: new google.maps.Size(1,1)
    	});
  	google.maps.event.addListener(marker, 'click', function() {
    	infowindow.open(self.map, marker);
  	});
  };

  return {initialize: initialize};
}



/**
 * Converts numeric degrees to radians 
 */
if (typeof Number.prototype.toRad == 'undefined') {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

/**
 * Setup -- callback for loadScript
 */
function setup() {
  finder = routeFinder().initialize();
}

/**
 * Load script after rest of page loaded
 */
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyC6LAzdvnuFGZ3bIt6zTjGaHsGcA0_6JWM&sensor=false&callback=setup";
  document.body.appendChild(script);
};

/**
 * Run on page ready
 */
$(function() {
	loadScript();
  $('#search').click(function() {
    finder.calcRoute();
  });
  $('#transitMode').children().click(function(event) {
    finder.setTransitModeButtons($('#transitMode'), $(this).attr('id'));
  })
})