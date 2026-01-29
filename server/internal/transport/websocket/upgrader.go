package websocket

import (
	"net/http"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocket(hub *Hub, getUserIDFromRequest func(*http.Request) (uuid.UUID, bool)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := getUserIDFromRequest(r)
		if !ok {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		conn, err := Upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		client := &Client{UserID: userID, conn: conn, send: make(chan []byte, 256), hub: hub}
		hub.register <- client
		go client.WritePump()
		go client.ReadPump()
	}
}
