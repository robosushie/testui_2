import { TimeInterval } from "oui-savant";
import { Actions, Wait } from "ui-testing-core";
import { By } from "selenium-webdriver";

export class LeftNavigation {
  /* Scope Locators */
  protected compartmentDropdown: By = By.xpath("//a[contains(@id, 'active_compartment_select')]");
  protected searchCompartmentsField: By = By.xpath("//input[@placeholder='Search compartments']");

  /* Left Navigation Menu Methods */
  public async openCompartmentMenu(): Promise<void> {
    try {
      await Wait.waitForPresent(this.compartmentDropdown, TimeInterval.md);
      await Actions.doClick(this.compartmentDropdown);
    } catch (error) {
      console.error(
        `Opening the compartment menu failed with the following error: ${error.message}`
      );
    }
  }

  public async searchCompartment(compartment: string): Promise<void> {
    try {
      await Actions.clearText(this.searchCompartmentsField);
      await Actions.enterText(this.searchCompartmentsField, compartment);
    } catch (error) {
      console.error(
        `Searching for the ${compartment} compartment failed with the following error: ${error.message}`
      );
    }
  }

  public async selectCompartment(compartment: string): Promise<void> {
    try {
      await Actions.doClick(By.xpath(`//span[@class='node-label' and text()=\"${compartment}\"]`));
    } catch (error) {
      console.error(
        `Selecting the ${compartment} compartment failed with the following error: ${error.message}`
      );
    }
  }

  public async searchSelectCompartment(compartment: string): Promise<void> {
    try {
      await this.openCompartmentMenu();
      await this.selectCompartment(compartment);
    } catch (error) {
      console.error(
        `Searching for and selecting the ${compartment} compartment failed with the following error: ${error.message}`
      );
    }
  }
}
