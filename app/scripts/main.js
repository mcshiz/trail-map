/*jslint browser: true*/
/*global L */

var mapModule = (function (window, document, L, undefined) {
	'use strict';
	var mapOptions = {};
	var map = null;
	mapOptions.init = function(window, document, L, undefined) {
		L.Icon.Default.imagePath = '/app/images/';
		mapOptions.fileArray = ['gateway', '8-mile'];

		/* create leaflet map, add layers, show users location */
		mapOptions.map = L.map('map');
		mapOptions.map.on('load', function () {
			$('.trail-menu-button, .geolocate-button').show();
			$(canvas).remove();
		});

		new L.tileLayer('//{s}.tile.stamen.com/terrain/{z}/{x}/{y}.png', {
			minZoom: 0,
			maxZoom: 18,
			attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
		}).addTo(mapOptions.map);


		$.each(mapOptions.fileArray, function (key, val) {
			mapOptions.trail = omnivore.kml('/app/layers/' + val + '.kml', null, mapOptions.customLayer);
		});

		mapOptions.customLayer.addTo(mapOptions.map);
		mapOptions.geolocationMarker = L.marker([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng], {icon: mapOptions.locationIcon}).addTo(mapOptions.map);
		mapOptions.serviceLayer.addTo(mapOptions.map);
		var count = 0;
		mapOptions.trail.on('ready', function() {
			count++;
			//wait for all layers to be loaded
			if(count === mapOptions.fileArray.length ) {
				if (window.location.pathname.match(/\/.+/)) {
					mapModule.singleView = true;
					mapModule.placeElevationProfile();
					var feature = decodeURI(window.location.pathname).replace('/', '');
					mapModule.showFeature(feature);
					mapOptions.map.dragging.disable();
					mapOptions.map.touchZoom.disable();
					mapOptions.map.doubleClickZoom.disable();
					mapOptions.map.scrollWheelZoom.disable();
					mapOptions.map.keyboard.disable();
					$('.enable-pan-button').show();
				} else {
					mapModule.placeElevationProfile('main');
					mapOptions.map.fitBounds(mapOptions.trailGroup.getBounds());
				}
			}
		});
	};

	mapOptions.LocationIcon = L.Icon.Default.extend({
		options: {
			iconUrl: '/app/images/marker-icon-location.png',
			iconSize: [15, 15],
			iconAnchor: [0, 0],
			shadowSize: [0, 0]
		}
	});
	mapOptions.locationIcon = new mapOptions.LocationIcon();
	mapOptions.RedIcon = L.Icon.Default.extend({
		options: {
			iconUrl: '/app/images/marker-icon-red.png'
		}
	});
	mapOptions.redIcon = new mapOptions.RedIcon();


	mapOptions.serviceMarkers = {
			fifthseason : L.marker([41.313467, -122.312349], {icon: mapOptions.redIcon}).bindPopup("Shasta Base Camp"),
			shastabasecamp : L.marker([41.311182, -122.310869], {icon: mapOptions.redIcon}).bindPopup("The Fifth Season"),
			bikeshop : L.marker([41.312045, -122.312162], {icon: mapOptions.redIcon}).bindPopup("The Bike Shop")
		};
		mapOptions.serviceLayer = L.layerGroup();

		mapOptions.addMarker = function(service){
			mapOptions.serviceLayer.addLayer(mapOptions.serviceMarkers[service])
		};
		mapOptions.removeMarker = function(service){
			if(service){mapOptions.serviceLayer.removeLayer(mapOptions.serviceMarkers[service]); return;}
			mapOptions.serviceLayer.clearLayers()
		};
		mapOptions.updatePosition = function(){
			mapOptions.map.removeLayer(mapOptions.geolocationMarker);
			mapOptions.geolocationMarker.setLatLng([GeoLocation.userLocation.lat, GeoLocation.userLocation.lng]).addTo(mapOptions.map);
		};
		mapOptions.elevationProfile = L.control.elevation({
			position: 'bottomleft',
			theme: 'steelblue-theme',
			width: $('#elevation-div').length ? $('#elevation-div').outerWidth() : Math.min($('#map').outerWidth(), 600),
			height: 125,
			margins: {
				top: 10,
				right: 20,
				bottom: 30,
				left: 0
			},
			useHeightIndicator: true, //if false a marker is drawn at map position
			interpolation: 'linear', //see https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_interpolate
			hoverNumber: {
				decimalsX: 3, //decimals on distance (always in km)
				decimalsY: 0, //deciamls on height (always in m)
				formatter: undefined //custom formatter function may be injected
			},
			xTicks: undefined, //number of ticks in x axis, calculated by default according to width
			yTicks: undefined, //number of ticks on y axis, calculated by default according to height
			collapsed: false    //collapsed mode, show chart on click or mouseover
		});

		mapOptions.placeElevationProfile = function(view){
			if(view === 'main'){
				mapOptions.elevationProfile.addTo(mapOptions.map);
			}  else {
				var container = mapOptions.elevationProfile.onAdd(mapOptions.map);
				document.getElementById('elevation-div').appendChild(container);
			}

		};

		mapOptions.trailGroup = L.featureGroup();
		mapOptions.customLayer = L.geoJson(null, {
			// http://leafletjs.com/reference.html#geojson-style
			style: function() {
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
					color: 'darkblue',
					opacity: 1,
					className: 'trailLayer'
				});
				layer.on('click', function(){
					mapOptions.showFeature(layer);
					trailMenu.openMenu();
				})
				.on('mouseover', function(){
					if(!feature.properties.selected) { layer.setStyle({color: 'red'}); }
				})
				.on('mouseout', function(){
					if(!feature.properties.selected) { layer.setStyle({color: 'darkblue'}); }
				});
			}
		});

		mapOptions.highlightLayer = function(trailLayer){
			var layer = null,
				feature = null;
			if(typeof trailLayer  === 'string') {
				$.each(mapModule.trailGroup._layers, function(key, l){
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
			// prevent clicking then immediately changing color to darkblue "on mouse out"
			layer.feature.properties.selected = true;
			layer.setStyle({
				color: 'blue'
			});
			trailMenu.highlightMenuItem(feature.properties.name);

		};
		mapOptions.unhighlightLayer = function(){
			mapOptions.trailGroup.eachLayer(function(layer){
				layer.feature.properties.selected = false;
				layer.setStyle({
					color: 'darkblue'
				});
			});
		};
		mapOptions.previewColor = function(trailLayer){
			$.each(mapOptions.trailGroup._layers, function(){
				if(typeof trailLayer  === 'string') {
					$.each(mapOptions.trailGroup._layers, function (key, l) {
						if (trailLayer === l.feature.properties.name) { l.setStyle({color: 'red'}); }
					});
				}
			});
		};
		mapOptions.baseColor = function(){
			var baseColor = 'darkblue';
			mapOptions.trailGroup.eachLayer(function(layer){
				layer.feature.properties.selected === true ?  baseColor = 'blue' : baseColor = 'darkblue';
				layer.setStyle({
					color: baseColor
				});
			});
		};

		mapOptions.showFeature = function(trailLayer){
			var layer = null,
				feature = null;
			if(typeof trailLayer  === 'string') {
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
			mapModule.highlightLayer(layer);
			mapModule.elevationProfile.clear();
			mapModule.elevationProfile.addData(feature, layer);
			mapModule.elevationProfile.show();
			mapOptions.map.fitBounds(layer.getBounds());

		};
	return mapOptions;
}(window, document, L, undefined));



var trailMenu = (function(){
	var $ = window.$;
	var options = {};
	options.sidr = {opened: false};
	var menu = $('#trail-menu-list');
	options.addListitem = function(trail){
		var trailName = trail.properties.name;
		var newListItem = ''+
			'<li class="menu-item" data-feature="'+trailName+'">'+trailName+
			'<span class="fa fa-plus menu-more-less"></span>'+
			'<a href="'+trailName+'" class="show-trail-details">View Details</a></li>';
		$(menu).prepend(newListItem);
	};
	options.openMenu = function(){
			options.sidr.opened = true;
			$.sidr('open', 'sidr');
	};
	options.closeMenu = function(){
			options.sidr.opened = false;
			$.sidr('close', 'sidr');
		if($('#map').outerWidth() > 600) {
			mapModule.elevationProfile.hide();
			mapModule.map.fitBounds(mapModule.trailGroup.getBounds());
		}
		var menuItems = $('#trail-menu-list li');
		$.each(menuItems , function(){
			options.collapseItem($(this).find('.menu-more-less'));
		});
	};
	options.highlightMenuItem = function(trailName){
		var elem = $('#trail-menu-list').find("[data-feature='" + trailName + "']").find('.menu-more-less');
		options.expandItem(elem);
	};
	options.expandItem = function(elem){
		$(elem).parent().animate({
			'height': '70px'
		},'fast').addClass('highlighted');
		$(elem).parent().siblings().animate({
			'height': '48px'
		},'fast').removeClass('highlighted');
		$(elem).removeClass('fa-plus').addClass('fa-minus');
		$(elem).parent().siblings().find('.menu-more-less').removeClass('fa-minus').addClass('fa-plus');
	};
	options.collapseItem = function(elem){
		if($(elem).hasClass('fa-minus')) { $(elem).parent().animate({'height': '48px'},'fast'); }
		$(elem).removeClass('fa-minus').addClass('fa-plus');
	};
	return options;
}(window));
$(document).on('click', '.menu-item', function(e){
	if($(e.target).hasClass('menu-more-less')) { return false; }
	if($(e.target).hasClass('service')) {
		$(e.target).toggleClass('selected');
		$.each($('.service'), function(){
			if($(this).hasClass('selected') === false) {
				$(this).removeClass('selected');
				mapModule.removeMarker($(this).data('service'));
			} else {
				mapModule.addMarker($(this).data('service'));
			}
		});
		return;
	}
	mapModule.showFeature($(this).data('feature'));
});
$(document).on('mouseover', '.menu-item', function(e){
	mapModule.previewColor($(this).data('feature'));
}).on('mouseout', '.menu-item', function() {
	mapModule.baseColor();
});
$(document).on('click', '.menu-more-less.fa-plus', function(e){
	trailMenu.expandItem(e.target);
});
$(document).on('click', '.menu-more-less.fa-minus', function(e){
	trailMenu.collapseItem(e.target);
});

$('.trail-menu-button, .trail-menu-button-nav').on('click', function(e){
	e.preventDefault();
	if(trailMenu.sidr.opened) {
		trailMenu.closeMenu();
	} else {
		trailMenu.openMenu();
	}
});
$('.geolocate-button').on('click', function(e) {
	e.preventDefault();
	if(GeoLocation.canWatch) {
		$('.geolocate-symbol').toggleClass('btn-active');
		if(GeoLocation.watching !== false){
			GeoLocation.stopWatching();
		} else {
			GeoLocation.watchLocation();
		}
	} else {
		bootbox.alert("<span class='fa fa-exclamation-triangle'> Sorry, location isn't supported on yor device</span>");
	}
});

$('.sidr-close-button').on('click', function(){
	trailMenu.closeMenu();
	mapModule.unhighlightLayer();
});
//initialize sid menu
$('#tmenu').sidr({
	side: 'right',
	displace: false
});
$('#contactForm').change(function(e){
	$('.form-error').remove();
});
$('#contactForm').submit(function(e){
	e.preventDefault();
	var sendEmail = true;
	$('#contactForm input, #contactForm textarea').each(function(){
			if($(this).val() === ''){
				$('.modal-body').prepend('<span class="text-danger form-error">* All Fields are required</span>');
				sendEmail = false;
				return false;
			}
	});
	if(!sendEmail) {return false;}
	$.ajax({
		url:'/contact',
		type:'post',
		data:$('#contactForm').serialize(),
		beforeSend : function (){
			$('#myModal .modal-body').html(''+
				'<h4 class="sending-email text-center">Sending Email</h4>'+
				'<div class="loading-container">'+
				'<div class="loader">'+
				'<div class="circle">&nbsp;</div>'+
				'<div class="circle">&nbsp;</div>'+
				'<div class="circle">&nbsp;</div>'+
				'<div class="circle">&nbsp;</div>'+
				'</div>'+
				'</div>'
			);
		},
		success:function(result){
			var data = JSON.parse(result);
			if(data.status === 200) {
				$('#myModal .modal-body').html('<h4 class="email-sent text-center">Email Sent, thanks!</h4>');
			}
		},
		error: function(){
			$('#myModal .modal-body').html('<h4>Something went wrong</h4><br><span>Please refresh this page and try again.</span>');
		}
	});
});
