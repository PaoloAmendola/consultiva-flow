import { Home, Users, UserCheck, BarChart3, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Agora' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/clientes', icon: UserCheck, label: 'Clientes' },
  { href: '/gerencial', icon: BarChart3, label: 'Gerencial' },
  { href: '/playbooks', icon: BookOpen, label: 'Playbooks' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Menu principal">
      {navItems.map((item) => {
        const isActive = item.href === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn('nav-item', isActive && 'active')}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            <div className={cn(
              "w-1 h-1 rounded-full bg-primary transition-all",
              isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )} />
          </Link>
        );
      })}
    </nav>
  );
}
