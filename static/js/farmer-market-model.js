function FarmerMarket(marketInfo) {
	this.id = marketInfo.properties._id;
	this.name = marketInfo.properties.MarketName;
	this.city = marketInfo.properties.City;
	this.state = marketInfo.properties.State;
	this.street = marketInfo.properties.Street;
	this.zip = marketInfo.properties.Zip;
	this.lat = marketInfo.properties.y;
	this.lng = marketInfo.properties.x;
	this.website = marketInfo.properties.Website;
	this.specialties = {
		jams: marketInfo.properties.Jams,
		vegetables: marketInfo.properties.Vegetables,
		soap: marketInfo.properties.Soap,
		nuts: marketInfo.properties.Nuts,
		cheese: marketInfo.properties.Cheese,
		seafood: marketInfo.properties.Seafood,
		fruit: marketInfo.properties,
		herbs: marketInfo.properties.Herbs,
		honey: marketInfo.properties.Honey,
		flowers: marketInfo.properties.Flowers,
		bakedGoods: marketInfo.properties.Bakedgoods,
		crafts: marketInfo.properties.Crafts,
		meat: marketInfo.properties.Meats,
		plants: marketInfo.properties.Plants
	};
}

FarmerMarket.prototype.getId = function() {
	return this.id;
};

FarmerMarket.prototype.getName = function() {
	return this.name.toLowerCase().toTitleCase();
};

FarmerMarket.prototype.getCity = function() {
	return this.city.toLowerCase().toTitleCase();
};

FarmerMarket.prototype.getStreet = function() {
	return this.street;
};

FarmerMarket.prototype.getState = function() {
	var longState = this.state.toLowerCase();
	var mapping = {
		"california": "CA",
		"oregon": "OR",
		"washington": "WA"
	};
	return mapping[longState];
};

FarmerMarket.prototype.getZip = function() {
	if (this.zip) {
		return this.zip;
	} else {
		return "";
	}
};

FarmerMarket.prototype.getLat = function() {
	if (this.lat) {
		return this.lat;
	}
};

FarmerMarket.prototype.getLng = function() {
	if (this.lng) {
		return this.lng;
	}
};

FarmerMarket.prototype.getWebsite = function() {
	if (this.website === "" || this.website === " ") {
		return "Unknown";
	} else {
		return this.website;
	}
};

FarmerMarket.prototype.getSpecialties = function() {
	return this.specialties;
};