import Breadcrumb from './Breadcrumb';
import ThemeToggle from './ThemeToggle';
import './Header.css';

/**
 * Header — top bar with breadcrumb and theme toggle.
 * Requirements: 1.4, 9.2, 11.6
 */
export default function Header() {
  return (
    <header className="header">
      <Breadcrumb />
      <ThemeToggle />
    </header>
  );
}
