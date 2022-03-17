import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

let stompClient=null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     
    const [publicChats, setPublicChats] = useState([]); 
    const [tab,setTab] =useState("CHATROOM");
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
      });
    useEffect(() => {
      console.log(userData);
    }, [userData]);

    const connect =()=>{
        let Sock = new SockJS('http://localhost:8080/ws');
        stompClient = over(Sock);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        //topic/publice her mesaj geldiğinde onMessageReceived otomatik olarak çalıştırılır 
        stompClient.subscribe('/topic/public', onMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage);
        userJoin();
    }

    const userJoin=()=>{
        var chatMessage = {
            messageType:"JOIN",
            content: "",
            sender: userData.username,
            receiver:"",
            time:""
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
          
          //console.log(JSON.stringify(chatMessage))
          //log >> {"sender":"asd","status":"JOIN"}
    }

    const onMessageReceived = (payload)=>{
        // payloadData example : {messageType: 'MESSAGE', content: 'sdsd', sender: 'asd', receiver: '', time: ''}
        console.log("burdayiz");
        var payloadData = JSON.parse(payload.body);
        console.log(payloadData);
        switch(payloadData.messageType){
            case "JOIN":
                
                if(!privateChats.get(payloadData.sender)){
                    privateChats.set(payloadData.sender,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                console.log("burda12345")
                setPublicChats([...publicChats]);
                break;
        }
    }
    
    const onPrivateMessage = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        if(privateChats.get(payloadData.sender)){
            privateChats.get(payloadData.sender).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.sender,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
        
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
    }

    const sendValue=()=>{
        console.log(JSON.stringify(userData));
            if (true) {
              var chatMessage = {
                messageType:"MESSAGE",
                content: userData.message,
                sender: userData.username,
                receiver:"",
                time:""
              };
              console.log("message::::"+chatMessage.content);
              stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
              setUserData({...userData,"message": ""});
              
            }
    }

    const sendPrivateValue=()=>{
        if (stompClient) {
          var chatMessage = {
            sender: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE"
          };
          
          if(userData.username !== tab){
            privateChats.get(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
          }
          stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
          setUserData({...userData,"message": ""});
        }
    }

    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    const registerUser=()=>{
        connect();
    }
    return (
    <div className="container">
        {userData.connected?
        
        
        <div className="chat-box">
            
            
            <div className="member-list">
                <ul>
                    <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
                    {[...privateChats.keys()].map((name,index)=>(
                        <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                    ))}
                </ul>
            </div>


            {tab==="CHATROOM" && <div className="chat-content">
                <ul className="chat-messages">
                    {publicChats.map((chat,index)=>(
                            // payloadData example : {messageType: 'MESSAGE', content: 'sdsd', sender: 'asd', receiver: '', time: ''}
                            //  userData example : username: '',receivername: '' connected: false,message: ''
                        <li className={`message ${chat.sender === userData.username && "self"}`} key={index}>
                            {chat.sender !== userData.username && <div className="avatar">{chat.sender}</div>}
                            <div className="message-data">{chat.content}</div>
                            {chat.sender === userData.username && <div className="avatar self">{chat.sender}</div>}
                        </li>
                    ))}
                </ul>

                <div className="send-message">
                    <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                    <button type="button" className="send-button" onClick={sendValue}>send</button>
                </div>
            </div>}


            {tab!=="CHATROOM" && <div className="chat-content">
                <ul className="chat-messages">
                    {[...privateChats.get(tab)].map((chat,index)=>(
                        <li className={`message ${chat.sender === userData.username && "self"}`} key={index}>
                            {chat.sender !== userData.username && <div className="avatar">{chat.sender}</div>}
                            <div className="message-data">{chat.message}</div>
                            {chat.sender === userData.username && <div className="avatar self">{chat.sender}</div>}
                        </li>
                    ))}
                </ul>

                <div className="send-message">
                    <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} /> 
                    <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                </div>
            </div>}


        </div>
        
        
        :
        
        
        <div className="register">
            <input
                id="user-name"
                placeholder="Enter your name"
                name="userName"
                value={userData.username}
                onChange={handleUsername}
                margin="normal"
              />
              <button type="button" onClick={registerUser}>
                    connect
              </button> 
        </div>}



    </div>
    )
}
//public mesajlar /app/message'a gönderilir
//public mesajlar /topic/public'e subscribe olan clientlar tarafından alınır
export default ChatRoom