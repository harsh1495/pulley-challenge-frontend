const algoliasearch = require("algoliasearch");

// algolia variables
const applicationId = "2VS9ZGWLCN";
const apiKey = "830283246b496f82e8c0d83394c14aa5";
const indexName = "shakespeare-pulley";
const hitsPerPage = 5;

const client = algoliasearch(applicationId, apiKey);
const index = client.initIndex(indexName);

export const getSearchResultsAlgolia = query => {
	// only query string
	return index.search(query, { hitsPerPage: hitsPerPage });
};
