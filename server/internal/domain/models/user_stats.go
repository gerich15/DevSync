package models

import "github.com/google/uuid"

type UserStats struct {
	TotalRepos       int                `json:"total_repos"`
	TotalStars       int                `json:"total_stars"`
	TotalForks       int                `json:"total_forks"`
	Contributions    []ContributionDay  `json:"contributions"`
	Languages        []LanguageStats    `json:"languages"`
	TopRepos         []Repo             `json:"top_repos"`
	DailyStats       []DailyStats       `json:"daily_stats"`
	ContributionSum  int                `json:"contribution_sum"`
}

type Repo struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	GitHubID    int64     `json:"github_id"`
	Name        string    `json:"name"`
	FullName    string    `json:"full_name"`
	Description string    `json:"description"`
	Stars       int       `json:"stars"`
	Forks       int       `json:"forks"`
	Language    string    `json:"language"`
	IsPrivate   bool      `json:"is_private"`
}

type ContributionDay struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type LanguageStats struct {
	Language string  `json:"language"`
	Bytes    int64   `json:"bytes"`
	Percent  float64 `json:"percent"`
}

type DailyStats struct {
	UserID         uuid.UUID `json:"user_id"`
	Date           string    `json:"date"`
	Commits        int       `json:"commits"`
	PRs            int       `json:"prs"`
	Issues         int       `json:"issues"`
	StarsReceived  int       `json:"stars_received"`
}
