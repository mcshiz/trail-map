/*jslint browser: true*/
/*global L */

var mapModule = (function (window, document, L, undefined) {
	'use strict';
	var mapOptions = {};

	mapOptions.init = function(window, document, L, undefined) {

		L.Icon.Default.imagePath = '/app/images/';

		/* create leaflet map */
		var map = L.map('map');
		map.on('load', function(){
			$('.trail-menu-button, .geolocate-button').show()
			$(canvas).remove();

		})
		map.setView([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng], 12);
		new L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
			minZoom: 0,
			maxZoom: 18,
			attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
		}).addTo(map);

		mapOptions.map = map;
		var photos = [{
			lng:-122.313225,
			lat:41.31577222222222,
			url:"http://i1.adis.ws/i/washford/01-bikes-mtb-thumbnail?$cat_nav$",
			caption:"work bitch",
			thumbnail:"http://i1.adis.ws/i/washford/01-bikes-mtb-thumbnail?$cat_nav$",
			video: ""
		}];


		var photoLayer = L.photo.cluster().on('click', function (evt) {
			var photo = evt.layer.photo,
				template = '<img src="{url}"/></a><p>{caption}</p>';
			if (photo.video && (!!document.createElement('video').canPlayType('video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
				template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
			};
			evt.layer.bindPopup(L.Util.template(template, photo), {
				className: 'leaflet-popup-photo',
				minWidth: 400
			}).openPopup();
		});
		photoLayer.add(photos).addTo(map)


        //

		mapOptions.updatePosition = function(position){
			map.removeLayer(mapOptions.geolocationMarker);
			mapOptions.geolocationMarker.setLatLng([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng]).addTo(map);
		};
		//add geolocation marker
		mapOptions.geolocationMarker = L.marker([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng]).addTo(map);

		mapOptions.elevationProfile = L.control.elevation({
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

		mapOptions.trailGroup = new L.featureGroup();
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
				});
				layer.on("click", function(e){
					mapOptions.showFeature(layer);
					trailMenu.openMenu();
				})
				.on("mouseover", function(){
					if(!feature.properties.selected) layer.setStyle({color: "red"})
				})
				.on("mouseout", function(){
					if(!feature.properties.selected) layer.setStyle({color: "black"})
				})
			}
		}).addTo(map);

		mapOptions.highlightLayer = function(trailLayer){
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
				layer = trailLayer;
				feature = trailLayer.feature;
			}
			mapOptions.unhighlightLayer();
			// prevent clicking then immediately changing color to black "on mouse out"
			layer.feature.properties.selected = true;
			layer.setStyle({
				color: "blue"
			});
		};
		mapOptions.unhighlightLayer = function(){
			mapOptions.trailGroup.eachLayer(function(layer){
				layer.feature.properties.selected = false;
				layer.setStyle({
					color: "black"
				})
			});
		};
		mapOptions.previewColor = function(trailLayer){
			$.each(mapOptions.trailGroup._layers, function(key, l){
				if(typeof trailLayer  === "string") {
					$.each(mapOptions.trailGroup._layers, function (key, l) {
						if (trailLayer === l.feature.properties.name) l.setStyle({color: "red"})
					})
				}

			});
		};
		mapOptions.baseColor = function(){
			var baseColor = "black";
			mapOptions.trailGroup.eachLayer(function(layer){
				layer.feature.properties.selected === true ?  baseColor = "blue": baseColor = "black";
				layer.setStyle({
					color: baseColor
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
			mapOptions.elevationProfile.clear();
			mapOptions.elevationProfile.addData(feature, layer);
			mapOptions.elevationProfile.show()
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
		var newListItem = '<li class="menu-item" data-feature="'+trail.properties.name+'">'+trail.properties.name+'<a href="#" class="show-trail-details">View Details</a></li>';
		$(menu).append(newListItem);
	};

	options.openMenu = function(){
			options.sidr.opened = true;
			$.sidr('open', 'sidr');

	};
	options.closeMenu = function(){
			options.sidr.opened = false;
			$.sidr('close', 'sidr');
			mapModule.elevationProfile.hide();
			mapModule.map.fitBounds(mapModule.trailGroup.getBounds())
	};
	return options;
}());

$(document).on('click', '.menu-item', function(){
	mapModule.showFeature($(this).data('feature'));
});
$(document).on('mouseover', '.menu-item', function(){
	mapModule.previewColor($(this).data('feature'))
});
$(document).on('mouseout', '.menu-item', function(){
	mapModule.baseColor()
});
$(document).on('click', function (e){
	var elevationWindow = $(e.target).parents('.elevation.leaflet-control').length > 0,
		trailLayer = $('.trail-menu-button'),
		geolocateButton = $('.geolocate-button'),
		container = $("#sidr")
	if ((!container.is(e.target)
			&& container.has(e.target).length === 0)
			&& !elevationWindow && !trailLayer.is(e.target)
			&& trailLayer.has(e.target).length === 0
			&& !geolocateButton.is(e.target)
			&& geolocateButton.has(e.target).length === 0
			&& trailMenu.sidr.opened)
	{
		trailMenu.closeMenu();
		mapModule.unhighlightLayer();
	}
});
$(".trail-menu-button, .trail-menu-button-nav").on('click', function(e){
	e.preventDefault();
	trailMenu.openMenu();
});
$(".geolocate-button").on('click', function(e) {
	e.preventDefault();
	if(GeoLocation.canWatch) {
		$(".geolocate-symbol").toggleClass('btn-active');
		if(GeoLocation.watching !== false){
			GeoLocation.stopWatching();
		} else {
			GeoLocation.watchLocation();
		}
	} else {
		bootbox.alert("<span class='fa fa-exclamation-triangle'> Sorry, location isn't supported on yor device</span>");
	}


});
$(".sidr-close-button").on('click', function(e){
	trailMenu.closeMenu();
	mapModule.unhighlightLayer();
});
//initialize sidr
$("#tmenu").sidr({
	side: 'right',
	displace: false
});
