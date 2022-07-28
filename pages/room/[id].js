import React, {useState, useEffect, useRef} from 'react'
import {getSession, withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/router'
import toast, { Toaster } from 'react-hot-toast';
import Head from 'next/head'


import io from 'socket.io-client'
let socket

function Room({user}) {

  const router = useRouter()
  const { id : room } = router.query

  const [syncing, setSyncing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)


  const player = useRef();
  const source = useRef();
  const track = useRef();
  const playerWindow = useRef();

  const [movieUrl, setMovieUrl] = useState()
  const [subUrl, setSubUrl] = useState()
  const [sub, setSub] = useState()


  const [users, setUsers] = useState([user])
  

  const [fullscreen, setFullscreen] = useState(false)



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
    return () => {
      socket.disconnect()
    };
  },[])


  const socketInitializer = async () => {
      await fetch('/api/socket')
      socket = io()

      socket.on('connect', () => {
          user.socketId = socket.id
          socket.emit('join-room', room, user);
      })


      socket.on('sync', (user, command, position) => {
          setSyncing(true);

          // setPosition(position)

          if (command == 'play') {
              setPlaying(true)
              setPosition(position)
              toast(`${user.name || user.email} Played The Media`);

              player.current.paused &&  player.current.play();
          } 

          else if (command == 'pause') {
              setPlaying(false)
              setPosition(position)
              toast(`${user.name || user.email} Paused The Media`);

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
              
              toast(`${user.name || user.email} Seeked The Media`)
              if(player.current.readyState == 4) {
                  setPosition(position)
                  player.current.currentTime = position
              }
          }
          setSyncing(false);
      });


      socket.on('info', (data, members, action, user) => {
        const {movieUrl : movieInfo, subUrl:subInfo, position:positionInfo, playing:playingInfo} = data
        setMovieUrl(movieInfo)
        setSub(subInfo)
        loadSub(subInfo)
        
        if (playingInfo == true) {
            setPlaying(playingInfo)

        }else{
            setPlaying(playingInfo)
        }
        setPosition (positionInfo)
        members && setUsers(members);

        if (action == 'media'){
          movieInfo ? toast(`${user?.name || user?.email} Loaded New Media`) : toast(`${user?.name || user?.email} Removed The Media`) 
        }
        else if (action == 'subtitle'){
          movieInfo ? toast(`${user?.name || user?.email} Loaded New Subtitle`) : toast(`${user?.name || user?.email} Removed The Subtitle`) 
        }

      });


      socket.on('info-for-new-user', (user) => {
          sendInfo(user, 'user', source.current?.src, track.current?.id, player.current?.currentTime, !player.current.paused,)
      });


      socket.on('join-user', (members, user) => {
        setUsers(members)
        user.socketId == socket.id ? toast(`You Joined The Room`) : toast(`${user.name || user.email} Joined The Room`);
    });

      socket.on('left-user', (members, user) => {
        setUsers(members)
        toast(`${user.name || user.email} Left The Room`);

    });

    socket.on('react', (user, icon) => {
      toast(() => (
        <div className="react">
          <div className="user">{user.name||user.email} : </div>
          <div className="icon">{icon}</div>
        </div>
      ));
  })

  }


  const onPlay = (e) => {
      !syncing && !playing && !player.current.seeking && socket.emit('sync',room , user, 'play', player.current.currentTime);
  };

  const onPause = (e) => {
      !syncing && playing && !player.current.seeking && socket.emit('sync', room, user, 'pause', player.current.currentTime);
  };

  const onSeeking = (e) => {
      !syncing  && (player.current.readyState == 1 )&& (position != player.current.currentTime)  && socket.emit('sync', room, user ,'seek', player.current.currentTime);

  };

  const onLoad = (e) => {
      if(player.current && position != player.current.currentTime ) {player.current.currentTime = position}
      playing && player.current.play()
      sub && loadSub(sub)

  }


  const sendInfo = (reciver, to, movie, sub, time, isPlaying, action) => {
      const data = {
        movieUrl : movie,
        subUrl : sub,
        position : time,
        playing : isPlaying,
      }
      if(to == 'all'){
        socket.emit('info-to-all', reciver, data , action, user)

      }else{
        socket.emit('info-to-new-user', reciver, data ,null, null)

      }
  }


  const handleMovieUrl = (e)=> {
    e.preventDefault()
    const url = e.target.elements.mUrl.value
    sendInfo(room, 'all', url, null, 0, false, 'media' )
    e.target.reset()
  }

  const handleSubUrl = (e)=>{
    e.preventDefault()
    const isSub = name => name.split(".").pop().toLowerCase() === "srt" || name.split(".").pop().toLowerCase() === "vtt";  
    const url = e.target.elements.sUrl.value
    if(true){
        sendInfo(room, 'all', source.current?.src, url, player.current?.currentTime, !player.current?.pause, 'subtitle')
        e.target.reset()
    }
  }

  const sendReact = (icon)=>{
    socket.emit('react', room, user, icon);

  }



  const fullsc = ()=>{

    if(document.fullscreenElement){
      // removeEventListener('fullscreenchange', document)
      setFullscreen(false)
      document.exitFullscreen()

    }else{
      setFullscreen(true)
      playerWindow.current.requestFullscreen()
      document.addEventListener('fullscreenchange',(e) => {
        !document.fullscreenElement && setFullscreen(false) && document.removeEventListener('fullscreenchange', document)
      })
    } 
  }



  const copyText = (txt) => {
    navigator.clipboard.writeText(txt)
    toast(`Room ID Copied : ${txt}`)

  }



