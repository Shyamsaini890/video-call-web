import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      if (data.error) {
        return alert(data.error);
      }
      const { connectedParticipants, room } = data;
      navigate(`/room/${room}`, {
        state: { connectedParticipants, room, email },
      });
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className=" py-20">
      <div className=" overflow-hidden text-center md:text-5xl text-3xl  font-bold bg-[url('https://img.freepik.com/premium-photo/abstract-light-color-crealive-background-ui-ux-design_155807-3675.jpg')] bg-clip-text text-transparent ">WELCOME ! </div>
      <form className=" mx-10  my-10 rounded-2xl py-10 md:px-10 px-4 gap-2 md:w-[500px] border border-black md:mx-auto flex flex-col" onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className=" border px-2 py-1 rounded-2xl outline-none "
        />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className=" border px-2  outline-none py-1 rounded-2xl "
        />
        <button type="submit" className=" text-xl border  mx-auto px-10 py-1 rounded-2xl bg-[url('https://img.freepik.com/premium-photo/abstract-light-color-crealive-background-ui-ux-design_155807-3675.jpg')] bg-cover font-bold">Join</button>
      </form>
    </div>
  );
};

export default Lobby;
