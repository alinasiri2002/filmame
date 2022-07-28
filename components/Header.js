import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0';


function Header() {
  const { user, error, isLoading } = useUser();

  
  return (
    <header>
        <Link href="/">
            <a className='logo'><span className='pr'>F</span>il<span className='pr'>M</span>a<span className='pr'>M</span>e</a>
        </Link>

        {!isLoading &&
        user ?
         <div className="profile">
          <img src={user.picture} alt="" />
          <div className="info">
            <p className="name">{user.name}</p>
            {/* <small>{user.email}</small> */}

          </div>
          <a href="/api/auth/logout"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490.3 490.3"><path d="M0 121.05v248.2c0 34.2 27.9 62.1 62.1 62.1h200.6c34.2 0 62.1-27.9 62.1-62.1v-40.2c0-6.8-5.5-12.3-12.3-12.3s-12.3 5.5-12.3 12.3v40.2c0 20.7-16.9 37.6-37.6 37.6H62.1c-20.7 0-37.6-16.9-37.6-37.6v-248.2c0-20.7 16.9-37.6 37.6-37.6h200.6c20.7 0 37.6 16.9 37.6 37.6v40.2c0 6.8 5.5 12.3 12.3 12.3s12.3-5.5 12.3-12.3v-40.2c0-34.2-27.9-62.1-62.1-62.1H62.1c-34.2 0-62.1 27.8-62.1 62.1z"/><path d="M385.4 337.65c2.4 2.4 5.5 3.6 8.7 3.6s6.3-1.2 8.7-3.6l83.9-83.9c4.8-4.8 4.8-12.5 0-17.3l-83.9-83.9c-4.8-4.8-12.5-4.8-17.3 0s-4.8 12.5 0 17.3l63 63H218.6c-6.8 0-12.3 5.5-12.3 12.3 0 6.8 5.5 12.3 12.3 12.3h229.8l-63 63c-4.8 4.7-4.8 12.5 0 17.2z"/></svg></a>


         </div>
        : 
        <a className='btn' href="/api/auth/login"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 481.5 481.5"><path d="M0 240.7c0 7.5 6 13.5 13.5 13.5h326.1l-69.9 69.9c-5.3 5.3-5.3 13.8 0 19.1 2.6 2.6 6.1 4 9.5 4s6.9-1.3 9.5-4l93-93c5.3-5.3 5.3-13.8 0-19.1l-93-93c-5.3-5.3-13.8-5.3-19.1 0-5.3 5.3-5.3 13.8 0 19.1l69.9 69.9h-326C6 227.2 0 233.2 0 240.7z"/><path d="M382.4 0H99C44.4 0 0 44.4 0 99v58.2c0 7.5 6 13.5 13.5 13.5s13.5-6 13.5-13.5V99c0-39.7 32.3-72 72-72h283.5c39.7 0 72 32.3 72 72v283.5c0 39.7-32.3 72-72 72H99c-39.7 0-72-32.3-72-72V325c0-7.5-6-13.5-13.5-13.5S0 317.5 0 325v57.5c0 54.6 44.4 99 99 99h283.5c54.6 0 99-44.4 99-99V99c-.1-54.6-44.5-99-99.1-99z"/></svg>Login</a>
        }

    </header>
  )
}

export default Header