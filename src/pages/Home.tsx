import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Palette, Download, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Palette,
      title: "Infinite Colors",
      description: "Choose from vibrant neon threads or create custom colors",
    },
    {
      icon: Sparkles,
      title: "Pattern Magic",
      description: "Auto-generate spirals, stars, mandalas, and geometric art",
    },
    {
      icon: Download,
      title: "Export to PDF",
      description: "Print A4-sized guides with pin positions for physical creation",
    },
    {
      icon: Image,
      title: "Gallery Library",
      description: "Browse and load preset patterns for instant inspiration",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-cosmic">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-6">
            <div className="relative">
              <Sparkles className="h-20 w-20 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-neon bg-clip-text text-transparent">
            ThreadArt Studio
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Design stunning string art patterns with mathematical precision and artistic freedom. 
            Create, visualize, and export your masterpiece.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => navigate("/studio")}
              size="lg"
              className="shadow-glow-magenta"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Creating
            </Button>
            <Button
              onClick={() => navigate("/gallery")}
              size="lg"
              variant="outline"
            >
              <Image className="mr-2 h-5 w-5" />
              Browse Gallery
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-glass backdrop-blur-lg border-border hover:scale-105 transition-transform duration-300 animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-20 max-w-5xl mx-auto animate-fade-in">
          <Card className="p-8 bg-gradient-glass backdrop-blur-lg border-border overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-card via-muted to-card rounded-lg flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-30">
                {Array.from({ length: 32 }).map((_, i) => {
                  const angle = (i / 32) * Math.PI * 2;
                  const x = 50 + 40 * Math.cos(angle);
                  const y = 50 + 40 * Math.sin(angle);
                  return (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-primary rounded-full"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    />
                  );
                })}
                {Array.from({ length: 16 }).map((_, i) => {
                  const from = i;
                  const to = (i + 8) % 32;
                  return (
                    <svg
                      key={i}
                      className="absolute inset-0 w-full h-full"
                      style={{ mixBlendMode: "screen" }}
                    >
                      <line
                        x1={`${50 + 40 * Math.cos((from / 32) * Math.PI * 2)}%`}
                        y1={`${50 + 40 * Math.sin((from / 32) * Math.PI * 2)}%`}
                        x2={`${50 + 40 * Math.cos((to / 32) * Math.PI * 2)}%`}
                        y2={`${50 + 40 * Math.sin((to / 32) * Math.PI * 2)}%`}
                        stroke="hsl(310, 100%, 65%)"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    </svg>
                  );
                })}
              </div>
              <div className="relative z-10 text-center">
                <Sparkles className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse-glow" />
                <p className="text-2xl font-bold">Your Art Canvas Awaits</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
