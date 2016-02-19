/*jslint browser: true*/
/*global L */

var mapModule = (function (window, document, L, undefined) {
	'use strict';
	var mapOptions = {};

	mapOptions.init = function(window, document, L, undefined) {

		L.Icon.Default.imagePath = '/app/images/';

		/* create leaflet map */
		var map = L.map('map', {
			center: [GeoLocation.userLocation.lat, GeoLocation.userLocation.lng],
			zoom: 12
		});

		new L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
			minZoom: 0,
			maxZoom: 18,
			attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
		}).addTo(map);
		//add geolocation marker
		L.marker([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng]).addTo(map);

		mapOptions.el = L.control.elevation({
			position: "bottomleft",
			theme: "steelblue-theme",
			width: 600,
			height: 125,
			margins: {
				top: 10,
				right: 20,
				bottom: 30,
				left: 0
			},
			useHeightIndicator: true, //if false a marker is drawn at map position
			interpolation: "linear", //see https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_interpolate
			hoverNumber: {
				decimalsX: 3, //decimals on distance (always in km)
				decimalsY: 0, //deciamls on height (always in m)
				formatter: undefined //custom formatter function may be injected
			},
			xTicks: undefined, //number of ticks in x axis, calculated by default according to width
			yTicks: undefined, //number of ticks on y axis, calculated by default according to height
			collapsed: false    //collapsed mode, show chart on click or mouseover
		}).addTo(map);

		mapOptions.trailGroup = new L.layerGroup();
		var customLayer = L.geoJson(null, {
			// http://leafletjs.com/reference.html#geojson-style
			style: function(feature) {
				return {
					color: '#f00'
				};
			},
			onEachFeature: function(feature, layer){
				mapOptions.trailGroup.addLayer(layer);
				//add to sidr list
				trailMenu.addListitem(feature, layer, map);
				//add classname for click detection
				layer.setStyle({
					color: "black",
					className: "trailLayer"
				})
				layer.on("click", function(e){

					mapOptions.showFeature(layer);
					// open trail details
					trailMenu.openMenu();
				})
				.on("mouseover", function(){
					if(!feature.properties.selected) {
						layer.setStyle({
							color: "red"
						})
					}
				})
				.on("mouseout", function(){
					if(!feature.properties.selected) {
						layer.setStyle({
							color: "black"
						})
					}
				})
			}
		}).addTo(map);

		mapOptions.highlightLayer = function(layer){
			mapOptions.unhighlightLayer();
			// prevent clicking then immediately changing color to black "on mouse out"
			layer.feature.properties.selected = true;
			layer.setStyle({
				color: "blue"
			});
		};
		mapOptions.unhighlightLayer = function(){
			mapOptions.trailGroup.eachLayer(function(layer){
				layer.setStyle({
					color: "black"
				})
			});
		};

		mapOptions.fileArray = ["gateway" , "8-mile"];

		$.each(mapOptions.fileArray, function(key, val){
			var trail = omnivore.kml('/app/layers/'+val+'.kml', null, customLayer)

		});

		mapOptions.showFeature = function(trailLayer){
			var layer = null,
				feature = null;
			if(typeof trailLayer  === "string") {
				$.each(mapOptions.trailGroup._layers, function(key, l){
					if(trailLayer === l.feature.properties.name) {
						layer = l;
						feature = l.feature;
						return false;
					}
				});
			} else {
				layer   = trailLayer;
				feature = layer.feature;
			}
			mapOptions.highlightLayer(layer);
			mapOptions.el.clear();
			mapOptions.el.addData(feature, layer);
			map.fitBounds(layer.getBounds())

		};
	};
	return mapOptions;
}());



var trailMenu = (function(){
	var options = {};

	options.sidr = {opened: false};
	options.sidr._isOpen = function() {
		return options.sidr.opened
	};
	var menu = $('#trail-menu-list');
	options.addListitem = function(trail, mapLayer, map){
		var newListItem = '<li class="menu-item" data-feature="'+trail.properties.name+'">'+trail.properties.name+'</li>';
		$(menu).append(newListItem);
	};

	options.openMenu = function(){
			options.sidr.opened = false;
			$("#tmenu").sidr({
				side: 'right',
				displace: false
			});
			$.sidr('open', 'sidr');
			mapModule.el.show()
	};
	options.closeMenu = function(){
			$.sidr('close', 'sidr');
			mapModule.el.hide()
	};
	return options;
}());



$(document).on('click', '.menu-item', function(){
	mapModule.showFeature($(this).data('feature'));
});

$(document).on('click', function (e){
	var elevationWindow = $(e.target).parents('.elevation.leaflet-control').length > 0 ? true : false;
	var trailLayer = $(e.target).hasClass('.trailLayer');
	var container = $("#sidr");
	if (!container.is(e.target) && container.has(e.target).length === 0 && !elevationWindow && !trailLayer) {
		trailMenu.closeMenu();
		mapModule.unhighlightLayer();
	}
});
