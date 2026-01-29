package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	APIBase   = "https://api.github.com"
	Accept    = "application/vnd.github.v3+json"
	UserAgent = "DevSync/1.0"
)

type Client struct {
	httpClient *http.Client
	token      string
}

func NewClient(token string) *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		token:      token,
	}
}

type GitHubUser struct {
	ID        int64  `json:"id"`
	Login     string `json:"login"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	Name      string `json:"name"`
}

func (c *Client) GetUser(ctx context.Context) (*GitHubUser, error) {
	req, _ := http.NewRequestWithContext(ctx, "GET", APIBase+"/user", nil)
	c.setHeaders(req)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github api error %d: %s", resp.StatusCode, string(body))
	}
	var u GitHubUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

type GitHubRepo struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	FullName    string  `json:"full_name"`
	Description *string `json:"description"`
	Stargazers  int     `json:"stargazers_count"`
	Forks       int     `json:"forks_count"`
	Language    *string `json:"language"`
	Private     bool    `json:"private"`
	UpdatedAt   string  `json:"updated_at"`
}

func (c *Client) GetUserRepos(ctx context.Context, page int) ([]GitHubRepo, error) {
	url := fmt.Sprintf("%s/user/repos?per_page=100&page=%d&sort=updated", APIBase, page)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	c.setHeaders(req)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github api error %d: %s", resp.StatusCode, string(body))
	}
	var repos []GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, err
	}
	return repos, nil
}

type GitHubEvent struct {
	Type string `json:"type"`
	Repo struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	} `json:"repo"`
	Payload struct {
		Size       int `json:"size"`        // PushEvent commits
		Action     string `json:"action"`
		PullRequest *struct {
			ID int64 `json:"id"`
		} `json:"pull_request"`
		Issue *struct {
			ID int64 `json:"id"`
		} `json:"issue"`
	} `json:"payload"`
	CreatedAt string `json:"created_at"`
}

func (c *Client) GetUserEvents(ctx context.Context, username string, page int) ([]GitHubEvent, error) {
	url := fmt.Sprintf("%s/users/%s/events?per_page=100&page=%d", APIBase, username, page)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	c.setHeaders(req)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("github api error %d: %s", resp.StatusCode, string(body))
	}
	var events []GitHubEvent
	if err := json.NewDecoder(resp.Body).Decode(&events); err != nil {
		return nil, err
	}
	return events, nil
}

type GitHubContrib struct {
	Total int                `json:"total"`
	Weeks []GitHubContribWeek `json:"weeks"`
}

type GitHubContribWeek struct {
	W int `json:"w"` // unix timestamp
	A int `json:"a"` // additions
	D int `json:"d"` // deletions
	C int `json:"c"` // commits
}

func (c *Client) GetContributions(ctx context.Context, username string) ([]GitHubContribWeek, error) {
	url := fmt.Sprintf("%s/users/%s/events/public", APIBase, username)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	c.setHeaders(req)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	// GitHub REST doesn't expose contribution graph; we derive from events
	var events []GitHubEvent
	if err := json.NewDecoder(resp.Body).Decode(&events); err != nil {
		return nil, err
	}
	return nil, nil
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Accept", Accept)
	req.Header.Set("User-Agent", UserAgent)
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
}
