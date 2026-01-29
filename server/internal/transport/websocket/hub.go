package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Hub struct {
	clients    map[uuid.UUID]map[*Client]struct{}
	register   chan *Client
	unregister chan *Client
	broadcast  chan *BroadcastMessage
	mu         sync.RWMutex
}

type Client struct {
	UserID uuid.UUID
	conn   *websocket.Conn
	send   chan []byte
	hub    *Hub
}

type BroadcastMessage struct {
	UserID uuid.UUID
	Event  string
	Data   interface{}
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uuid.UUID]map[*Client]struct{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *BroadcastMessage, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.register:
			h.mu.Lock()
			if h.clients[c.UserID] == nil {
				h.clients[c.UserID] = make(map[*Client]struct{})
			}
			h.clients[c.UserID][c] = struct{}{}
			h.mu.Unlock()
		case c := <-h.unregister:
			h.mu.Lock()
			if m, ok := h.clients[c.UserID]; ok {
				delete(m, c)
				if len(m) == 0 {
					delete(h.clients, c.UserID)
				}
			}
			close(c.send)
			h.mu.Unlock()
		case m := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[m.UserID]
			data, _ := json.Marshal(map[string]interface{}{"event": m.Event, "data": m.Data})
			for c := range clients {
				select {
				case c.send <- data:
				default:
					close(c.send)
					delete(clients, c)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastToUser(userID uuid.UUID, event string, data interface{}) {
	h.broadcast <- &BroadcastMessage{UserID: userID, Event: event, Data: data}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) WritePump() {
	defer c.conn.Close()
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Println("ws write:", err)
			break
		}
	}
}
