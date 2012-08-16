function initializeApp() {
			//Hide loading text and display header
			$("#loading").hide();
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


			//Flesh out UI with markers, info windows and market info
			function generateUi(info, marketItems) {
				/*var fmStreetAddress;
				var fmCityState;
				function reverseGeocode() {
					if (info.lat) {
						var geoGeocoder = new google.maps.Geocoder();
						var geoLatLng = new google.maps.LatLng(info.lat,info.lng);
						console.log(geoLatLng);
						geoGeocoder.geocode({"latLng": geoLatLng}, function(results, status) {
							if (status === google.maps.GeocoderStatus.OK) {
								fmStreetAddress = results[0].formatted_address;
								fmCityState = results[4].formatted_address;
								console.log(fmStreetAddress);
								console.log(fmCityState);
							}
						});
					}
				}
				reverseGeocode();

				//generate flickr image
				var $flickrImg;
				function flickrPhotos(json) {
					var photo = json.photos.photo[0];
					$flickrImg = $("<img>");
					var imgId = photo.id;
					var secretId = photo.secret;
					var farmId = photo.farm;
					var serverId = photo.server;
					$flickrImg.atrr("src", "http://farm" + farmID + ".staticflickr.com/" + serverId + "/" + imgId + "_" + secretId + "_s.jpg");
					console.log($flickrImg.src);
				}
				function fetchFlickr(lat, lng) {
					var $script = $("<script>");
					$script.attr("src", "http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=013e5bbe996adcd69d3ac205794e8d92&lat=" + lat + "&lon=" + lng + "&tags=food&format=json&callback=flickrPhotos");
					$script.appendTo("body");
				}
				fetchFlickr(info.lat,info.lng);*/

				var $marketDiv = $("<div>").append(info.market + "<br>" + info.city + ", " + info.state);
				$marketDiv.attr("id", info.markerId);
				$marketDiv.attr("class", "well");
				$marketDiv.attr("data-market", info.market);
				$marketDiv.attr("data-state", info.state);
				$marketDiv.attr("data-city", info.city);
				$marketDiv.attr("data-lat", info.lat);
				$marketDiv.attr("data-lng", info.lng);
				$("#farmers-markets").append($marketDiv);
				var fmLatLng = new google.maps.LatLng(info.lat,info.lng);
				var fmMarker = new google.maps.Marker({
					position: fmLatLng,
					title: info.markerId
				});
				fmMarker.setMap(fmMap);
				var fmInfoWindow = new google.maps.InfoWindow({
				});
				fmInfoWindow.maxWidth = 250;
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
					var specialtiesTitleCased = [];
					var specialtiesStr;
					for (var key in marketItems) {
						if (marketItems[key] !== "" && marketItems[key] !== undefined) {
							specialties.push(marketItems[key]);
						}
					}
					for (var i = 0; i < specialties.length; i++) {
						var word = specialties[i].toLowerCase().toTitleCase();
						if (word === "Bakedgoods") {
							word = "Baked Goods";
						}
						specialtiesTitleCased.push(word);
					}
					specialtiesStr = specialtiesTitleCased.join(", ");
					if (specialtiesStr === "") {
						specialtiesStr = "Unknown";
					}
					var website = info.website;
					if (website === "" || website === " ") {
						website = "Unknown";
					}
					var windowContent = "<strong>" + info.market + "</strong>" + "<br>" + info.street + "<br>" + info.city + ", " + info.state + " " + info.zip + "<br><br><strong>Specialties:</strong> " + specialtiesStr + "<br><br><strong><a href='" + website + "' target='_blank'>Website</a></strong>";
					fmInfoWindow.setContent(windowContent);
				}
				infoWindowContent();

				//Listeners to invoke info windows
				function openInfoWindow() {
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
								var marketIndex = marketArr[i];
								var fMarket = new FarmerMarket(marketIndex);
								var fId = fMarket.getId();
								var fName = fMarket.getName();
								var fCity = fMarket.getCity();
								var fState = fMarket.getState();
								var fStreet = fMarket.getStreet();
								var fZip = fMarket.getZip();
								var fLat = fMarket.getLat();
								var fLng = fMarket.getLng();
								var fItems = fMarket.getSpecialties();
								var fWebsite = fMarket.getWebsite();
								for (var key in fItems) {
									if (fItems[key] === "1") {
										fItems[key] = "" + key + "";
									} else {
										fItems[key] = "";
									}
								}
								var fUi = {
									lat: fLat,
									lng: fLng,
									markerId: fId,
									market: fName,
									city: fCity,
									state: fState,
									street: fStreet,
									zip: fZip,
									website: fWebsite
								};
								if (fLat) {
									generateUi(fUi, fItems);
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