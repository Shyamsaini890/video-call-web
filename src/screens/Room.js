import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { useLocation, useNavigate } from "react-router-dom";

const RoomPage = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const { connectedParticipants, room } = location.state;
  let id = connectedParticipants[connectedParticipants.length - 1];

  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [participants, setParticipants] = useState(connectedParticipants);
  const [fullScreenStream, setFullScreenStream] = useState(false);

  useEffect(() => {
    participants.length > 1 &&
      setRemoteSocketId(
        participants?.filter((participant) => participant !== id)[0]
      );
  }, []);

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:left", { id, room });
      if (myStream) {
        myStream.getTracks().forEach((track) => {
          track.stop();
        });
        setMyStream(null);
      }
      navigate("/");
    },

    [room, socket, myStream, id]
  );

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setParticipants((prev) => [...prev, id]);
    setRemoteSocketId(id);
  }, []);

  const handlePartcipantLeft = useCallback(({ connectedParticipants }) => {
    remoteSocketId(null);
    setParticipants(connectedParticipants);
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
      console.log(remoteSocketId);
      setMyStream(stream);
    } catch (e) {
      console.log(e);
    }
  }, [room, socket, remoteSocketId]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      console.log(from, offer);

      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices?.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      console.log(ans);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handlePartcipantLeft);
    socket.on("incoming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handlePartcipantLeft);
      socket.off("incoming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handlePartcipantLeft,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div className=" flex flex-col justify-center items-center">
      <h1 className=" text-3xl font-bold">Room Page</h1>
      {participants.length - 1
        ? participants.map((participant, index) => {
            if (participant === id) return <></>;
            return (
              <div key={index}>
                <h1>{participant}</h1>
              </div>
            );
          })
        : "No one in room"}
      {myStream ? <button onClick={sendStreams}>Accept Call</button> : <></>}
      {remoteSocketId || participants.length - 1 ? (
        <button onClick={handleCallUser}>CALL</button>
      ) : (
        <></>
      )}
      {myStream ? (
        <>
          <h1>{!fullScreenStream ? "My Stream" : "Remote Stream"}</h1>
          <ReactPlayer
            playing
            muted
            height="300px"
            width="300px"
            url={fullScreenStream && remoteStream ? myStream : remoteStream}
            onClick={() => {
              setFullScreenStream((prev) => !prev);
            }}
          />
        </>
      ) : (
        <></>
      )}
      {remoteStream ? (
        <>
          <h1>{fullScreenStream ? "My Stream" : "Remote Stream"}</h1>
          <ReactPlayer
            playing
            muted
            height="300px"
            width="300px"
            url={!fullScreenStream ? myStream : remoteStream}
            className=" max-md:w-100vw[h-w00vh]"
            onClick={() => {
              setFullScreenStream((prev) => !prev);
            }}
          />
        </>
      ) : (
        <></>
      )}
      <button onClick={handleSubmitForm}>Logout</button>
    </div>
  );
};

export default RoomPage;
