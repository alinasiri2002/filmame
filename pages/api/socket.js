import { Server } from 'socket.io'

const SocketHandler =  (req, res) => {

    if (res.socket.server.io) {
    // console.log('Socket is already running')
    } else {
    // console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
  
    io.on('connection', (socket) => {

      socket.on('join', async (room) => {
          socket.join(room)

          const clients = io.sockets.adapter.rooms.get(room)
          if (clients.size > 1) {
            const [client] = clients
            socket.to(client).emit('new-user')
          }


      });
  
      socket.on('leave', (room) => {
        socket.leave(room)
      });
    
      socket.on('sync', (room, command, position) => {

        if (command == 'play' || command == 'pause') {
          io.to(room).emit('sync', command, position)
        } 
        
        else if (command == 'seek') {
          io.to(room).emit('sync', command, position)
        } 
        
        else {
          io.to(room).emit('sync', 'stop')
        } 
 
      });

      socket.on('info', (room, data) => {
        io.in(room).emit('info', data)
      });

    });
    
  }

  res.end()
}

export default SocketHandler