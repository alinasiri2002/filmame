import Head from 'next/head'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef } from 'react';

import generateUniqueId from 'generate-unique-id'

import io from 'socket.io-client'
let socket

export default function Home() {
  const inputRef = useRef()

  const router = useRouter()
  const { user } = useUser();
  const [err, setErr] = useState(null)


  useEffect( () => {
    socketInitializer()
  },[])



  const socketInitializer = async () => {
    await fetch('/api/socket')
    socket = io()

    socket.on('checked-room', (valid, id, action) => {
      if (action == 'create'){
        !valid ? router.push(`/room/${id}`) : setErr("something very strange happened! please try again")
      }
      else {
        valid ? router.push(`/room/${id}`) : setErr("this room does not exists!")
      }
    })

  }

  const handelCreateRoom = async ()=>{
    setErr(null)
    const id = generateUniqueId({length: 6});
    socket.emit('check-room', id, 'create');

  }
  const handelJoinRoom = async ()=>{
    setErr(null)
    const id = inputRef.current.value
    id && socket.emit('check-room', id, 'join')

  }

  



  return (
    <main className="home">

      <div className="info">
        <h1>A Better Way To Watch</h1>
        <p>Virtual movie night with your partner, friends, family, or colleagues?<br/>We've got you covered! Gather as many people as you like!</p>


        <div className="home-btns">
          <button className='create btn' disabled={!user ? true : false} onClick={()=>{handelCreateRoom()}}>Create Room</button>
          or
          <div className="join-sec">
            <input  type="text" ref={inputRef} placeholder='room id' />
            <button className='join btn' disabled={!user ? true : false} onClick={()=>{handelJoinRoom()}}>Join</button>
          </div>
          {err && <p className="error">{err}</p>}

        </div>

      </div>

      <img className='vector' src="/vector.svg"/>

    </main>
  )
}

