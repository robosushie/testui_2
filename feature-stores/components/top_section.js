import React, { useEffect, useState } from "react";
import "../styles/top_section.css";

/*

ts => top_section in css

*/

const ShowPath = ({ path, ...props }) => {
  const pathArray = path.split("/");
  return (
    <div className="ts_path_links_container">
      {pathArray.map((item, key) =>
        key == pathArray.length - 1 ? (
          <React.Fragment>
            <span className="ts_path_links ts_path_links_inactive">{item}</span>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <span className="ts_path_links ts_path_links_active">{item}</span>
            <span className="ts_path_sign">&gt;</span>
          </React.Fragment>
        )
      )}
    </div>
  );
};

const TopSection = () => {
  const [path, setPath] = useState("");

  useEffect(() => {
    // Use api to get the location
    setPath("Projects/Worksheets/scratchpad");
  }, []);
  return (
    <div className="ts_main_container">
      <ShowPath path={path} />
      <div className="ts_scheme_title">Select a Scheme</div>
    </div>
  );
};

export default TopSection;
