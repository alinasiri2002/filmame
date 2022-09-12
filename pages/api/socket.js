import { Server } from 'socket.io'

const SocketHandler =  (req, res) => {

    if (res.socket.server.io) {
    // console.log('Socket is already running')
    } else {
    // console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io
  
    io.on('connection', (socket) => {

      socket.on('join-room', async (room, user) => {
        socket.join(room)
        socket.user = user;
        socket.room = room;

        const theRoom = io.sockets.adapter.rooms.get(room)
        if (theRoom.size == 1) {
          theRoom.members = []
        }
        else if (theRoom.size > 1) {
          const [firstClient] = theRoom
          socket.to(firstClient).emit('info-for-new-user', user)

        }
        theRoom.members.push(user)
        io.to(room).emit('join-user', theRoom.members, user)

      });

      socket.on('disconnecting', ()=>{
        const theRoom = io.sockets.adapter.rooms.get(socket.room)
        if (theRoom) {
          theRoom.members = theRoom?.members.filter(obj => obj.socketId != socket.id)
          io.to(socket.room).emit('left-user',theRoom.members,  socket.user)
        }
        socket.leave(socket.room)

      });



      socket.on('check-room', (id, action) => {
        if (io.sockets.adapter.rooms.has(id)) {
          socket.emit('checked-room', true, id, action)
        } else {
          socket.emit('checked-room', false, id, action)
        }
      });
    

      socket.on('sync', (room, user, command, position, ) => {

        if (command == 'play' || command == 'pause') {
          io.to(room).emit('sync', user, command, position)
        } 
        
        else if (command == 'seek') {
          io.to(room).emit('sync', user, command, position)
        } 
        
        else {
          io.to(room).emit('sync', 'stop')
        } 
      });


      socket.on('info-to-all', (reciver, data, action, user ) => {
        io.to(reciver).emit('info', data, null, action, user)
      });


      socket.on('info-to-new-user', (reciver, data ) => {
        const theRoom = io.sockets.adapter.rooms.get(socket.room)
        socket.to(reciver.socketId).emit('info', data, theRoom.members)

      });


      socket.on('react', (room, user, icon ) => {
        io.to(room).emit('react', user, icon)
      });

      socket.on('chat', (room, user, msg ) => {
        io.to(room).emit('chat', user, msg)
      });

    });
    
  }

  res.end()
}

export default SocketHandler