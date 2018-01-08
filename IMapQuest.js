var MappingAPI = MappingAPI || {};

MappingAPI.MapQuest = function($pSelector, pAPIKey, pCenter) {
	this.Constants = {
        Events: {
               BOUNDS_CHANGED: '',
               CENTER_CHANGED: '',
               CLICK: 'click',
               DBLCLICK: 'dblclick',
               DRAG: '',
               DRAGEND: '',
               DRAGSTART: '',
               HEADING_CHANGED: '',
               IDLE: '',
               MAPTYPE_CHANGED: '',
               MOSEMOVE: 'mousemove',
               MOSEOUT: 'mouseout',
               MOUSEOVER: 'mouseover',
               PROJECTION_CHANGED: '',
               RIGHT_CLICK: '',
               TILES_LOADED: '',
               TILT_CHANGED: '',
               ZOOM_CHANGED: 'zoom'
        },
		MapType: {
			ROADMAP: 'map',
			HYBRID: 'hybrid',
			SATELLITE: 'satellite',
			DARK: 'dark',
			LIGHT: 'light'
		},
        Animation: {
            BOUNCE: 'BOUNCE'
        },
    };

	var height = $(window).height();
	var oMapStyle = {
		'height': height,
		'width': '100%',
		'position': 'relative'
	};
	var oBondingBox = {
		'ul': {//upper left
			'lng': pCenter.Longitude,
			'lat': pCenter.Latitude
		},
		'lr': {//lower right
			'lng': pCenter.Longitude + .15,
			'lat': pCenter.Latitude + .1
		}
	};
	var oCenter = L.mapquest.util.getCenterFromBoundingBox(oBondingBox);
	var intZoom = L.mapquest.util.getZoomFromBoundingBox(oBondingBox);

	$pSelector.css(oMapStyle);

	L.mapquest.key = pAPIKey;
	this.API_KEY = pAPIKey;

	this.map = L.mapquest.map(this.Constants.MapType.ROADMAP, {
		center: oCenter,
		layers: L.mapquest.tileLayer(this.Constants.MapType.ROADMAP),
		zoom:   intZoom,
		maxZoom: this.Constants.MAX_ZOOM
	});

    this.infoWindow = L.popup();
	this.directions = L.mapquest.directions();
	this.geocoding = L.mapquest.geocoding({thumbMaps: false});
	this.map.addControl(L.mapquest.control());

	this.ZoomToMarkerHandler = function(pMarker, pTooltip) {
		this.map.setView(pMarker.getLatLng(), MappingAPI.Constants.MAX_ZOOM);
	};

	this.CustomControlZoomToMarker = function(pMarker) {
		var location = pMarker.getLatLng();
		this.infoWindow.setLatLng(location);
		this.infoWindow.setContent(pMarker.options.tooltip);
		this.infoWindow.openOn(this.map);
		this.map.setView(location, MappingAPI.Constants.MAX_ZOOM);
	};
};

MappingAPI.MapQuest.prototype.fitBounds = function(pBounds) {
    this.map.fitBounds(pBounds);
};

MappingAPI.MapQuest.prototype.setZoom = function(pZoom) {
    this.map.setZoom(pZoom);
};

MappingAPI.MapQuest.prototype.initRoute = function(pOptions) {
    return L.layerGroup();
};

MappingAPI.MapQuest.prototype.getIcon = function(pPath, pWidth, pHeight) {
    return L.icon({
				iconUrl:  pPath,
				iconSize: [pWidth, pHeight]
			});
	};

MappingAPI.MapQuest.prototype.getMarker = function(pId, pLat, pLng, pZindex, pIcon, pTitle, pTooltip, pDraggable) {
    return L.marker([pLat, pLng], {
			  id: pId,
			  zIndexOffset: pZindex,
			  icon: pIcon,
			  title: pTitle,
			  tooltip: pTooltip,
			  alt: pTitle,
			  draggable: pDraggable
			});
};

MappingAPI.MapQuest.prototype.getBounds = function(pUpperLeft, pLowerRight) {
    return [[pUpperLeft.Latitude, pUpperLeft.Longitude], [pLowerRight.Latitude, pLowerRight.Longitude]];
};

MappingAPI.MapQuest.prototype.getLatLng = function(pLat, pLng) {
    return [pLat, pLng];
};

MappingAPI.MapQuest.prototype.getDistance = function(pPointA, pPointB) {
    return this.map.distance(pPointA, pPointB);
};

MappingAPI.MapQuest.prototype.addAnimation = function(pObject, pAnimationType) {
	if(pAnimationType == this.Constants.Animation.BOUNCE) {
    	pObject.bounce();
	}
};

MappingAPI.MapQuest.prototype.addEventHandler = function(pObject, pEventType, pCallback) {
	pObject.on(pEventType, pCallback);
};

