import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
}

export const ModernHeader = ({ title, subtitle, onBack, actions }: ModernHeaderProps) => {
  return (
    <header className="border-b bg-gradient-to-r from-card/80 via-card/50 to-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Logo */}
             <img 
              src="/full_logo.svg" 
              alt="ALEF-DELTA SACCO" 
              className="h-10 w-auto"
            />
            {onBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                className="hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
