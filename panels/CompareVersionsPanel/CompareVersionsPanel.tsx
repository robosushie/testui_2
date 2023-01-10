import * as React from "react";
import { Tabs, Tab, FieldSet, Field, CheckBox, Select, TCellWidth } from "oui-react";
import "./CompareVersionsPanel.less";
import { Panel, PanelSize, useQuery } from "oui-savant";
import CompareVersionGeneralTab from "../../components/CompareVersionGeneralTab/CompareVersionGeneralTab";
import CompareVersionTaxonomyTab from "../../components/CompareVersionTaxonomyTab/CompareVersionTaxonomyTab";
import CompareVersionProvenanceTab from "../../components/CompareVersionProvenanceTab/CompareVersionProvenanceTab";
import * as Messages from "@codegen/Messages";
import apiClients from "../../apiClients";
import { Model, ModelSummary } from "odsc-client/dist/odsc-client";
import RowContainer from "../../components/RowContainer/RowContainer";
import CompareVersionModelDeployment from "../../components/CompareVersionModelDeployment/CompareVersionModelDeployment";
import CompareVersionSchemaTab from "../../components/CompareVersionSchemaTab/CompareVersionSchemaTab";
import CompareVersionCustomAttributes from "../../components/CompareVersionCustomAttributes/CompareVersionCustomAttributes";

interface Props {
  onClose(): void;
  modelsList: ModelSummary[];
  selectedModelIds: string[];
}

interface Options {
  label: string;
  value: string;
}

export const getUserId = (modelData: Model) => {
  return modelData ? [{ userId: modelData.createdBy }] : [];
};

export const getModel = (
  row: any,
  highlightDifferences: boolean,
  modelId: string,
  modelPlaceholderId: string
) => (
  <>
    {row.label !== Messages.modelVersionSets.compareVersions.hyperparameters() ? (
      !highlightDifferences || row.firstModel === row.secondModel ? (
        <p>{row[modelPlaceholderId] ? row[modelPlaceholderId] : row[modelId]}</p>
      ) : (
        <p className={"oui-highlighting-difference"}>
          {row[modelPlaceholderId] ? row[modelPlaceholderId] : row[modelId]}
        </p>
      )
    ) : (
      <p> {row[modelId]} </p>
    )}
  </>
);

export const getRowId = (row: any) => row.label;

export const getLabel = (row: any) => (
  <p className={"oui-table-row-property-heading"}>{row.label}</p>
);

export const getColumns = (
  highlightDifferences: boolean,
  headerForFirstModel?: string,
  headerForSecondModel?: string
) => [
  {
    header: Messages.modelVersionSets.compareVersions.category(),
    id: "label",
    cell: getLabel,
    width: TCellWidth.OneFifth,
  },
  {
    header: headerForFirstModel,
    id: "firstModel",
    cell: (row: any) => getModel(row, highlightDifferences, "firstModel", "firstModelPlaceholder"),
    width: TCellWidth.TwoFifths,
  },
  {
    header: headerForSecondModel,
    id: "secondModel",
    cell: (row: any) =>
      getModel(row, highlightDifferences, "secondModel", "secondModelPlaceholder"),
    width: TCellWidth.TwoFifths,
  },
];

