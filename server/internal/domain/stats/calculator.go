package stats

import (
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/models"
)

func CalculateLanguageStats(repos []models.Repo) []models.LanguageStats {
	total := int64(0)
	m := make(map[string]int64)
	for _, r := range repos {
		if r.Language == "" {
			continue
		}
		bytes := int64(1)
		m[r.Language] += bytes
		total += bytes
	}
	var out []models.LanguageStats
	for lang, b := range m {
		pct := 0.0
		if total > 0 {
			pct = float64(b) / float64(total) * 100
		}
		out = append(out, models.LanguageStats{Language: lang, Bytes: b, Percent: pct})
	}
	return out
}

func BuildUserStats(
	repos []RepoRow,
	contribs []ContributionRow,
	daily []DailyStatsRow,
	userID uuid.UUID,
) *models.UserStats {
	totalStars := 0
	totalForks := 0
	var topRepos []models.Repo
	for i, r := range repos {
		if i >= 10 {
			break
		}
		topRepos = append(topRepos, models.Repo{
			UserID: userID, GitHubID: r.GitHubID, Name: r.Name, FullName: r.FullName,
			Description: r.Description, Stars: r.Stars, Forks: r.Forks,
			Language: r.Language, IsPrivate: r.IsPrivate,
		})
	}
	for _, r := range repos {
		totalStars += r.Stars
		totalForks += r.Forks
	}

	var contribDays []models.ContributionDay
	sum := 0
	for _, c := range contribs {
		contribDays = append(contribDays, models.ContributionDay{Date: c.Date, Count: c.Count})
		sum += c.Count
	}

	var dailyStats []models.DailyStats
	for _, d := range daily {
		dailyStats = append(dailyStats, models.DailyStats{
			UserID: d.UserID, Date: d.Date, Commits: d.Commits,
			PRs: d.PRs, Issues: d.Issues, StarsReceived: d.StarsReceived,
		})
	}

	langRepos := make([]models.Repo, 0, len(repos))
	for _, r := range repos {
		langRepos = append(langRepos, models.Repo{
			UserID: userID, GitHubID: r.GitHubID, Name: r.Name, FullName: r.FullName,
			Description: r.Description, Stars: r.Stars, Forks: r.Forks,
			Language: r.Language, IsPrivate: r.IsPrivate,
		})
	}
	languages := CalculateLanguageStats(langRepos)

	return &models.UserStats{
		TotalRepos:      len(repos),
		TotalStars:      totalStars,
		TotalForks:      totalForks,
		Contributions:   contribDays,
		Languages:       languages,
		TopRepos:        topRepos,
		DailyStats:      dailyStats,
		ContributionSum: sum,
	}
}