MappingAPI.MapQuest.prototype.batchGeoCode = function(pAddresses, pCallback) {
	var geocodeCallback = function(error, json) {
		if ($.isEmptyObject(error)) {
			var dicGeolocations = [];
			for (var i = 0; i < json.results.length; i++) {
				var kvp = {};
				kvp.Key = json.results[i].providedLocation.street;
				kvp.Value = json.results[i].locations[0].displayLatLng.lat + "|" + json.results[i].locations[0].displayLatLng.lng;
				dicGeolocations.push(kvp);

			}
			pCallback(dicGeolocations);
		}
	}

	this.geocoding.geocode(pAddresses, geocodeCallback);
};

MappingAPI.MapQuest.prototype.geoCode = function(pAddress, pCallback) {
    var geocodeCallback = function(error, json) {
		if ($.isEmptyObject(error)) {
			var dicGeolocations = [];
            var kvp = {};
            kvp.Key = json.results[0].providedLocation.street;
            kvp.Value = json.results[0].locations[0].displayLatLng.lat + "|" + json.results[0].locations[0].displayLatLng.lng;
            dicGeolocations.push(kvp);
        }
     
        pCallback(dicGeolocations);
    }

	this.geocoding.geocode(pAddress, geocodeCallback);
};

MappingAPI.MapQuest.prototype.calculateRoute = function(pCoordOne, pCoordTwo, pCallback, pOptions) {
	var mapquest = this;

	var routeShapeCallback = function(error, json) {
		if ($.isEmptyObject(error)) {
			var shapePoints = MappingAPI.Utils.decompressCoords(json.route.shape.shapePoints, MappingAPI.Constants.COORD_COMPRESSION);
			var routecoords = [];
			for (var i = 0; i < shapePoints.length; i += 2) {
				var coord = [shapePoints[i], shapePoints[i+1]];
				routecoords.push(coord);
			}
			pCallback(routecoords);
		}
	}

	var directionsCallback = function(error, json) {
		if ($.isEmptyObject(error)) {
			mapquest.directions.routeShape({
			  'sessionId': json.route.sessionId,
			  'fullShape': true
			}, routeShapeCallback);
		}
	}

	this.directions.route({
	   start: pCoordOne,
	   end: pCoordTwo,
	   options: {routeType: "fastest"}
	}, directionsCallback);

};

MappingAPI.MapQuest.prototype.initLayerGroup = function(pLayerGroup, pProp) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = L.layerGroup();   
    }
};

MappingAPI.MapQuest.prototype.addLayer = function(pLayerGroup, pProp, pLayer, pOptions) {
    pLayerGroup[pProp].addLayer(pLayer);
};

MappingAPI.MapQuest.prototype.removeLayers = function(pLayerGroup, pProp) {
    pLayerGroup[pProp].clearLayers();
};

MappingAPI.MapQuest.prototype.initPolyLayerGroup = function(pLayerGroup, pProp, pOptions) {
    if(pLayerGroup[pProp] === null) {
        pLayerGroup[pProp] = L.layerGroup();   
    }
};

MappingAPI.MapQuest.prototype.addPolyLine = function(pLayerGroup, pProp, pCoords, pOptions) {
    pLayerGroup[pProp].addLayer(L.polyline(pCoords, pOptions));
};

MappingAPI.MapQuest.prototype.bindLayerGroupToMap = function(pLayerGroup, pProp) {
    pLayerGroup[pProp].addTo(this.map);
};

MappingAPI.MapQuest.prototype.initCustomControls = function(pLayerGroup, pProp, pOptions) {
	pLayerGroup[pProp] = [];
	pLayerGroup[pProp].push(L.control.layers(null, pOptions).addTo(this.map));
};

MappingAPI.MapQuest.prototype.makeRouteOptions =  function(pColor, pOpacity, pWeight, pDraggable, pKeepView, pShowMarkers, pPath) {
    return {
		color: pColor, 
		weight: pWeight, 
		opacity: pOpacity
	};
};

MappingAPI.MapQuest.prototype.plotRoute = function(pLayerGroup, pProp, pRoute, pOptions) {
	this.addPolyLine(pLayerGroup, pProp, pRoute, pOptions);
};

MappingAPI.MapQuest.prototype.initMarkerOptions =  function(pZindex) {
    return {};
};

MappingAPI.MapQuest.prototype.initCustomControlOptions =  function() {
    return [];
};

MappingAPI.MapQuest.prototype.clearMap = function(pLayerGroup) {
    for(var key in pLayerGroup){
        if(pLayerGroup[key] instanceof Array) {
            for (var i = 0; i < pLayerGroup[key].length; i++) {
                pLayerGroup[key][i].remove();
            }
            pLayerGroup[key].length = 0; 
        }
    }

    for(var key in pLayerGroup){
        if(!(pLayerGroup[key] instanceof Array)) {
            if(!$.isEmptyObject(pLayerGroup[key])) {
                pLayerGroup[key].clearLayers();
            }
        }
    }
};