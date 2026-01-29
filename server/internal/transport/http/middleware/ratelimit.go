package middleware

import (
	"net/http"
	"sync"
	"time"
	"github.com/gin-gonic/gin"
)

// RateLimit — 60 запросов в минуту на IP для API
func RateLimit(perMinute int) gin.HandlerFunc {
	type entry struct {
		count int
		start time.Time
	}
	var mu sync.Mutex
	m := make(map[string]*entry)
	go func() {
		tick := time.NewTicker(time.Minute)
		defer tick.Stop()
		for range tick.C {
			mu.Lock()
			for k, v := range m {
				if time.Since(v.start) > time.Minute {
					delete(m, k)
				}
			}
			mu.Unlock()
		}
	}()
	return func(c *gin.Context) {
		ip := c.ClientIP()
		mu.Lock()
		e, ok := m[ip]
		if !ok {
			e = &entry{count: 0, start: time.Now()}
			m[ip] = e
		}
		if time.Since(e.start) > time.Minute {
			e.count = 0
			e.start = time.Now()
		}
		e.count++
		if e.count > perMinute {
			mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "too many requests"})
			return
		}
		mu.Unlock()
		c.Next()
	}
}
