import * as React from "react";
import { Icon, Button } from "oui-react";
import { ProgressLineItem } from "oui-savant";

interface Props {
  testId?: string;
  title?: string;
  status?: React.ReactChild;
  children?: React.ReactChild[];
}

export const ProgressGroup: React.FC<Props> = (props) => {
  const { testId, title = "", status = null, children = [] } = props;

  // Track arrow accordion
  const [groupExpanded, setGroupExpanded] = React.useState(false);

  const toggleGroupExpanded = () => setGroupExpanded(!groupExpanded);

  return (
    <div className="oui-savant__progress-group-container" data-test-id={testId}>
      <Button
        label="group-container-button"
        buttonIcon={groupExpanded && children.length > 0 ? Icon.TriangleDown : Icon.TriangleRight}
        onClick={toggleGroupExpanded}
      />
      <div className="oui-savant__progress-group">
        <span onClick={toggleGroupExpanded}>
          <ProgressLineItem displayName={title} status={status} />
        </span>

        {/* Hide instead of unmount since children register to context on mount */}
        <div
          style={{ ...(!groupExpanded && { visibility: "hidden", height: 0, overflow: "hidden" }) }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
