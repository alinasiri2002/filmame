import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0';



export default function Home() {
  const router = useRouter()
  const { user, error, isLoading } = useUser();

  const handelJoinRoom = async ()=>{

    const roomDoc = {
      name:"UnNamedRoom",
      owner:user.email,
      movieUrl:"",
      subUrl:"",
      playing:false,
      time:"",
    }

    fetch('http://localhost:3000/api/room', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomDoc)
    })
    .then(res => res.json())
    .then(res => {
      router.push(`/room/${res.insertedId}`)
    })
    .catch(err => {
      console.log(err);
    })

  }

  



  return (
    <main className="home">

      <div className="info">
        <h1>A Better Way To Watch</h1>
        <p>Virtual movie night with your partner, friends, family, or colleagues?<br/>We've got you covered! Gather as many people as you like!</p>

        {!isLoading &&
        user ? <button className='btn' onClick={()=>{handelJoinRoom()}}>Create Room</button>
        : <button className='btn' disabled >Login To Continue</button>

        }
      </div>

      <img className='vector' src="/vector.svg"/>

    </main>
  )
}

