import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Templates', href: '/templates', icon: '📄' },
  { name: 'Generador', href: '/generator', icon: '⚡' },
  { name: 'Configuraciones', href: '/configs', icon: '⚙️' },
  { name: 'Ejecuciones', href: '/executions', icon: '🚀' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-primary">BAD</h1>
        <span className="ml-2 text-sm text-muted-foreground">API Tester</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
