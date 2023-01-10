import { queryHelpers, buildQueries, Matcher, MatcherOptions } from "@testing-library/react";

// The queryAllByAttribute is a shortcut for attribute-based matchers
// You can also use document.querySelector or a combination of existing
// testing library utilities to find matching nodes for your query
const queryAllByOuiTestId = (...args: [HTMLElement, Matcher, MatcherOptions?]) =>
  queryHelpers.queryAllByAttribute("data-test-id", ...args);

const getMultipleError = (container: HTMLElement, testId: string) =>
  `Found multiple elements with the data-test-id attribute of: ${testId}`;
const getMissingError = (container: HTMLElement, testId: string) =>
  `Unable to find an element with the data-test-id attribute of: ${testId}`;

const [queryByOuiTestId, getAllByOuiTestId, getByOuiTestId, findAllByOuiTestId, findByOuiTestId] =
  buildQueries(queryAllByOuiTestId, getMultipleError, getMissingError);

export {
  queryByOuiTestId,
  queryAllByOuiTestId,
  getByOuiTestId,
  getAllByOuiTestId,
  findAllByOuiTestId,
  findByOuiTestId,
};
