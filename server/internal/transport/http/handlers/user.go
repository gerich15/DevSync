package handlers

import (
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/user"
	"github.com/devsync/server/internal/domain/stats"
	"github.com/devsync/server/internal/domain/github"
	"github.com/devsync/server/internal/transport/websocket"
)

type UserHandler struct {
	userSvc  user.Service
	statsSvc stats.Service
	syncSvc  github.SyncService
	wsHub    *websocket.Hub // опционально: рассылка после sync
}

func NewUserHandler(userSvc user.Service, statsSvc stats.Service, syncSvc github.SyncService, wsHub *websocket.Hub) *UserHandler {
	return &UserHandler{userSvc: userSvc, statsSvc: statsSvc, syncSvc: syncSvc, wsHub: wsHub}
}

func (h *UserHandler) Me(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	u, err := h.userSvc.GetByID(c.Request.Context(), userID)
	if err != nil {
		log.Printf("[GET /api/user] GetByID %s: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found", "detail": err.Error()})
		return
	}
	c.JSON(http.StatusOK, u)
}

func (h *UserHandler) Sync(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	if err := h.syncSvc.SyncUser(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if h.wsHub != nil {
		h.wsHub.BroadcastToUser(userID, "stats_updated", nil)
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
