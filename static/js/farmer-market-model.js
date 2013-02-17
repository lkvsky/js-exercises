function FarmerMarket(marketInfo) {
	this.id = marketInfo._id;
	this.name = marketInfo.MarketName.toLowerCase().toTitleCase();
	this.city = marketInfo.City.toLowerCase().toTitleCase();
	this.state = marketInfo.State.toLowerCase();
	this.street = marketInfo.Street;
	this.zip = marketInfo.Zip;
	this.lat = marketInfo.y;
	this.lng = marketInfo.x;
	this.website = marketInfo.Website;
	this.specialties = {
		jams: marketInfo.Jams,
		vegetables: marketInfo.Vegetables,
		soap: marketInfo.Soap,
		nuts: marketInfo.Nuts,
		cheese: marketInfo.Cheese,
		seafood: marketInfo.Seafood,
		fruit: marketInfo.Fruit,
		herbs: marketInfo.Herbs,
		honey: marketInfo.Honey,
		flowers: marketInfo.Flowers,
		bakedGoods: marketInfo.Bakedgoods,
		crafts: marketInfo.Crafts,
		meat: marketInfo.Meats,
		plants: marketInfo.Plants
	};
}

FarmerMarket.prototype.getId = function() {
	return this.id;
};

FarmerMarket.prototype.getName = function() {
	return this.name;
};

FarmerMarket.prototype.getCity = function() {
	return this.city;
};

FarmerMarket.prototype.getStreet = function() {
	return this.street;
};

FarmerMarket.prototype.getState = function() {
	var longState = this.state;
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
	if (this.website === "" || this.website === " " || this.website === undefined) {
		return "Unknown";
	} else if (this.website !== undefined && this.website.indexOf("http://") === -1) {
		return "http://" + this.website;
	} else {
		return this.website;
	}
};

FarmerMarket.prototype.getSpecialties = function() {
	for (var item in this.specialties) {
		if (this.specialties[item] === "1") {
			this.specialties[item] = "" + item.toLowerCase().toTitleCase() + "";
			if (this.specialties[item] === "Bakedgoods") {
				this.specialties[item] = "Baked Goods";
			}
		} else {
			this.specialties[item] = "";
		}
	}
	return this.specialties;
};

function FlickrPhoto(json, index) {
	this.id = json.photos.photo[index].id;
	this.secret = json.photos.photo[index].secret;
	this.farm = json.photos.photo[index].farm.toString();
	this.server = json.photos.photo[index].server;
}