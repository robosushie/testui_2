var TestLifeCycle_1 = require("ui-testing-core");
var path = require("path");

class TestSetupReporter {
  constructor(globalConfig, options) {}

  onTestStart(test) {
    TestLifeCycle_1.TestLifeCycle.setSuiteName(path.parse(test.path).name);
  }

  onTestResult(test, testResult, aggregatedResult) {
    TestLifeCycle_1.TestLifeCycle.appendTestResult(testResult, aggregatedResult);
  }
}

module.exports = TestSetupReporter;
