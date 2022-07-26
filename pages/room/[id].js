import React, {useState, useEffect, useRef} from 'react'
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {clientPromise} from "../../db/mongodb";
import { ObjectId } from "bson"

import io from 'socket.io-client'
let socket

function Room({roomdb}) {
  const  {id : room} = roomdb

  const [syncing, setSyncing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)


  const player = useRef();
  const source = useRef();
  const track = useRef();


  const [movieUrl, setMovieUrl] = useState()
  const [subUrl, setSubUrl] = useState()
  const [sub, setSub] = useState()

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



  useEffect( () => {
      socketInitializer()
  },[])


  const socketInitializer = async () => {
      await fetch('/api/socket')
      socket = io()

      socket.on('connect', () => {
          socket.emit('join', room);

      })

      socket.on('disconnect', () => {
          socket.emit('leave', room);
      })

      socket.on('sync', (command, position) => {
          setSyncing(true);

          // setPosition(position)

          if (command == 'play') {
              setPlaying(true)
              setPosition(position)

              player.current.paused &&  player.current.play();
          } 

          else if (command == 'pause') {
              setPlaying(false)
              setPosition(position)

              !player.current.paused && player.current.pause();
              player.current.currentTime = position
          } 

          else if (command == 'stop') {
              !player.current.paused && player.current.pause();
              player.current.currentTime = 0


          } 
          
          else if (command == 'seek') {
              // newPosition = position + (new Date().getTime() - dateTime) / 1000;
              // if (newPosition > player.current.getDuration()) {
              //     player.current.stop();
              // } else if (Math.abs(newPosition - player.current.currentTime) > 1) {
              //     player.current.seek(newPosition);
              // }
              if(player.current.readyState == 4) {
                  setPosition(position)
                  player.current.currentTime = position


              }
          }
          setSyncing(false);
      });

      socket.on('info', data => {
          const {movieUrl : movieInfo, subUrl:subInfo, position:positionInfo, playing:playingInfo} = data
          movieInfo && setMovieUrl(movieInfo)
          if (subInfo) {
              setSub(subInfo)
              loadSub(subInfo)
          }
          if (playingInfo == true) {
              setPlaying(playingInfo)

          }else{
              setPlaying(playingInfo)
          }
          positionInfo && setPosition(positionInfo)
              

          


      });

      socket.on('new-user', () => {
          sendInfo(room, source.current?.src, track.current?.id, player.current?.currentTime, !player.current.paused)
      });

  }




  const onPlay = (e) => {
      !syncing && !playing && !player.current.seeking && socket.emit('sync',room ,'play', player.current.currentTime);
  };

  const onPause = (e) => {
      !syncing && playing && !player.current.seeking && socket.emit('sync', room, 'pause', player.current.currentTime);
  };

  const onSeeking = (e) => {
      !syncing  && (position != player.current.currentTime) && socket.emit('sync', room,'seek', player.current.currentTime);

  };

  const onLoad = (e) => {
      if(player.current && position != player.current.currentTime ) {player.current.currentTime = position}
      playing && player.current.play()
      sub && loadSub(sub)

  }


  



  const sendInfo = (room, movie, sub, time, isPlaying) => {
      const data = {
          movieUrl : movie,
          subUrl : sub,
          position : time,
          playing : isPlaying,
      }
      socket.emit('info', room, data)
  }

const handleMovieUrl = (e)=> {
  e.preventDefault()
  const url = e.target.elements.mUrl.value
  sendInfo(room, url, null, 0, false)
  e.target.reset()
}



const handleSubUrl = (e)=>{
  e.preventDefault()
  const isSub = name => name.split(".").pop().toLowerCase() === "srt" || name.split(".").pop().toLowerCase() === "vtt";  
  const url = e.target.elements.sUrl.value
  if(true){
      sendInfo(room, source.current?.src, url, player.current?.currentTime, !player.current?.pause)
      e.target.reset()
  }

}






return (
  <main className="room">
    <p className='alert'>relax, its under development</p>

    <div className="player-wrapper">
      <video ref={player} key={movieUrl} id='video'  width="100%" height="auto" controls={!syncing} poster="/videoPoster.jpg" muted onPlay={onPlay} onPause={onPause} onSeeking={onSeeking} onLoadedData={onLoad}>
        <source ref={source}  key={movieUrl} src={movieUrl} type="video/mp4" />
        {subUrl && <track ref={track} key={subUrl} kind="subtitles" src={subUrl} id={sub}  srcLang=":)" label="sub"  default />}
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
  
      var roomdb = await db.collection("room").findOne({_id : oId});
      roomdb = JSON.parse(JSON.stringify(roomdb));

    } catch (error) {
      roomdb = null
    }

    if (!roomdb) {
      return {
        notFound: true,
      }
    }

    return {
      props: { roomdb },
    };
  }
});
