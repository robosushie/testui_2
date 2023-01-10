import React, { useEffect, useState } from "react";
import "../styles/left_section.css";

/*

ls => left_section in css

*/

const LeftSection = () => {
  useEffect(() => {}, []);
  return (
    <div className="ls_main_container">
      <form action="">
        <select className="ls_schema_drop_down">
          <option>PROJECT$</option>
          <option>PROJECT$ 1</option>
        </select>
      </form>
      <div className="ls_create_table_section">
        <div className="ls_box_top">
          <button className="ls_create_table">Create Table</button>
        </div>
        <div className="ls_box_middle">Tables</div>
        <div className="ls_box_bottom"> Create a Table to get started</div>
      </div>
    </div>
  );
};

export default LeftSection;
