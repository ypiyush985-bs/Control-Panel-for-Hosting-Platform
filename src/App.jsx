import { ThemeProvider }       from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModalProvider }        from './contexts/ModalContext';
import { NavigationProvider }   from './contexts/NavigationContext';
import { DomainProvider }       from './contexts/DomainContext';
import { DatabaseProvider }     from './contexts/DatabaseContext';
import { EmailProvider }        from './contexts/EmailContext';
import { SSLProvider }          from './contexts/SSLContext';
import { ServerProvider }       from './contexts/ServerContext';
import AppShell from './components/shell/AppShell';

/**
 * App — root component that composes all context providers.
 * Provider order: ThemeProvider > NotificationProvider > ModalProvider >
 *   NavigationProvider > data providers > AppShell
 * Requirements: 1.1, 1.6–1.8, 12.1–12.4
 */
export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ModalProvider>
          <NavigationProvider>
            <DomainProvider>
              <DatabaseProvider>
                <EmailProvider>
                  <SSLProvider>
                    <ServerProvider>
                      <AppShell />
                    </ServerProvider>
                  </SSLProvider>
                </EmailProvider>
              </DatabaseProvider>
            </DomainProvider>
          </NavigationProvider>
        </ModalProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
