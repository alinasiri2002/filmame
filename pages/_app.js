import { UserProvider } from '@auth0/nextjs-auth0';

import '../styles/globals.scss'
import Header from "../components/Header"

function MyApp({ Component, pageProps }) {
  return (
    <>
    <UserProvider>
      <Header/>
      <Component {...pageProps} />
    </UserProvider>

    </>
  )
}

export default MyApp
