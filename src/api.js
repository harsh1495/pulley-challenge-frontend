import axios from "axios";
import config from "./config";

export const getSearchResults = (
	{ query, start = 0, size = config.resultsToFetchInOneRequest },
	{ headers = {} } = {}
) => {
	const URL = `${config.API_URL}/search?q=${encodeURIComponent(query)}&start=${start}&size=${size}`;
	return axios.get(URL, { headers });
};
