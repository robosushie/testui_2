import { getConfig } from "ui-testing-core";

export const PROJECT_ID_FOR_NOTEBOOK_AND_MODEL = process.env.PROJECT_ID; // set the PROJECT_ID env var for local testing

// Ensure all uitests take effect in the blessed ui-testing compartment
export const COMPARTMENT_NAME = "ociodscdev (root)";
export const COMPARTMENT_OCID =
  "ocid1.tenancy.oc1..aaaaaaaahzy3x4boh7ipxyft2rowu2xeglvanlfewudbnueugsieyuojkldq";

export const LOGGED_IN_USER = getConfig("loginInfo").username;

export const NOTEBOOK_TIMEOUT = 1200000;
