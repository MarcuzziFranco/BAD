import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileJson,
  Zap,
  Plug,
  Rocket,
  GitBranch,
  FileCode2,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: FileJson },
  { name: 'Generador', href: '/generator', icon: Zap },
  { name: 'Servicios', href: '/servicios', icon: Plug },
  { name: 'Ejecuciones', href: '/executions', icon: Rocket },
  { name: 'Flujos', href: '/flows', icon: GitBranch },
  { name: 'Importaciones API', href: '/openapi', icon: FileCode2 },
];

export function AppSidebar() {
  const location = useLocation();

  const isActiveRoute = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href.replace(/\/$/, ''));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            B
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">BAD</span>
            <span className="text-xs text-muted-foreground">API Tester</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
