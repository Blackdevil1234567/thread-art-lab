import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PresetPattern {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}

const presets: PresetPattern[] = [
  {
    id: "spiral",
    name: "Golden Spiral",
    description: "Classic fibonacci spiral pattern with golden ratio",
    thumbnail: "bg-gradient-to-br from-thread-yellow to-thread-orange",
  },
  {
    id: "mandala",
    name: "Sacred Mandala",
    description: "Symmetrical mandala with intricate geometric patterns",
    thumbnail: "bg-gradient-to-br from-thread-purple to-thread-magenta",
  },
  {
    id: "star",
    name: "Star Burst",
    description: "Radiant star pattern with sharp geometric lines",
    thumbnail: "bg-gradient-to-br from-thread-cyan to-thread-green",
  },
  {
    id: "flower",
    name: "Bloom Flower",
    description: "Organic flower pattern with curved threads",
    thumbnail: "bg-gradient-to-br from-thread-magenta to-thread-purple",
  },
  {
    id: "geometric",
    name: "Geo Shapes",
    description: "Abstract geometric shapes and polygons",
    thumbnail: "bg-gradient-to-br from-thread-green to-thread-cyan",
  },
  {
    id: "wave",
    name: "Wave Pattern",
    description: "Flowing wave pattern with rhythmic lines",
    thumbnail: "bg-gradient-to-br from-thread-cyan to-thread-magenta",
  },
];

const Gallery = () => {
  const navigate = useNavigate();

  const loadPreset = (preset: PresetPattern) => {
    toast.success(`Loading ${preset.name}...`);
    // In a real app, this would load the preset data
    navigate("/studio");
  };

  return (
    <div className="min-h-screen bg-gradient-cosmic p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-neon bg-clip-text text-transparent">
            Pattern Gallery
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore preset designs or create your own masterpiece
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset, index) => (
            <Card
              key={preset.id}
              className="overflow-hidden bg-gradient-glass backdrop-blur-lg border-border hover:scale-105 transition-transform duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`h-48 ${preset.thumbnail} flex items-center justify-center`}>
                <Sparkles className="h-16 w-16 text-white/80 animate-pulse-glow" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{preset.name}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{preset.description}</p>
                <Button onClick={() => loadPreset(preset)} className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Load Pattern
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button onClick={() => navigate("/studio")} size="lg" className="shadow-glow-magenta">
            <Sparkles className="mr-2 h-5 w-5" />
            Start Fresh Canvas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
