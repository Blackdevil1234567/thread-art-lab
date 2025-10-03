import { Palette } from "lucide-react";

interface ColorPickerProps {
  color?: string;
  onChange?: (color: string) => void;
  selectedColors?: string[];
  onMultiColorChange?: (colors: string[]) => void;
  multiSelect?: boolean;
}

const threadColors = [
  { name: "Cyan", value: "#00F5FF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Yellow", value: "#FFD700" },
  { name: "Purple", value: "#B864FF" },
  { name: "Green", value: "#00FF9F" },
  { name: "Orange", value: "#FF6B35" },
];

export const ColorPicker = ({ 
  color, 
  onChange, 
  selectedColors = [], 
  onMultiColorChange,
  multiSelect = false 
}: ColorPickerProps) => {
  const handleColorClick = (colorValue: string) => {
    if (multiSelect && onMultiColorChange) {
      if (selectedColors.includes(colorValue)) {
        onMultiColorChange(selectedColors.filter(c => c !== colorValue));
      } else {
        onMultiColorChange([...selectedColors, colorValue]);
      }
    } else if (onChange) {
      onChange(colorValue);
    }
  };

  const isSelected = (colorValue: string) => {
    if (multiSelect) {
      return selectedColors.includes(colorValue);
    }
    return color === colorValue;
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <Palette className="h-4 w-4" />
        {multiSelect ? `Thread Colors (${selectedColors.length} selected)` : "Thread Color"}
      </label>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {threadColors.map((c) => (
          <button
            key={c.value}
            onClick={() => handleColorClick(c.value)}
            className={`h-12 rounded-lg border-2 transition-all hover:scale-110 ${
              isSelected(c.value) ? "border-primary shadow-glow-magenta" : "border-transparent"
            }`}
            style={{ backgroundColor: c.value }}
            title={c.name}
          />
        ))}
      </div>
      {!multiSelect && onChange && (
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg cursor-pointer border border-border bg-card"
        />
      )}
    </div>
  );
};
