import { Server } from 'socket.io'

const SocketHandler =  (req, res) => {

    if (res.socket.server.io) {
    // console.log('Socket is already running')
    } else {
    // console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
  
    io.on('connection', (socket) => {

      socket.on('join', async (room, user) => {
        socket.join(room)
        socket.user = user;
        socket.room = room;

        const clients = io.sockets.adapter.rooms.get(room)
        console.log();
        if (clients.size > 1) {
          const [client] = clients
          socket.to(client).emit('new-user', user)
        }
      });

      socket.on('disconnect', ()=>{
        socket.leave(socket.room)
        io.to(socket.room).emit('left-user', socket.user)

      });


  


      socket.on('check-room', (id, action) => {
        if (io.sockets.adapter.rooms.has(id)) {
          socket.emit('checked-room', true, id, action)
        } else {
          socket.emit('checked-room', false, id, action)
        }
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

      socket.on('info', (room, data, user) => {
        io.in(room).emit('info', data, user)
      });

    });
    
  }

  res.end()
}

export default SocketHandler