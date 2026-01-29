package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/user"
)

type AuthHandler struct {
	oauth          *oauth2.Config
	jwtSecret      string
	jwtExpireHours int
	userSvc        user.Service
}

func NewAuthHandler(oauth *oauth2.Config, jwtSecret string, jwtExpireHours int, userSvc user.Service) *AuthHandler {
	if jwtExpireHours <= 0 {
		jwtExpireHours = 24
	}
	return &AuthHandler{oauth: oauth, jwtSecret: jwtSecret, jwtExpireHours: jwtExpireHours, userSvc: userSvc}
}

// GitHubCheck — проверка настроек OAuth без редиректа (для фронта: показать ошибку на странице входа).
func (h *AuthHandler) GitHubCheck(c *gin.Context) {
	if h.oauth.ClientID == "" || h.oauth.ClientSecret == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub OAuth not configured",
			"hint":  "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env. Create an OAuth App at https://github.com/settings/developers and set callback URL to http://localhost:8181/api/auth/github/callback",
		})
		return
	}
	if h.oauth.ClientID == "your_github_client_id" || h.oauth.ClientSecret == "your_github_client_secret" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub OAuth: подставлены плейсхолдеры вместо реальных данных",
			"hint":  "В .env (в корне DevSync) замените GITHUB_CLIENT_ID и GITHUB_CLIENT_SECRET на значения из https://github.com/settings/developers → OAuth Apps → ваш сервис. Callback URL в настройках приложения: http://localhost:8181/api/auth/github/callback. После правки перезапустите backend.",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ConfirmToken — проверка JWT и возврат пользователя (для callback: токен в body, без обрезки в URL).
func (h *AuthHandler) ConfirmToken(c *gin.Context) {
	var body struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
		return
	}
	token, err := jwt.ParseWithClaims(body.Token, &middlewareClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}
	claims := token.Claims.(*middlewareClaims)
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user id"})
		return
	}
	u, err := h.userSvc.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, u)
}

func (h *AuthHandler) GitHubLogin(c *gin.Context) {
	if h.oauth.ClientID == "" || h.oauth.ClientSecret == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub OAuth not configured",
			"hint":  "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env. Create an OAuth App at https://github.com/settings/developers and set callback URL to your backend, e.g. http://localhost:8181/api/auth/github/callback",
		})
		return
	}
	// Не отправлять на GitHub с плейсхолдерами из .env.example
	if h.oauth.ClientID == "your_github_client_id" || h.oauth.ClientSecret == "your_github_client_secret" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "GitHub OAuth: подставлены плейсхолдеры вместо реальных данных",
			"hint":  "В .env замените GITHUB_CLIENT_ID и GITHUB_CLIENT_SECRET на значения из https://github.com/settings/developers → OAuth Apps → ваш сервис. Callback URL: http://localhost:8181/api/auth/github/callback",
		})
		return
	}
	state := uuid.New().String()
	url := h.oauth.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.SetAuthURLParam("scope", "read:user user:email repo"))
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *AuthHandler) GitHubCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code"})
		return
	}
	token, err := h.oauth.Exchange(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "exchange failed"})
		return
	}
	// get user from GitHub
	client := h.oauth.Client(c.Request.Context(), token)
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "github api failed"})
		return
	}
	defer resp.Body.Close()
	var ghUser struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := jsonDecode(resp.Body, &ghUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"})
		return
	}
	email := ghUser.Email
	avatar := ghUser.AvatarURL
	u := &user.User{
		ID:          uuid.New(),
		GitHubID:    ghUser.ID,
		Username:    ghUser.Login,
		Email:       &email,
		AvatarURL:   &avatar,
		AccessToken: token.AccessToken,
	}
	if token.RefreshToken != "" {
		u.RefreshToken = &token.RefreshToken
	}
	if err := h.userSvc.CreateOrUpdate(c.Request.Context(), u); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save user failed", "detail": err.Error()})
		return
	}
	claims := &middlewareClaims{
		UserID: u.ID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(h.jwtExpireHours) * time.Hour)),
		},
	}
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := jwtToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "jwt failed"})
		return
	}
	// redirect to frontend with token в hash, чтобы длинный JWT не обрезался в URL
	frontURL := c.GetHeader("Origin")
	if frontURL == "" {
		frontURL = "http://localhost:3100"
	}
	c.Redirect(http.StatusTemporaryRedirect, frontURL+"/auth/callback#token="+signed)
}

type middlewareClaims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

func jsonDecode(r io.Reader, v interface{}) error {
	return json.NewDecoder(r).Decode(v)
}
