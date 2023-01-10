## Big Picture

- To start locally: `yarn install && yarn start`
- `yarn start` will run the plugin making requests to a locally ran Data Science Control Plane API at `localhost:24000`
- `yarn start:integration` will run the plugin making requests to the integration environment deployment of the Data Science Control Plane
- `yarn start:preprod` will run the plugin making requests to the preprod environment deployment of the Data Science Control Plane
- After the webpack server successfully starts, use the URL that’s provided for you
- Note: This plugin uses the `data-science` namespace and has been whitelisted for overrides in the following user tenancies for dev purposes: `ociodscdev` and `ociodsccust`
- **Note: The full README that was generated at this plugin's inception can be found at [LOOM.md](LOOM.md). The following information was specifically added by the odsc-console team and is not meant to be exhaustive.** 

## Local Dev

- The API client for our service is generated and published from the [control plane](https://bitbucket.oci.oraclecorp.com/projects/ODSC/repos/odsc-pegasus-control-plane/browse/odsc-pegasus-control-plane-spec)
- We use the [savant-client-generator](https://bitbucket.oci.oraclecorp.com/projects/CONSOLESDK/repos/savant/browse/packages/savant-client-generator) to generate the API client
- An `overrideEndpoint` is provided in `apiClients.ts` in order to point the `odsc-client` at a non-production environment for development. The envar that populates the `overrideEndpoint` (`OVERRIDE_ENDPOINT`) is specified in `dev.config.js`.
- This codebase uses a linter. Run `yarn lint` to run it.
- This codebase uses Prettier for formatting. Run `yarn format` to automatically have Prettier write its formatting edits. Run `yarn format:check` if you just want to see what files is not up to the Prettier standard. CI build will not pass if there are formatting inconsistencies.

## Unit Testing

- For comprehensive testing instructions, see `LOOM.md`

- To start unit tests locally: `yarn test`

- To update snapshot-based unit tests: `yarn test-update`

### Unit Test Coverage

- Unit test coverage has been added to determine the percentage of the codebase executed during testing

- The tool used to capture unit test coverage is [Istanbul](https://istanbul.js.org/) which is built into Jest

- To capture unit test coverage locally run `yarn test -- --coverage`

- For specifics on what each column of the coverage report measures, see [here](https://stackoverflow.com/questions/26618243/how-do-i-read-an-istanbul-coverage-report)

## UI Testing

### Local Setup

1. Install oci-plugin-cli: `npm install -g oci-plugin-cli --registry https://artifactory.oci.oraclecorp.com/api/npm/global-dev-npm --strict-ssl false`
2. Install dependencies: `yarn install`
3. Install chromedriver: `yarn global add chromedriver`

- Make sure to periodically update your chromedriver as new versions of Chrome are released regularly

4. Upgrade overrides: `oci-plugin-cli upgrade --target overrides`
5. UI tests should be run using the dedicated test user **odsc_uitest**

- Ask the OCI DataScience QA team for the **odsc_uitest** user password
- Add the user password to a `uitest/DONOTCHECKIN.env` file in the following format:

```
{
  "password": "password"
}
```

6. Make sure the `pluginName` in `uitest/config.uitest.json` is `"/data-science/"`
7. Make sure the `pluginOverride` in `uitest/config.uitest.json` is pointing to local oci console.
8. Run pegasus backend apis locally.
9. Make sure to point `odsc-console` to local pegasus api.
10. Create Project in local kiev and assign the ocid to an environment variable called `PROJECT_ID`.
11. If pegasus api has authN/Z disabled then make sure you have `LOGGED_IN_USER` constant value as `Anonymous_User` in `uitest/helpers/constants.ts`.
12. If pegasus api has authN/Z enabled then make sure you have `LOGGED_IN_USER` constant value as `getConfig("loginInfo").username` in `uitest/helpers/constants.ts`. 
13. Run the tests with `yarn run uitest`.

### How To Write UI Tests

This [guide](https://confluence.oci.oraclecorp.com/pages/viewpage.action?spaceKey=UX&title=Getting+Started+with+End-to-End+%28E2E%29+Testing) is a good place to start.

## Translation String

- Add translation string `/locales/en.json`
- Any updates made there should automatically trigger a rebuild during development
- Be sure to follow the [string guidelines](https://confluence.oci.oraclecorp.com/pages/viewpage.action?pageId=99016910)

## Keeping Plugin Up-To-Date
- There are several strategies for keeping this plugin up-to-date:
- First, whenever running `yarn start` locally, a check is done to ensure that the local and global versions of `oci-plugin-cli` are up-to-date. Be sure to follow these prompts and update accordingly.
- Second, using the latest version of `oci-plugin-cli`, use the `generate` command to create a new plugin locally. This newly generated plugin will contain all the latest patterns and toolchains and is useful to cross-reference when checking for changes.
- Third, utilize the `oui-savant` [showcase](https://objectstorage.us-phoenix-1.oraclecloud.com/n/uxdev/b/oui-savant-showcase/o/latest/index.html#/) and `oui-react` [changelog](https://bitbucket.oci.oraclecorp.com/projects/DS/repos/oui-react/browse/packages/oui-react/CHANGELOG.md) docs to check for available solutions and updates.

### How to debug unit tests with Visual Studio

1. Switch to `Run and Debug` left navigation item in visual studio. 
2. On the top -> next to run icon -> click on dropdown -> add configuation. 
3. Add this configuration 
```
{
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Debug Jest Tests",
        "type": "node",
        "request": "launch",
        "cwd": "${workspaceFolder}",
        "runtimeArgs": [
          "--inspect-brk",
          "${workspaceRoot}/node_modules/.bin/jest",
          "--runInBand",
          "--config",
          "${workspaceRoot}/unittest/jest.config.unittest.json"
        ],
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen",
        "port": 9229
      }
    ]
  }
  ```
  4. Put a breakpoint in the test and click run. 
  5. (Optional) Change the `jest.config.unittest.json` to just include one test in order to run just one test.