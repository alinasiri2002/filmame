import { Server } from 'Socket.IO'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    // console.log('Socket is already running')
  } else {
    // console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {

      socket.on('join-room', room => {
        socket.join(room)
        // io.in(room).emit('playing', false)
      })

      socket.on('movieUrl', (room, url) => {
        io.in(room).emit('movieUrl', url)

      })
      socket.on('subtitle', (room, url) => {
        io.in(room).emit('subtitle', url)

      })

      socket.on('playing', (room, status, time, smovieUrl, ssubUrl) => {
        io.in(room).emit('playing', status, time, smovieUrl, ssubUrl)
      })


    })
  }
  res.end()
}

export default SocketHandler