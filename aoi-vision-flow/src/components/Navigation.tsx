import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Shield, Camera, Upload } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      href: '/',
      label: 'Upload',
      icon: Upload,
      description: 'PCB Image Upload'
    },
    {
      href: '/inspection',
      label: 'Inspection',
      icon: Camera,
      description: 'PCB Quality Analysis'
    },
    {
      href: '/safety',
      label: 'Safety Monitor',
      icon: Shield,
      description: 'Environmental Safety System'
    }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 mr-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AOI Inspector</span>
          </div>

          {/* Navigation Items */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "hover:bg-muted/50",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border border-blue-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span>{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-background border border-border rounded shadow-lg text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;