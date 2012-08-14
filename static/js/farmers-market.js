function initializeApp() {
			//Hide loading text and display header
			$("#loading").hide();
			$("#page-header").show();
			$("#search-form").show();
			$("#fm-container").show();

			//Initial map setup
			var initialLocation;
			var defaultLocation = new google.maps.LatLng(41.5, -119.400);
			var initialZoom = 14;
			var defaultZoom = 5;

			var mapOptions = {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				mapTypeControl: false,
				streetViewControl: false
			};
			var fmMap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
			var geocoder = new google.maps.Geocoder();

			//Check the user's location
			if(navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
					fmMap.setCenter(initialLocation);
					fmMap.setZoom(initialZoom);
				});
			} else {
				fmMap.setCenter(defaultLocation);
				fmMap.setZoom(defaultZoom);
			}

			//Geocode user input
			function codeAddress() {
				var address = $("#search-map-input").val();
				var newMarkerOptions = google.maps.MarkerOptions;
				geocoder.geocode( {"address": address}, function(results, status) {
					if (status === google.maps.GeocoderStatus.OK) {
						fmMap.setCenter(results[0].geometry.location);
						fmMap.setZoom(14);
					} else {
						alert("Oops -- We don't know where that is!");
					}
				});
			}
			$("#search-map-btn").on("click", codeAddress);
			$("#search-map-input").keyup(function(e) {
				if(e.keyCode === 13) {
					codeAddress();
				}
			});

			//Flesh out UI with markers, info windows and market info
			function generateUi(info, marketItems) {
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
				fmMarker.setVisible(false);
				$($marketDiv[0]).hide();
				var fmInfoWindow = new google.maps.InfoWindow({
				});
				fmInfoWindow.maxWidth = 250;

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
						wesbite = "Unknown";
					}
					var windowContent = "<strong>" + info.market + "</strong>" + "<br>" + info.street + "<br>" + info.city + ", " + info.abrState + " " + info.zip + "<br><br><strong>Specialties:</strong> " + specialtiesStr + "<br><br><strong><a href='" + website + "' target='_blank'>Website</a></strong>";
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

				//Setting visibility for only markers/divs in the viewport
				google.maps.event.addListener(fmMap, "bounds_changed", function() {
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
					for (i = 0; i < marketArr.length; i++) {
						if (marketArr[i].properties.State == "California" || marketArr[i].properties.State == "Oregon" || marketArr[i].properties.State == "Washington") {
							if (marketArr[i].properties.City !== undefined && marketArr[i].properties.State !== undefined) {
								var marketIndex = marketArr[i];
								var market = marketIndex.properties.MarketName.toLowerCase().toTitleCase();
								var city = marketIndex.properties.City.toLowerCase().toTitleCase();
								var state = marketIndex.properties.State.toLowerCase().toTitleCase();
								var abrState;
								if (state === "California") {
									abrState = "CA";
								} else if (state === "Oregon") {
									abrState = "OR";
								} else if (state === "Washington") {
									abrState = "WA";
								}
								var street = marketIndex.properties.Street;
								var zip = marketIndex.properties.Zip;
								var lat = marketIndex.properties.y;
								var lng = marketIndex.properties.x;
								var marketDivId = marketIndex.properties._id;
								var marketItems = {
									jams: marketIndex.properties.Jams,
									vegetables: marketIndex.properties.Vegetables,
									soap: marketIndex.properties.Soap,
									nuts: marketIndex.properties.Nuts,
									cheese: marketIndex.properties.Cheese,
									seafod: marketIndex.properties.Seafood,
									fruit: marketIndex.properties,
									herbs: marketIndex.properties.Herbs,
									honey: marketIndex.properties.Honey,
									flowers: marketIndex.properties.Flowers,
									bakedGoods: marketIndex.properties.Bakedgoods,
									crafts: marketIndex.properties.Crafts,
									meat: marketIndex.properties.Meats,
									plants: marketIndex.properties.Plants
								};
								var website = marketIndex.properties.Website;
								for (key in marketItems) {
									if (marketItems[key] === "1") {
										marketItems[key] = "" + key + "";
									} else {
										marketItems[key] = "";
									}
								}
								var uiObject = {
									lat: lat,
									lng: lng,
									markerId: marketDivId,
									market: market,
									city: city,
									state: state,
									street: street,
									zip: zip,
									abrState: abrState,
									website: website
								};
								if (lat) {
									generateUi(uiObject, marketItems);
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