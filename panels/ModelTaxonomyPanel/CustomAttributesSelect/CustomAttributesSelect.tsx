import {
  Button,
  ErrorText,
  Field,
  FieldSet,
  FormErrors,
  FormValues,
  Icon,
  Select,
  SubForm,
  TextInput,
  uniqueGUID,
} from "oui-react";
import * as Messages from "@codegen/Messages";
import * as React from "react";
import { CustomAttribute } from "../ModelTaxonomyPanel";
import { validateField } from "../../../utils/formUtils";
import { categoryValues } from "../../../constants/modelTaxonomy";

interface Props {
  groupCustomAttributes: CustomAttribute[];
  setGroupCustomAttributes: React.Dispatch<React.SetStateAction<CustomAttribute[]>>;
  fieldErrors: FormErrors;
}
export const CustomAttributesSelect: React.FC<Props> = ({
  groupCustomAttributes,
  setGroupCustomAttributes,
  fieldErrors,
}) => {
  React.useEffect(() => {
    if (groupCustomAttributes && groupCustomAttributes.length === 0) {
      addAnotherCustomAttribute();
    }
  });

  const getCustomAttributeId = (): string => uniqueGUID();

  const addAnotherCustomAttribute = () => {
    const newCustomAttribute: CustomAttribute = {
      id: getCustomAttributeId(),
      key: "",
      description: "",
      category: "",
      value: "",
    };
    setGroupCustomAttributes([...groupCustomAttributes, newCustomAttribute]);
  };

  const customAttributeKeyChange = (value: string, currentCustomAttribute: CustomAttribute) => {
    const newGroupCustomAttributes = groupCustomAttributes.map((customAttribute) => {
      return customAttribute.id === currentCustomAttribute.id
        ? { ...customAttribute, key: value }
        : customAttribute;
    });
    setGroupCustomAttributes(newGroupCustomAttributes);
  };

  const customAttributeValueChange = (value: string, currentCustomAttribute: CustomAttribute) => {
    const newGroupCustomAttributes = groupCustomAttributes.map((customAttribute) => {
      return customAttribute.id === currentCustomAttribute.id
        ? { ...customAttribute, value }
        : customAttribute;
    });
    setGroupCustomAttributes(newGroupCustomAttributes);
  };

  const customAttributeDescriptionChange = (
    value: string,
    currentCustomAttribute: CustomAttribute
  ) => {
    const newGroupCustomAttributes = groupCustomAttributes.map((customAttribute) => {
      return customAttribute.id === currentCustomAttribute.id
        ? { ...customAttribute, description: value }
        : customAttribute;
    });
    setGroupCustomAttributes(newGroupCustomAttributes);
  };

  const customAttributeCategoryChange = (
    value: string,
    currentCustomAttribute: CustomAttribute
  ) => {
    const newGroupCustomAttributes = groupCustomAttributes.map((customAttribute) => {
      return customAttribute.id === currentCustomAttribute.id
        ? { ...customAttribute, category: value }
        : customAttribute;
    });
    setGroupCustomAttributes(newGroupCustomAttributes);
  };

  const removeCustomAttribute = (currentCustomAttribute: CustomAttribute) => {
    const newGroupCustomAttributes = groupCustomAttributes.filter(
      (customAttribute) => customAttribute.id !== currentCustomAttribute.id
    );
    setGroupCustomAttributes(newGroupCustomAttributes);
  };

  const addCustomAttributesRow = (currentCustomAttribute: CustomAttribute) => {
    const id = groupCustomAttributes.indexOf(currentCustomAttribute);
    return (
      <FieldSet
        remove={{
          onRemove: () => removeCustomAttribute(currentCustomAttribute),
          label: "Delete",
          icon: Icon.Close,
        }}
        key={"Custom Attribute" + id}
        legend={Messages.models.selectPanes.modelTaxonomySelect.customAttributes.label()}
      >
        <div className={"field-row"}>
          <Field
            label={Messages.models.selectPanes.modelTaxonomySelect.labels.label()}
            fieldName={"customKey" + id}
          >
            <TextInput
              testId={"label"}
              onChange={(e) => customAttributeKeyChange(e.target.value, currentCustomAttribute)}
              value={currentCustomAttribute.key}
              required={true}
            />
          </Field>
          <Field
            label={Messages.models.selectPanes.modelTaxonomySelect.labels.value()}
            fieldName={"customValue" + id}
          >
            <TextInput
              testId={"val"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                customAttributeValueChange(e.target.value, currentCustomAttribute)
              }
              value={currentCustomAttribute.value}
              required={true}
            />
          </Field>
        </div>
        <Field
          label={Messages.models.selectPanes.modelTaxonomySelect.labels.category()}
          fieldName={"customCategory" + id}
          optional={true}
        >
          <Select
            options={categoryValues}
            value={currentCustomAttribute.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              customAttributeCategoryChange(e.target.value, currentCustomAttribute);
            }}
          />
        </Field>
        <Field
          label={Messages.models.selectPanes.modelTaxonomySelect.labels.description()}
          fieldName={"customDescription" + id}
          optional={true}
        >
          <TextInput
            testId={"desc"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              customAttributeDescriptionChange(e.target.value, currentCustomAttribute)
            }
            value={currentCustomAttribute.description}
          />
        </Field>
      </FieldSet>
    );
  };

  const validate = (values: FormValues): FormErrors => {
    groupCustomAttributes.forEach((customAttribute) => {
      const id = groupCustomAttributes.indexOf(customAttribute);
      if (
        customAttribute.key ||
        customAttribute.value ||
        customAttribute.category ||
        customAttribute.description
      ) {
        const customAttributeLabel = values["customKey" + id];
        fieldErrors["customKey" + id] = validateField({
          value: customAttributeLabel && customAttributeLabel.trim(),
          required: true,
          minLen: 0,
          maxLen: 255,
        });
        const customAttributeValue = values["customValue" + id];
        fieldErrors["customValue" + id] = validateField({
          value: customAttributeValue && customAttributeValue.trim(),
          required: true,
          minLen: 0,
          maxLen: 255,
        });
        const customAttributeDescription = values["customDescription" + id];
        fieldErrors["customDescription" + id] = validateField({
          value: customAttributeDescription && customAttributeDescription.trim(),
          minLen: 0,
          maxLen: 255,
        });
      }
    });
    return fieldErrors;
  };

  return (
    <SubForm fieldName={"customAttributes"} transformData={(data) => data} validator={validate}>
      {groupCustomAttributes &&
        groupCustomAttributes.map((customAttribute) => addCustomAttributesRow(customAttribute))}
      <div className={"additional-attributes"}>
        <Button onClick={addAnotherCustomAttribute} disabled={groupCustomAttributes.length >= 50}>
          {Messages.models.actions.addCustomAttribute()}
        </Button>
      </div>
      {groupCustomAttributes && groupCustomAttributes.length >= 50 && (
        <ErrorText>{Messages.models.errorMessages.customAttributesLimit()}</ErrorText>
      )}
    </SubForm>
  );
};
