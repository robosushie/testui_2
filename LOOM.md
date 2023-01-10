## Start plugin locally

```bash
yarn install && yarn start

# or

yarn open
```

This will bring up a Webpack instance serving assets at `https://localhost:8484`. Webpack will watch files in development - as you change source, it will recompile as necessary. The console does not support hot reloading of plugins today. You will need to reload the page after your plugin has recompiled.

**IMPORTANT**: Plugins cannot run on their own. You will need to use one of the urls found in the Integrate section to interact with your running plugin.

## Integrate with the OCI Console

You don't need to spin up a console service on local machine. All you need is open (and bookmark) one of below urls that integrate your local plugin to the OCI Console on production endpoint by overriding console config. The query string may go away when navigating but the override stays the whole session until the browser is closed. It's possible that you will not have access to some of these regions; By default the plugin will open(`yarn open`) in `IAD`. If you would like `yarn open` to open a different region you can provide it with the `--env.region` flag.

To open your plugin in the console for any other region `cd` to your plugin's directory and call `oci-plugin-cli open --region {region}`. This will use your `overrides/manifest.json` file to open the console and override the url. For a list of regions check `oci-plugin-cli open --help`.

> In order to enable override using an OCI Console production region, you *MUST* add the plugin name to the OCI Console whitelist for your testing tenant.
> Clone [this ticket](https://jira-sd.mc1.oracleiaas.com/browse/CHANGE-47817) to make the change.

## Integrate plugin from CDN to the OCI Console in production

If you have published the plugin assets to CDN and would like to test it out before going to production, you may use the CLI to help you generate the testing url with config override. See `oci-plugin-cli override --help` for details.

## Testing

Tests are written in `jest` and `react-testing-library`.

#### Unit Tests

Unit tests exist under `test/`. To run tests:

Just tests:
```bash
yarn test
```

Watch tests:
```bash
yarn test-watch
```

Tests with coverage:
```bash
yarn test-coverage
```

### Integration Test

Integration tests exist under `uitest/`.

After you spin up the plugin, you can kick off the integration (UI) test by first configuring the test context:
 ```bash
 oci-plugin-cli settestcontext --region [SEA] --username [login_user_name] --tenancy [login_user_tenancy] --password [login_user_password]
 ```

Then run tests:
```bash
yarn uitest
```

You can also selectively run integration tests by using the environment variable "SPECS". The value provided should be the test's file name, no extension required:

```bash
SPECS=FruitTartListingPage yarn uitest
```

`oci-plugin-cli settestcontext` command will generate text context which is neccessary to execute the Integration test into config.uitest.json file. Note that Password will be persisted in DONOTCHECKIN.env file in clear text. It is for local development environment only. Please DON'T check it in. In teamcity, you could pass in password by executing "PASSWORD=YOUR_PASSWORD yarn uitest". The integration tests excise the integration scenarios between console and plugin. Please see /uitest/IntegrationSpec.ts for the detailed scenarios.

By default, browser console logs as well as the logs outputed by the test cases are saved to uitest/logs folder. Screenshots are taken and saved to uitest/Screenshots folders. If you have specific logic pertaining to your test suite (i.e. setting the test timeout), you could always add the logic at beforeAll() or beforeEach() functions within the test suite. The integration (UI) test is using Jest as the underly test harness.

The integration (UI) test is using page object design pattern. You could easily create your plugin specific page by extending basePluginPage which will take care of navigation as well authentication for you. Then you will need to Chrome developer tool to find the locator of the elements that you would like to interact with. Once you have the locator defined, you could use the Actions library from ui-testing-core to performan actions on the element. The Actions will handle all the wait logic internally.

## Analyze build

To see the distribution of packages in your bundle pass `--env.analyze` to either `yarn start` or `yarn build`. This will run the [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) to give you details about your build.

## Demo Code

This plugin comes complete with a list and detail view example that use a mock api endpoint. This data relates to a mock plugin called House of Tart that specializes in fruit and egg tarts.

The API data is fetched from a local proxy added to the `webpack-dev-server` called `/api/*` visible in `webpack.config.json` under `devServer` -> `proxy` -> `bypass()`. The data provided by the proxy is served by `.json` files available in `/src/assets/api`. Those files are copied into the build service in development mode by `CopyWebpackPlugin` near the bottom of the `webpack.config.json` configuration.

When removing demo code it's safe to remove the lines in `bypass()` related to the api, removing the `CopyWebpackPlugin` lines and then simply removing the `/src/assets/api` directory. No code should depend on this configuration.

## OUI packages

The demo code in the plugin uses packages from [OUI](https://confluence.oci.oraclecorp.com/x/KFlrAg) to achieve a consistent look/feel and behavior,
as well as to make development easier. Presentation only or "dumb" components come from [oui-core](https://confluence.oci.oraclecorp.com/x/zsaFAg),
and complex or "smart" components come from [oui-savant](https://confluence.oci.oraclecorp.com/x/f1xwAg). Documentation and examples can be found in
those confluence links.

**Note**: OUI packages have a peer dependency on [react](https://reactjs.org/). OCI plugin compliance requires react@16.2.0 or later.

## Known errors

Because of the way the OCI Console loads your plugin, in development you will see this error in your browser's console. This is expected and can be ignored.

```
vendors.js:63817 Warning: You are attempting to use a basename on a page whose URL path does not begin with the basename. Expected path "/" to begin with "/<plugin-path>".
warning @ vendors.js:63817
```
