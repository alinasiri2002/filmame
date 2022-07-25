import React, {useState, useEffect, useRef} from 'react'
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {clientPromise} from "../../db/mongodb";
import { ObjectId } from "bson"

import io from 'Socket.IO-client'
let socket

function Room({room}) {

  const [control, setControl] = useState(true)
  const [time, setTime] = useState()
  const [movieUrl, setMovieUrl] = useState("")
  const [subUrl, setSubUrl] = useState()
  const [sub, setSub] = useState()

  const player = useRef();


  useEffect(() => {

    socketInitializer()
  },[])

  const loadSub = (url)=>{
    const convert = content => new Promise(converted => {
      content = content.replace(/(\d+:\d+:\d+)+,(\d+)/g, "$1.$2");
      content = "WEBVTT \n\n" + content;
      converted(URL.createObjectURL(new Blob([content], {type: "text/vtt;charset=utf-8"})));
    });

    const client = new XMLHttpRequest()
    client.open("GET", url);
    client.onreadystatechange = () => {
        convert(client.responseText).then(url => setSubUrl(url))
    }
    client.send()
  }

  const socketInitializer = async () => {
    await fetch('/api/socket')
    socket = io()

    socket.on('connect', () => {
      socket.emit('join-room', room._id)
    })

    socket.on('movieUrl', url => {
      setMovieUrl(url)
    })

    socket.on('subtitle', url => {
      setSub(url)
      loadSub(url)
      
    })

    socket.on('playing', (status, time, smovieUrl, ssub) => {
      if(status===true){
        player.current.play()
      }else{
        player.current.pause()
        movieUrl !== smovieUrl && setMovieUrl(smovieUrl)

        if(ssub){
          setSub(ssub)
          loadSub(ssub)
        }

        player.current.currentTime = time
      }
    })

    socket.on('seek', time => {
      player.current.pause()
      player.current.currentTime = time
    })

  }


  const handleMovieUrl = (e)=> {
    e.preventDefault()
    const url = e.target.elements.mUrl.value
    socket.emit('movieUrl', room._id, url)
    e.target.reset()
  }


  const handleSubUrl = async (e)=>{
    e.preventDefault()
    const isSub = name => name.split(".").pop().toLowerCase() === "srt" || name.split(".").pop().toLowerCase() === "vtt";  

    // const file = e.target.files[0]
    // if(isSub(file.name)){

    //   const body = new FormData();
    //   body.append("file", file);

    //   const response = await fetch("/api/upload", {
    //     method: "POST",
    //     body
    //   }).then(res => {
    //     const url = `/subs/${file.name}`
    //     socket.emit('subtitle', room._id, url)
    //   })
      
    // }
    const url = e.target.elements.sUrl.value
    if(true){
      socket.emit('subtitle', room._id, url)
      e.target.reset()
    }

  }



  

  const onPlay = ()=>{
    socket.emit('playing', room._id, true)

  }

  const onPause = ()=>{
    const time  = player.current.currentTime
    socket.emit('playing', room._id, false, time, movieUrl, sub)
  }



  return (
    <main className="room">
      <p className='alert'>relax, its under development</p>

      <div className="player-wrapper">
        <video ref={player} key={movieUrl} id='video'  width="100%" height="auto" controls={control} poster="/videoPoster.jpg" muted onPlay={onPlay} onPause={onPause} >
          <source key={movieUrl} src={movieUrl} type="video/mp4" />
          {subUrl && <track key={subUrl} kind="subtitles" src={subUrl}  srcLang=":)" label="sub"  default />}
        </video>

      <div className="form">
          <form className="movie-form" onSubmit={handleMovieUrl}>
              <input id='mUrl' type="text" placeholder='video url' />
              <input type="submit" value="open"/>
          </form>

          <form className="movie-form" onSubmit={handleSubUrl}>
                {/* <input id='sub' type="file" text="upload" onChange={handleSubUrl} multiple={false} name="theFiles" /> */}
                <input id='sUrl' type="text" placeholder='subtitle url' />
                <input type="submit" value="open"/>
          </form>
      </div>
      </div>





    </main>
  )
}










export default withPageAuthRequired(Room, {
  onRedirecting: () => <div>Loading...</div>,
  // returnTo: '/',
});

export const getServerSideProps = withPageAuthRequired({
  // returnTo: '/foo',
  async getServerSideProps(context) {
    const roomId = context.params.id


    try {
      const oId = ObjectId(roomId)
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
  
      var room = await db.collection("room").findOne({_id : oId});
      room = JSON.parse(JSON.stringify(room));

    } catch (error) {
      room = null
    }

    if (!room) {
      return {
        notFound: true,
      }
    }

    return {
      props: { room },
    };
  }
});
