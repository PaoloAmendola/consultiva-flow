import { Home, Calendar, Users, Package, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Agora' },
  { href: '/proximos', icon: Calendar, label: 'Próximos' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/assets', icon: Package, label: 'Assets' },
  { href: '/trilhas', icon: BookOpen, label: 'Trilhas' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn('nav-item', isActive && 'active')}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
