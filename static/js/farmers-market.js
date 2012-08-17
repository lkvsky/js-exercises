function initializeApp() {
			//Hide loading text and display header
			$("#loading").hide();
			$("#side-bar").hide();
			$("#fixed-canvas").attr("style", "width: 97%;");
			$("#fm-container").show();

			//Initial map setup
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

			//Check the user's location
			function handleNoGeolocation() {
				fmMap.setCenter(defaultLocation);
				fmMap.setZoom(defaultZoom);
			}
			if(navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					$("#fixed-canvas").attr("style", "width: 60%;");
					$("#side-bar").show();
					initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
					fmMap.setCenter(initialLocation);
					fmMap.setZoom(initialZoom);
				}, function() {
					handleNoGeolocation();
				});
			} else {
				handleNoGeolocation();
			}

			//Geocode user input
			function codeAddress() {
				$("#fixed-canvas").attr("style", "width: 60%;");
				$("#side-bar").show();
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
					$("#side-bar").show();
					$("#fixed-canvas").attr("style", "width: 60%;");
					codeAddress();
				}
			});


			//Flesh out UI with markers, info windows and market info
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
				var fmInfoWindow = new google.maps.InfoWindow({
				});
				fmInfoWindow.maxWidth = 300;
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
				function infoWindowContent() {
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
					var windowContent = "<div><strong>" + info.market + "</strong>" + "<br>" + info.street + "<br>" + info.city + ", " + info.state + " " + info.zip + "<br><br><strong>Specialties:</strong> " + specialtiesStr + "<br><br><strong><a href='" + info.website + "' target='_blank'>Website</a></strong><div>";
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
								var imgObj = new FlickrPhoto(json);
								$flickrImg = $("<img>");
								$flickrImg.attr("src", "http://farm" + imgObj.farm + ".staticflickr.com/" + imgObj.server + "/" + imgObj.id + "_" + imgObj.secret + "_m.jpg");
								windowContent += "<br><br><div>" + $flickrImg[0] + "</div>";
								fmInfoWindow.setContent(windowContent);
							} else {
								return;
							}
						}
					});
				}
				

				//Listeners to invoke info windows
				function openInfoWindow() {
					infoWindowContent();
					$("#farmers-markets div").removeClass("selected");
					$marketDiv.addClass("selected");
					fmInfoWindow.open(fmMap,fmMarker);
				}
				google.maps.event.addListener(fmMarker, "click", openInfoWindow);
				google.maps.event.addDomListener($marketDiv[0], "click", openInfoWindow);
				google.maps.event.addListener(fmInfoWindow, "closeclick", function() {
					$("#farmers-markets div").removeClass("selected");
				});
				google.maps.event.addListener(fmMap, "bounds_changed", visibleMarkers);
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
					for (i = 0; i < marketArr.length; i++) {
						if (marketArr[i].properties.State == "California" || marketArr[i].properties.State == "Oregon" || marketArr[i].properties.State == "Washington") {
							if (marketArr[i].properties.City !== undefined && marketArr[i].properties.State !== undefined) {
								var marketObj = marketArr[i].properties;
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
					}
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