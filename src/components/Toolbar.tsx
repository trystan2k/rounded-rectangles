interface ToolbarProps {
  onAdd: () => void;
}

export const Toolbar = ({ onAdd }: ToolbarProps) => {
  return (
    <div className="toolbar">
      <button type="button" onClick={onAdd}>
        + Add rectangle
      </button>
    </div>
  );
};
