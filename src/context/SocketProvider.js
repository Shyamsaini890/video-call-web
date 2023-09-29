import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";
const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io("wss://shyam00112.glitch.me"), []);

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    // You can handle the error here, e.g., show an error message to the user.
  });

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
