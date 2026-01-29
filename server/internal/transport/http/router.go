package http

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/transport/http/handlers"
	"github.com/devsync/server/internal/transport/http/middleware"
	"github.com/devsync/server/internal/transport/websocket"
)

type Router struct {
	Auth   *handlers.AuthHandler
	User   *handlers.UserHandler
	Stats  *handlers.StatsHandler
	Reports *handlers.ReportsHandler
	JWT    *JWTMiddleware
	WSHub  *websocket.Hub
	JWTSecret string
}

type JWTMiddleware struct {
	Secret string
}

func (m *JWTMiddleware) Handler() gin.HandlerFunc {
	return middleware.JWT(m.Secret)
}

func NewRouter(auth *handlers.AuthHandler, user *handlers.UserHandler, stats *handlers.StatsHandler, reports *handlers.ReportsHandler, jwtSecret string, wsHub *websocket.Hub) *Router {
	return &Router{
		Auth:       auth,
		User:       user,
		Stats:      stats,
		Reports:    reports,
		JWT:        &JWTMiddleware{Secret: jwtSecret},
		WSHub:      wsHub,
		JWTSecret:  jwtSecret,
	}
}

func (r *Router) Setup(engine *gin.Engine) {
	// Корень — редирект на фронт
	engine.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "http://localhost:3100/")
	})
	engine.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3100", "http://localhost:3000", "http://127.0.0.1:3100", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	if r.WSHub != nil {
		getUserID := func(req *http.Request) (uuid.UUID, bool) {
			tokenStr := req.URL.Query().Get("token")
			if tokenStr == "" {
				auth := req.Header.Get("Authorization")
				if strings.HasPrefix(auth, "Bearer ") {
					tokenStr = strings.TrimPrefix(auth, "Bearer ")
				}
			}
			if tokenStr == "" {
				return uuid.Nil, false
			}
			token, err := jwt.ParseWithClaims(tokenStr, &middleware.Claims{}, func(t *jwt.Token) (interface{}, error) {
				return []byte(r.JWTSecret), nil
			})
			if err != nil || !token.Valid {
				return uuid.Nil, false
			}
			claims := token.Claims.(*middleware.Claims)
			id, err := uuid.Parse(claims.UserID)
			if err != nil {
				return uuid.Nil, false
			}
			return id, true
		}
		engine.GET("/ws/updates", gin.WrapH(websocket.HandleWebSocket(r.WSHub, getUserID)))
		go r.WSHub.Run()
	}

	api := engine.Group("/api")
	authGroup := api.Group("/auth")
	{
		authGroup.GET("/github/check", r.Auth.GitHubCheck)
		authGroup.POST("/confirm", r.Auth.ConfirmToken)
		authGroup.GET("/github", r.Auth.GitHubLogin)
		authGroup.GET("/github/callback", r.Auth.GitHubCallback)
	}

	protected := api.Group("")
	protected.Use(middleware.RateLimit(100))
	protected.Use(r.JWT.Handler())
	{
		protected.GET("/user", r.User.Me)
		protected.POST("/user/sync", r.User.Sync)
		protected.GET("/user/stats", r.Stats.UserStats)
		protected.GET("/user/repos", r.Stats.Repos)
		protected.GET("/user/contributions", r.Stats.Contributions)
		protected.GET("/reports/pdf", r.Reports.PDF)
		protected.GET("/reports/markdown", r.Reports.Markdown)
	}
}
