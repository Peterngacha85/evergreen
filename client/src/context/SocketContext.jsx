import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
      
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to real-time server');
    });

    newSocket.on('newChangeRequest', (request) => {
      toast(`🔔 New Change Request from ${request.requestedBy?.name}`, {
        duration: 6000,
        style: {
          background: '#111827',
          color: '#fff',
          borderRadius: '12px',
        }
      });
    });

    newSocket.on('categoryAdded', (category) => {
      toast.success(`New category added: ${category.name}`, { icon: '📂' });
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
