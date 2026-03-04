import { Home, Calendar, Users, Package, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Agora' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/clientes', icon: UserCheck, label: 'Clientes' },
  { href: '/proximos', icon: Calendar, label: 'Próximos' },
  { href: '/assets', icon: Package, label: 'Assets' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = item.href === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn('nav-item', isActive && 'active')}
          >
            <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
            <span className="text-[10px] font-medium">{item.label}</span>
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
