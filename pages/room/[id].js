import React, {useState, useEffect, useRef} from 'react'
import {getSession, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0';


import io from 'socket.io-client'
let socket

function Room({user}) {

  // const { user, isLoading } = useUser();
  const router = useRouter()
  const { id : room } = router.query

  const [syncing, setSyncing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)


  const player = useRef();
  const source = useRef();
  const track = useRef();


  const [movieUrl, setMovieUrl] = useState()
  const [subUrl, setSubUrl] = useState()
  const [sub, setSub] = useState()


  const [users, setUsers] = useState([user])
  

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

  useEffect(() => { window.users = users },[users])

  useEffect( () => {
   
    socketInitializer()
    return () => {
      socket.disconnect()
    };
  },[])


  const socketInitializer = async () => {
      await fetch('/api/socket')
      socket = io()

      socket.on('connect', () => {
          socket.emit('join', room, user);

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

      socket.on('info', (data, users) => {
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
            
        users && setUsers(users);

      });

      socket.on('new-user', (user) => {
          window.users = [...window.users ,user]
          sendInfo(room, window.users, source.current?.src, track.current?.id, player.current?.currentTime, !player.current.paused)
      });

      socket.on('left-user', (user) => {
        const newUsers = users.filter(obj => obj != user)
        setUsers(newUsers)
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


  const sendInfo = (room, user, movie, sub, time, isPlaying) => {
      const data = {
          movieUrl : movie,
          subUrl : sub,
          position : time,
          playing : isPlaying,
      }
      socket.emit('info', room, data, user)
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

    <div className="users">
      <h1>Room Members ({users?.length})</h1>
      <div className="user-list">
        {users?.map((user) => (
          <div className="user-cart">
            <img src={user?.picture}/>
            <div className="user-detail">
              <p className="name">{user?.name}</p>
              <p className="email">{user?.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

  </main>
)
}


export default Room
// export default withPageAuthRequired(Room, {
//   onRedirecting: () => <div>Loading...</div>,
//   // returnTo: '/',
// });

export const getServerSideProps = withPageAuthRequired({
  getServerSideProps: async ({ req, res }) => {
    const auth0User = getSession(req, res);

    let user = auth0User.user 

    return {
      props: {
        user: user,
      },
    };
  },
});