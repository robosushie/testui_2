import React, { useEffect, useState } from "react";

import SQL_EditorNavBar from "./sql_editor_navbar";

import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

import "../styles/right_section.css";

const code = `-- query customer_contact
SELECT * from TABLE
`;

const hightlightWithLineNumbers = (input, language) =>
  highlight(input, language)
    .split("\n")
    .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
    .join("\n");

const RightSection = () => {
  const [codeValue, setCodeValue] = useState(code);

  const handleRun = () => {
    // Api call with the value stored in codeValue State
    console.log("Run Button Clicked");
    console.log("Sending Value to backend");
    console.log(codeValue);
    console.log("......");
  };

  return (
    <div className="rs_main_container">
      <div className="rs_scratchpad">
        <SQL_EditorNavBar onRun={handleRun} />
        <Editor
          value={codeValue}
          onValueChange={(code) => setCodeValue(code)}
          highlight={(code) => hightlightWithLineNumbers(code, languages.js)}
          padding={16}
          textareaId="codeArea"
          className="editor"
          style={{
            // fontFamily: "monospace",
            fontSize: 16,
            outline: 0,
            border: "none",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default RightSection;
