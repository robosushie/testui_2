import { Actions, getConfig, BasePluginPage } from "ui-testing-core";
import { By } from "selenium-webdriver";

export class ProjectList extends BasePluginPage<ProjectList> {
  /* Projects Page URL */
  protected pageUrl: string = `${getConfig("driverInfo").pluginName}projects?${
    getConfig("driverInfo").pluginOverride
  }`;

  /* Plugin is not a legacy plugin */
  protected isLegacyPlugin: boolean = false;

  /* Locator to help BasePluginPage determine if the Projects page has loaded successfully */
  protected pageLoadedElement: By = ProjectList.TITLE;

  /* Page Locators */
  private static TITLE: By = By.xpath('//*[@id="oui-savant__listing-content"]/div/h1/div');
  public CREATE_PROJECT_BUTTON: By = By.xpath('//button[text()="Create project"]');

  public async openCreateProjectPanel(): Promise<void> {
    try {
      await Actions.doClick(this.CREATE_PROJECT_BUTTON);
    } catch (error) {
      console.error(
        `Selecting the create project button failed with the following error: ${error.message}`
      );
    }
  }
}
