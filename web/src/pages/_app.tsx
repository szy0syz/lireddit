import theme from "../theme";
import { ThemeProvider, CSSReset } from "@chakra-ui/core";

//! fix ssr
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider theme={theme}>
      <CSSReset />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
