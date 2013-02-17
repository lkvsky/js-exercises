function initializeApp() {
			$("#loading").hide();
			$("#fm-container").show();

			//Setup map and check user's location
			var initialLocation;
			var defaultLocation = new google.maps.LatLng(41.5, -119.400);
			var initialZoom = 12;
			var defaultZoom = 5;
			var mapOptions = {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControl: false,
				streetViewControl: false
			};
			var fmMap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
			var geocoder = new google.maps.Geocoder();
			var fmInfoWindow = new google.maps.InfoWindow();
			fmInfoWindow.setOptions({maxWidth: 260});

			function locationErrorCheck() {
				if ($("#farmers-markets div").filter(":visible").length === 0) {
					$("#market-error").show();
				} else {
					$("#market-error").hide();
				}
			}

			function handleNoGeolocation() {
				fmMap.setCenter(defaultLocation);
				fmMap.setZoom(defaultZoom);
			}
			if(navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
					fmMap.setCenter(initialLocation);
					fmMap.setZoom(initialZoom);
				}, function() {
					handleNoGeolocation();
				});
			} else {
				handleNoGeolocation();
			}

			//Search map based on user's input
			function codeAddress() {
				var finished;
				var address = $("#search-map-input").val();
				var newMarkerOptions = google.maps.MarkerOptions;
				geocoder.geocode( {"address": address}, function(results, status) {
					if (status === google.maps.GeocoderStatus.OK) {
						fmMap.setCenter(results[0].geometry.location);
						fmMap.setZoom(12);
					} else {
						alert("Oops -- We don't know where that is!");
					}
				});
			}

			$("#search-map-input").keypress(function(e) {
				if(e.keyCode === 13) {
					codeAddress();
				}
			});

			//Generate sidebar, map markers, info window content, listeners
			function generateUi(info) {
				var $marketDiv = $("<div>").append(info.market + "<br>" + info.city + ", " + info.state);
				$marketDiv.attr("id", info.markerId);
				$marketDiv.attr("class", "well");
				$("#farmers-markets").append($marketDiv);
				var fmLatLng = new google.maps.LatLng(info.lat,info.lng);
				var fmMarker = new google.maps.Marker({
					position: fmLatLng,
					title: info.markerId
				});
				fmMarker.setMap(fmMap);
				fmMarker.setVisible(false);
				$marketDiv.hide();

				//Setting visibility for only markers/divs in the viewport
				function visibleMarkers() {
					if (fmMap.zoom > 5) {
						var currentBounds = fmMap.getBounds();
						var boundsContains = currentBounds.contains(fmLatLng);
						if (boundsContains === true) {
							fmMarker.setVisible(true);
							$marketDiv.show();
						} else {
							fmMarker.setVisible(false);
							$marketDiv.hide();
						}
					}
				}
				visibleMarkers();

				//setting info window content
				function setInfoWindowContent() {
					var specialties = [];
					var specialtiesStr;
					for (var key in info.items) {
						if (info.items[key] !== "") {
							specialties.push(info.items[key]);
						}
					}
					specialtiesStr = specialties.join(", ");
					if (specialtiesStr === "") {
						specialtiesStr = "Unknown";
					}
					var source = $("#info-window-template").html();
					var template = Handlebars.compile(source);
					var windowContent = template({info: info, specialties: specialtiesStr});
					fmInfoWindow.setContent(windowContent);
					$.ajax({
						url: "http://api.flickr.com/services/rest/",
						data: {
							api_key: "013e5bbe996adcd69d3ac205794e8d92",
							method: "flickr.photos.search",
							tags: "farmersmarket",
							lat: info.lat,
							lon: info.lng,
							format: "json"
						},
						dataType: "jsonp",
						jsonp: "jsoncallback",
						success: function(json) {
							if (json.photos.photo[0]){
								var imgObj1 = new FlickrPhoto(json, 0);
								var imgUrl1 = "http://farm" + imgObj1.farm + ".staticflickr.com/" + imgObj1.server + "/" + imgObj1.id + "_" + imgObj1.secret + "_s.jpg";
								var imgObj2 = new FlickrPhoto(json, 1);
								var imgUrl2 = "http://farm" + imgObj2.farm + ".staticflickr.com/" + imgObj2.server + "/" + imgObj2.id + "_" + imgObj2.secret + "_s.jpg";
								var imgObj3 = new FlickrPhoto(json, 2);
								var imgUrl3 = "http://farm" + imgObj3.farm + ".staticflickr.com/" + imgObj3.server + "/" + imgObj3.id + "_" + imgObj3.secret + "_s.jpg";
								windowContent += "<img src='" + imgUrl1 + "'> <img src='" + imgUrl2 + "'> <img src='" + imgUrl3 + "'>";
								fmInfoWindow.setContent(windowContent);
							} else {
								return;
							}
						}
					});
				}

				//invoke info window
				function openInfoWindow() {
					var markerPosition = fmMarker.getPosition();
					fmInfoWindow.setPosition(markerPosition);
					setInfoWindowContent();
					$("#farmers-markets div").removeClass("selected");
					$marketDiv.addClass("selected");
					fmInfoWindow.open(fmMap,fmMarker);
				}

				//marker and map listeners
				google.maps.event.addListener(fmMarker, "click", openInfoWindow);
				google.maps.event.addDomListener($marketDiv[0], "click", openInfoWindow);
				google.maps.event.addListener(fmInfoWindow, "closeclick", function() {
					$($marketDiv).removeClass("selected");
				});
				google.maps.event.addListener(fmMap, "bounds_changed", function() {
					visibleMarkers();
				});
			}
		
			//Loads all farmer's market data and populates map accordingly
			function loadMarketData() {
				var key = "http://usda.iriscouch.com/farmers_markets/_design/geo/_spatiallist/geojson/full?bbox=-144,20,-114,49";
				var json = lscache.get(key);

				//Check if json file is stored in local storage, if not, ajax
				if (json) {
					processData(json);
				} else {
					fetchJSON();
				}

				//Process the JSON file and populate app accordingly
				function processData(json) {
					var marketArr = json.features;
					var i;
					$(marketArr).each(function() {
						if (this.properties.State == "California" || this.properties.State == "Oregon" || this.properties.State == "Washington") {
							if (this.properties.City !== undefined && this.properties.State !== undefined) {
								var marketObj = this.properties;
								var fMarket = new FarmerMarket(marketObj);
								var fUi = {
									lat: fMarket.getLat(),
									lng: fMarket.getLng(),
									markerId: fMarket.getId(),
									market: fMarket.getName(),
									city: fMarket.getCity(),
									state: fMarket.getState(),
									street: fMarket.getStreet(),
									zip: fMarket.getZip(),
									website: fMarket.getWebsite(),
									items: fMarket.getSpecialties()
								};
								if (fMarket.getLat()) {
									generateUi(fUi);
								}
							}
						}
					});
				}

				//Ajax call to fetch data
				function fetchJSON() {
						$.ajax({
						url: key,
						dataType: "jsonp",
						success: function(json) {
							processData(json);
							lscache.set(key, json);
						}
					});
				}
			}
			loadMarketData();
		}