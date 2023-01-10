import { By } from "selenium-webdriver";
import { ProjectList } from "../pageObjects/ProjectList";
import { LeftNavigation } from "../pageObjects/LeftNavigation";
import { Actions, Wait } from "ui-testing-core";
import { COMPARTMENT_NAME } from "./constants";

export const init = async () => {
  const leftNavigation = new LeftNavigation();
  const projectList = new ProjectList();
  await projectList.navigate();
  await leftNavigation.searchSelectCompartment(COMPARTMENT_NAME);
  await projectList.isPageLoaded();
};

export const byPageXpath = (xpath: string) => {
  return By.xpath(`//*[@id='data-science-wrapper']${xpath}`);
};

export const byDialogXpath = (xpath: string) => {
  return By.xpath(`//*[@id='oui-viewstack-root']${xpath}`);
};

export const byTestIdXPath = (testId: string, xpath: string) => {
  return By.xpath(`//*[@data-test-id='${testId}']${xpath}`);
};

/** Click action button for given element*/
export const isActionButtonEnabled = async (actionButton: By): Promise<boolean> => {
  try {
    const element = await Wait.waitForPresent(actionButton);
    const isDisabled: boolean = (await element.getAttribute("aria-disabled")) === "true";
    return !isDisabled;
  } catch (error) {
    console.error(
      `Waiting for ${actionButton.toString()} to enabled failed with the following error: ${
        error.message
      }`
    );
  }
};

/** Click resource name link in List View*/
export const clickResourceLink = async (resourceOcid: string): Promise<void> => {
  try {
    const newResourceLink = By.xpath(`//a[contains(@href, "${resourceOcid}")]`);
    await Actions.doClick(newResourceLink);
  } catch (error) {
    console.error(
      `Clicking the resource ${resourceOcid} in list view failed with the following error: ${error.message}`
    );
  }
};
