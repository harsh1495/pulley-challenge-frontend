// @ts-check
import React, { useState } from "react";
import * as api from "./api";
import config from "./config";
import Loader from "./Loader";
import { getSearchResultsAlgolia } from "./algolia";

import "./App.scss";

function App() {
	// The query which user searches for
	const [query, setQuery] = useState("");

	// A variable to track whether the user has performed the search yet or not - used for animations
	const [hasSearched, setHasSearched] = useState(false);

	// This holds the list of search results available for a query
	const [searchResults, setSearchResults] = useState([]);

	// This holds the list of search results returned from Algolia after every keystroke
	const [algoliaSearchResults, setAlgoliaSearchResults] = useState([]);

	// Pagination
	// In one query, we get `resultsToFetchInOneRequest` in total
	// But the results are large
	// So on the results panel, we can only show one result ( out of `resultsToFetchInOneRequest` ) at a time
	// So we maintain pagination at two places - locally and with the backend.
	const [queryStartParameter, setQueryStartParameter] = useState(0);

	// Because there is going to be only one result to be shown on the UI at once,
	// We need to track which result is actually being shown - We need to keep track the index of that
	const [currentResultIndex, setCurrentResultIndex] = useState(1);
	const [numberOfTotalResults, setNumberOfTotalResults] = useState(0);

	// loading and error states
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState();

	function renderSearchPanel() {
		function onQueryChange(e) {
			setQuery(e.target.value);
			setHasSearched(false);
			setError(null);
			// calling the algolia search api
			// getSearchResultsAlgolia(e.target.value)
			// 	.then(({ hits }) => {
			// 		const textToShow = hits.map(hit => {
			// 			const highlightedValue = hit._highlightResult.raw_content.value.trim();
			// 			return highlightedValue.substring(
			// 				highlightedValue.indexOf("<em>") - 50,
			// 				highlightedValue.indexOf("<em>") + 50
			// 			);
			// 		});
			// 		setAlgoliaSearchResults(textToShow);
			// 	})
			// 	.catch(err => console.log(err));
		}
		async function onFormSubmit(e) {
			e.preventDefault(); // This prevents the form from submitting - Thus prevents from the page being reloaded
			document.activeElement.blur(); // This removes the focus from the input element
			setLoading(true);
			setError(null);
			setAlgoliaSearchResults([]);
			setCurrentResultIndex(1); // Resetting the pagination
			try {
				const response = await api.getSearchResults({ query });
				if (!response.data.error) {
					setHasSearched(true);
					setNumberOfTotalResults(response.data.total_count);
					setSearchResults(response.data.results);
					setQueryStartParameter(0);
					setCurrentResultIndex(1);
				} else {
					setError(response.data.error);
				}
			} catch (error) {
				const message = error.message || "Something went wrong";
				setError(message);
			} finally {
				setLoading(false);
			}
		}

		function renderSearchIcon() {
			if (!query || hasSearched) return;
			if (loading) {
				return <Loader />;
			}
			return (
				<button type="submit" className="search-arrow">
					➜
				</button>
			);
		}

		function renderLines() {
			if (query) return;
			return (
				<div className={`input-lines ${hasSearched ? "searched" : ""}`}>
					<img src="res/images/lines.png" alt=""></img>
				</div>
			);
		}

		function renderSearchResultList() {
			if (!query || hasSearched) return;
			if (algoliaSearchResults.length === 0) return;
			return (
				<div className="input-search-results">
					<div className="datalist" id="search-results">
						{algoliaSearchResults.map((hit, index) => (
							<div
								className="option"
								key={index}
								dangerouslySetInnerHTML={{
									__html: hit
								}}
							></div>
						))}
					</div>
				</div>
			);
		}

		function renderError() {
			if (!error) return;
			return (
				<div className="search-error-container">
					<div>The search query "{query}" resulted in an error:</div>
					{error}
				</div>
			);
		}

		return (
			<div className="search-panel-container">
				<form onSubmit={onFormSubmit}>
					<div className="search-input-container">
						<div className="input-box-wrapper">
							<div className="input-box">
								<img
									className={`search-icon ${hasSearched ? "searched" : ""}`}
									src="res/images/search.png"
									alt=""
								></img>
								<input
									className="search-input"
									placeholder="What art thee looking f'r?"
									list="search-results"
									value={query}
									onChange={onQueryChange}
								></input>
								{renderSearchIcon()}
							</div>
							{renderLines()}
						</div>
						{renderError()}
						{renderSearchResultList()}
					</div>
				</form>
			</div>
		);
	}

	function renderResultsPanel() {
		function onPreviousClick() {
			// Math.max makes sure it does not go below 1 ever
			setCurrentResultIndex(Math.max(1, currentResultIndex - 1));
		}

		async function onNextClick() {
			// It should never go beyond `numberOfTotalResults`
			const nextResultIndex = Math.min(numberOfTotalResults, currentResultIndex + 1);
			setCurrentResultIndex(nextResultIndex);

			// We need to fetch more results in case the user is about to reach the end of the current result set
			// We try to fetch next set of results when the user has reached 70% of the current window
			// So if the current active window is [10, 20] then we fetch next results (20, 30) when the user is on 17th page
			if (nextResultIndex >= queryStartParameter + 0.7 * config.resultsToFetchInOneRequest) {
				const start = queryStartParameter + config.resultsToFetchInOneRequest;
				setQueryStartParameter(start);
				try {
					const response = await api.getSearchResults({ query, start });
					if (!response.data.error) {
						setSearchResults([...searchResults, ...response.data.results]);
					} else {
						setError(response.data.error);
					}
				} catch (error) {
					const message = error.message || "Something went wrong";
					setError(message);
				}
			}
		}
		const resultIndex = currentResultIndex - 1;
		const result = searchResults[resultIndex];
		return (
			<div className="results-panel-container">
				<div className={`shakes-img-container ${hasSearched ? "searched" : ""}`}>
					<div className="push"></div>
					<div className="shakes-img-container--inner">
						<div className="push"></div>
						<img src="res/images/shakespeare.png" alt=""></img>
					</div>
				</div>
				<div className={`search-results-container ${hasSearched ? "searched" : ""}`}>
					{result && <h3>{result.book}</h3>}
					{result && (
						<div>
							<p
								dangerouslySetInnerHTML={{
									__html: result.raw_content.replace(
										/\b([A-Z]{2,})\b/g,
										"<b class='search-result-item--speaker'>$1</b>"
									)
								}}
							></p>
						</div>
					)}
				</div>
				<div className={`search-results-pagination-controls ${hasSearched ? "searched" : ""}`}>
					<div className="push"></div>
					<div className="pagination-controls">
						<span>
							{currentResultIndex} of {numberOfTotalResults}
						</span>
						<button disabled={currentResultIndex <= 1} onClick={onPreviousClick}>
							〈
						</button>
						<button disabled={currentResultIndex + 1 > numberOfTotalResults} onClick={onNextClick}>
							〉
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="app-container">
			<div className="title">Shakesearch</div>
			<div className="panel-container">
				<div className="panel panel-left">{renderSearchPanel()}</div>
				<div className="panel panel-right">{renderResultsPanel()}</div>
			</div>
		</div>
	);
}

export default App;