const CompareVersionsPanel: React.FC<Props> = ({ onClose, selectedModelIds, modelsList }) => {
  const [highlightDifferences, setHighlightDifferences] = React.useState(true);
  const [firstModelId, setFirst] = React.useState(
    !!selectedModelIds && selectedModelIds.length === 2 ? selectedModelIds[0] : modelsList[0].id
  );
  const [secondModelId, setSecond] = React.useState(
    !!selectedModelIds && selectedModelIds.length === 2 ? selectedModelIds[1] : modelsList[1].id
  );
  const [firstModelData, setFirstModelData] = React.useState(null);
  const [secondModelData, setSecondModelData] = React.useState(null);

  const firstModels = useQuery({
    method: apiClients.odscApi.getModel,
    options: { args: { modelId: firstModelId } },
  });

  const secondModels = useQuery({
    method: apiClients.odscApi.getModel,
    options: { args: { modelId: secondModelId } },
  });
  React.useEffect(() => {
    if (firstModels.response && firstModels.response.data) {
      setFirstModelData(firstModels.response.data);
    }
    if (secondModels.response && secondModels.response.data) {
      setSecondModelData(secondModels.response.data);
    }
  }, [firstModels.response, secondModels.response]);

  const onHighlightClick = () => {
    setHighlightDifferences(!highlightDifferences);
  };

  const getModelOptions = (modelId: string): Options[] => {
    return modelsList.map((model) => {
      if (modelId === model.id) {
        return {
          label: Messages.modelVersionSets.compareVersions.dropDownVersion(
            model.displayName,
            model.versionId.toString()
          ),
          value: model.id,
          disabled: true,
        };
      }
      return {
        label: Messages.modelVersionSets.compareVersions.dropDownVersion(
          model.displayName,
          model.versionId.toString()
        ),
        value: model.id,
      };
    });
  };

  return (
    <Panel
      title={Messages.modelVersionSets.actions.modelMemberships.compareVersion()}
      size={PanelSize.Large}
      onClose={onClose}
    >
      <RowContainer>
        <span className={"oui-compare-panel-margin oui-selectText"}>
          <Select
            options={getModelOptions(secondModelId)}
            value={firstModelId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFirst(e.target.value)}
            testId={"dropdown-selectedModelId-2"}
          />
        </span>
        <span className={"oui-compare-panel-text oui-compare-panel-text-margin"}>
          {Messages.modelVersionSets.compareVersions.compareTo()}
        </span>
        <span className={"oui-selectText"}>
          <Select
            options={getModelOptions(firstModelId)}
            value={secondModelId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSecond(e.target.value)}
            testId={"dropdown-selectedModelId-1"}
          />
        </span>
      </RowContainer>
      <FieldSet legend={Messages.modelVersionSets.compareVersions.compareCategories()}>
        <div className={"oui-highlight-differences-text"}>
          <Field
            fieldName={"difference"}
            label={Messages.modelVersionSets.compareVersions.highlightDifferences()}
          >
            <CheckBox
              defaultChecked={true}
              testId={"highlight-difference"}
              onChange={onHighlightClick}
            />
          </Field>
        </div>
        <div className={"oui-table-cell oui-table-cell-provenance"}>
          <Tabs>
            <Tab label={Messages.modelVersionSets.compareVersions.general()}>
              <CompareVersionGeneralTab
                highlightDifferences={highlightDifferences}
                firstModelData={firstModelData}
                secondModelData={secondModelData}
              />
            </Tab>
            <Tab label={Messages.modelVersionSets.compareVersions.provenance()}>
              <CompareVersionProvenanceTab
                highlightDifferences={highlightDifferences}
                firstModelId={firstModelId}
                secondModelId={secondModelId}
                firstModelName={firstModelData && firstModelData.displayName}
                secondModelName={secondModelData && secondModelData.displayName}
              />
            </Tab>
            <Tab label={Messages.modelVersionSets.compareVersions.taxonomy()}>
              <CompareVersionTaxonomyTab
                highlightDifferences={highlightDifferences}
                firstModelData={firstModelData}
                secondModelData={secondModelData}
              />
            </Tab>
            <Tab
              label={Messages.modelVersionSets.compareVersions.tabs.associateMDTab.associateMDTab()}
            >
              <CompareVersionModelDeployment
                highlightDifferences={highlightDifferences}
                firstModelId={firstModelId}
                secondModelId={secondModelId}
                firstModelName={firstModelData && firstModelData.displayName}
                secondModelName={secondModelData && secondModelData.displayName}
              />
            </Tab>
            <Tab
              label={Messages.modelVersionSets.compareVersions.tabs.inputAndOutputSchemaTab.inputAndOutputSchemaTabLabel()}
            >
              <CompareVersionSchemaTab
                highlightDifferences={highlightDifferences}
                firstModelData={firstModelData}
                secondModelData={secondModelData}
              />
            </Tab>
            <Tab
              label={Messages.modelVersionSets.compareVersions.tabs.customAttributesTab.customAttributesTabLabel()}
            >
              <CompareVersionCustomAttributes
                highlightDifferences={highlightDifferences}
                firstModelData={firstModelData}
                secondModelData={secondModelData}
              />
            </Tab>
          </Tabs>
        </div>
      </FieldSet>
    </Panel>
  );
};

export default CompareVersionsPanel;
