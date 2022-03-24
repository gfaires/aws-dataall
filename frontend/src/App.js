import { useRoutes } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@material-ui/core';
import GlobalStyles from './components/GlobalStyles';
import SplashScreen from './components/SplashScreen';
import useAuth from './hooks/useAuth';
import useScrollReset from './hooks/useScrollReset';
import useSettings from './hooks/useSettings';
import routes from './routes';
import { createTheme } from './theme';

const App = () => {
  const content = useRoutes(routes);
  const { settings } = useSettings();
  const auth = useAuth();
  useScrollReset();

  const theme = createTheme({
    direction: settings.direction,
    responsiveFontSizes: settings.responsiveFontSizes,
    roundedCorners: settings.roundedCorners,
    theme: settings.theme
  });

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        dense
        maxSnack={3}
        hideIconVariant
      >
        <GlobalStyles />
        {auth.isInitialized ? content : <SplashScreen />}
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
