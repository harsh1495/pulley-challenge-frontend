const developmentConfig = {
	protocol: "http",
	HOST: "localhost",
	PORT: "8000",
	get API_URL() {
		return `${this.protocol}://${this.HOST}:${this.PORT}`;
	},

	resultsToFetchInOneRequest: 10
};

const productionConfig = {
	protocol: "https",
	HOST: "pulley-challenge-harsh.herokuapp.com",
	get API_URL() {
		return `${this.protocol}://${this.HOST}`;
	},
	resultsToFetchInOneRequest: 10
};

const configToExport = {
	...(process.env.NODE_ENV === "development" && developmentConfig),
	...(process.env.NODE_ENV === "production" && productionConfig)
};

export default configToExport;