return (
  <main className="room" ref={playerWindow}>
    <Head>
      <title>FilMaMe | Watch Party</title>
    </Head>
    <Toaster 
      containerStyle={{
        zIndex: 2147483647,
      }}
      toastOptions={{
        style: {
          background: '#a6032ea4',
          color: '#f5f5f5',
          fontSize: '.8em',
        },
        
      }}
      
    />

    {/* <p className='alert'>relax, its under development</p> */}
    <p className='share'>share your room : <span className='roomid' onClick={()=>{copyText(room)}}>{`{ ${room} }`}<span className='tooltip'>click to copy</span></span></p>

    <div className="player-wrapper">

      <div  className={`player ${fullscreen && 'fullscreen'}`}>
      <video ref={player} key={movieUrl} id='video'  width="100%" height="auto" controls={!syncing} poster="/videoPoster.jpg" muted onPlay={onPlay} onPause={onPause} onSeeking={onSeeking} onLoadedData={onLoad}>
        <source ref={source}  key={movieUrl} src={movieUrl} type="video/mp4" />
        {subUrl && <track ref={track} key={subUrl} kind="subtitles" src={subUrl} id={sub}  srcLang=":)" label="sub"  default />}
      </video>
      <div className='fullscreen-btn' onClick={()=>{fullsc()}}>{fullscreen?<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 385.331 385.331"><path d="M264.943 156.665h108.273c6.833 0 11.934-5.39 11.934-12.211 0-6.833-5.101-11.85-11.934-11.838h-96.242V36.181c0-6.833-5.197-12.03-12.03-12.03s-12.03 5.197-12.03 12.03v108.273c0 .036.012.06.012.084 0 .036-.012.06-.012.096-.001 6.713 5.316 12.043 12.029 12.031zM120.291 24.247c-6.821 0-11.838 5.113-11.838 11.934v96.242H12.03c-6.833 0-12.03 5.197-12.03 12.03 0 6.833 5.197 12.03 12.03 12.03h108.273c.036 0 .06-.012.084-.012.036 0 .06.012.096.012 6.713 0 12.03-5.317 12.03-12.03V36.181c.001-6.821-5.389-11.922-12.222-11.934zM120.387 228.666H12.115c-6.833.012-11.934 5.39-11.934 12.223 0 6.833 5.101 11.85 11.934 11.838h96.242v96.423c0 6.833 5.197 12.03 12.03 12.03 6.833 0 12.03-5.197 12.03-12.03V240.877c0-.036-.012-.06-.012-.084 0-.036.012-.06.012-.096.001-6.714-5.317-12.031-12.03-12.031zM373.3 228.666H265.028c-.036 0-.06.012-.084.012-.036 0-.06-.012-.096-.012-6.713 0-12.03 5.317-12.03 12.03v108.273c0 6.833 5.39 11.922 12.223 11.934 6.821.012 11.838-5.101 11.838-11.922v-96.242H373.3c6.833 0 12.03-5.197 12.03-12.03s-5.196-12.031-12.03-12.043z"/></svg>:<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-4h2V3h-7v2h5z"/></svg>}</div>
      
      
      
      <div className="emojies">
        <div className="emoji" onClick={()=>sendReact('😂')}>😂</div>
        <div className="emoji" onClick={()=>sendReact('😍')}>😍</div>
        <div className="emoji" onClick={()=>sendReact('😋')}>😋</div>
        <div className="emoji" onClick={()=>sendReact('💦')}>💦</div>
        <div className="emoji" onClick={()=>sendReact('🤭')}>🤭</div>
        <div className="emoji" onClick={()=>sendReact('🎉')}>🎉</div>
        <div className="emoji" onClick={()=>sendReact('🥲')}>🥲</div>
        <div className="emoji" onClick={()=>sendReact('😭')}>😭</div>
        <div className="emoji" onClick={()=>sendReact('😠')}>😠</div>
        <div className="emoji" onClick={()=>sendReact('😐')}>😐</div>
        <div className="emoji" onClick={()=>sendReact('😦')}>😦</div>
        <div className="emoji" onClick={()=>sendReact('💩')}>💩</div>
      </div>
      </div>

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
        {users?.map((user ,index) => (
          <div key={index} className="user-cart">
            <img src={user?.picture}/>
            <div className="user-detail">
              <p className="name">{user?.name}</p>
              <p className="email">{user?.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <footer>Developed With Love</footer>
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