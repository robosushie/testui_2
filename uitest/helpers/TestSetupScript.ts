import { TestLifeCycle } from "ui-testing-core";

beforeAll(async () => {
  await TestLifeCycle.suiteStarted();
});

beforeEach(async () => {
  await TestLifeCycle.specStarted();
});

afterEach(async () => {
  await TestLifeCycle.specDone();
});

afterAll(async () => {
  await TestLifeCycle.suiteDone();
});
