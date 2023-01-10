import { By } from "selenium-webdriver";
import { ActionPanel } from "./ActionPanel";

export class ProjectCreatePanel extends ActionPanel {
  // selectors
  protected panelSelector: By = By.xpath(`//button[text()="Create project"]`);
  protected nameSelector: By = By.name("displayName");
  protected descriptionSelector: By = By.name("description"); //
  protected submitButtonSelector: By = By.xpath(
    `//button[@data-test-id="create-project-submit-button"]`
  );

  // Actions
  public async create(name: string, description?: string): Promise<void> {
    try {
      await this.enterText(this.nameSelector, name);
      description && (await this.enterTextArea(this.descriptionSelector, description));
      await this.clickSubmitButton();
    } catch (error) {
      console.error("Project create failed:", error);
    }
  }
}
