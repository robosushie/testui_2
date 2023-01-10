import React from "react";

import "../styles/right_section.css";

const SQL_EditorNavBar = ({ onRun, ...props }) => {
  return (
    <div className="sen_main_container">
      <span>WorkSheet</span>
      <span className="pad_type"> scratchpad</span>
      <button className="run_button" onClick={onRun}>
        Run
      </button>
    </div>
  );
};

export default SQL_EditorNavBar;
