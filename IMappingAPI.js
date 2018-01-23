var MappingAPI = MappingAPI || {};

//Empty Constructors
MappingAPI.GoogleMaps = function(){};
MappingAPI.MapQuest = function(){};
MappingAPI.BingMaps = function(){};

MappingAPI.Constants = { 
	DEFAULT_ZOOM: 12,
    DEFAULT_CENTER: [37.7749, -122.4194],
    MAX_DISTANCE_TWO_POINTS: 1250,
    DIST_TOLERANCE_MARKERS: 0.0008,
    Z_INDEX_PIORITY: 1000,
    MAX_ZOOM: 18,
    MIN_ZOOM: 6,
    MIN_MARKERS_ZOOM: 14,
    COORD_COMPRESSION: 6,
    ZOOM_DELTA: 1
};

MappingAPI.Utils = {
    getMidpoint: function(pCoordOne, pCoordTwo) {
        var avg = function (x, y) { 
            return (x + y) / 2; 
        };
        return { lat: avg(pCoordOne.Latitude, pCoordTwo.Latitude), lng: avg(pCoordOne.Longitude, pCoordTwo.Longitude) };
    },
    simplify: function(points, tolerance, highestQuality) {
        // basic distance-based simplification
        var simplifyRadialDist = function(points, sqTolerance) {

            var prevPoint = points[0],
                newPoints = [prevPoint],
                point;

            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];

                if (getSqDist(point, prevPoint) > sqTolerance) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }

            if (prevPoint !== point) {
                newPoints.push(point);
            }

            return newPoints;
        };
        // simplification using optimized Douglas-Peucker algorithm with recursion elimination
        var simplifyDouglasPeucker = function(points, sqTolerance) {

            var len = points.length,
                MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
                markers = new MarkerArray(len),
                first = 0,
                last = len - 1,
                stack = [],
                newPoints = [],
                i, maxSqDist, sqDist, index;

            markers[first] = markers[last] = 1;

            while (last) {
                maxSqDist = 0;
                for (i = first + 1; i < last; i++) {
                    sqDist = getSqSegDist(points[i], points[first], points[last]);

                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }
                if (maxSqDist > sqTolerance) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }
                last = stack.pop();
                first = stack.pop();
            }
            for (i = 0; i < len; i++) {
                if (markers[i]) {
                    newPoints.push(points[i]);
                }
            }

            return newPoints;
        };
        // square distance between 2 points
        var getSqDist = function(p1, p2) {
            var dx = p1.Coordinate.Latitude - p2.Coordinate.Latitude,
                dy = p1.Coordinate.Longitude - p2.Coordinate.Longitude;

            return dx * dx + dy * dy;
        };
        // square distance from a point to a segment
        var getSqSegDist = function(p, p1, p2) {
            var x = p1.Coordinate.Latitude,
                y = p1.Coordinate.Longitude,
                dx = p2.Coordinate.Latitude - x,
                dy = p2.Coordinate.Longitude - y;

            if (dx !== 0 || dy !== 0) {
                var t = ((p.Coordinate.Latitude - x) * dx + (p.Coordinate.Longitude - y) * dy) / (dx * dx + dy * dy);
                if (t > 1) {
                    x = p2.Coordinate.Latitude;
                    y = p2.Coordinate.Longitude;

                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }

            dx = p.Coordinate.Latitude - x;
            dy = p.Coordinate.Longitude - y;

            return dx * dx + dy * dy;
        }

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        points = simplifyDouglasPeucker(points, sqTolerance);

        return points;
    },
    decompressCoords: function(encoded, precision){
       precision = Math.pow(10, -precision);
       var len = encoded.length, index=0, lat=0, lng = 0, array = [];
       while (index < len) {
          var b, shift = 0, result = 0;
          do {
             b = encoded.charCodeAt(index++) - 63;
             result |= (b & 0x1f) << shift;
             shift += 5;
          } while (b >= 0x20);
          var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lat += dlat;
          shift = 0;
          result = 0;
          do {
             b = encoded.charCodeAt(index++) - 63;
             result |= (b & 0x1f) << shift;
             shift += 5;
          } while (b >= 0x20);
          var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lng += dlng;
          array.push(lat * precision);
          array.push(lng * precision);
       }
        return array;
    },
    getDistanceBetweenCoords: function(pCoordOne, pCoordTwo) {
        var deg2rad = function(deg) {
            return deg * (Math.PI/180)
        }

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(pCoordTwo.latitude - pCoordOne.latitude);
        var dLon = deg2rad(pCoordTwo.longitude - pCoordOne.longitude); 
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(pCoordOne.latitude)) * Math.cos(deg2rad(pCoordTwo.latitude)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d * 1000;
    }
};
