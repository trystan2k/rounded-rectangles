interface ToolbarProps {
  onAdd: () => void;
}

// Toolbar to hold the 'Add rectangle' button in the header
export const Toolbar = ({ onAdd }: ToolbarProps) => {
  return (
    <div className="toolbar">
      <button type="button" onClick={onAdd}>
        + Add rectangle
      </button>
    </div>
  );
};
