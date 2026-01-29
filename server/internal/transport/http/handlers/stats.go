package handlers

import (
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/stats"
)

type StatsHandler struct {
	statsSvc stats.Service
}

func NewStatsHandler(statsSvc stats.Service) *StatsHandler {
	return &StatsHandler{statsSvc: statsSvc}
}

func (h *StatsHandler) UserStats(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	period := c.DefaultQuery("period", "year") // week, month, year
	s, err := h.statsSvc.GetUserStatsWithPeriod(c.Request.Context(), userID, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

func (h *StatsHandler) Repos(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	limit := 50
	repos, err := h.statsSvc.GetRepos(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, repos)
}

func (h *StatsHandler) Contributions(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	to := time.Now().Format("2006-01-02")
	from := time.Now().AddDate(0, 0, -365).Format("2006-01-02")
	if f := c.Query("from"); f != "" {
		from = f
	}
	if t := c.Query("to"); t != "" {
		to = t
	}
	contribs, err := h.statsSvc.GetContributions(c.Request.Context(), userID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contribs)
}
