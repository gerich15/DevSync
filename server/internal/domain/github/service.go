package github

import (
	"context"
	"time"
	"github.com/google/uuid"
	githublib "github.com/devsync/server/pkg/github"
	"github.com/devsync/server/internal/domain/stats"
	"github.com/devsync/server/internal/domain/user"
)

type SyncService interface {
	SyncUser(ctx context.Context, userID uuid.UUID) error
}

type syncService struct {
	userSvc   user.Service
	repoRepo  stats.RepoRepository
	contribRepo stats.ContributionRepository
	dailyRepo stats.DailyStatsRepository
}

func NewSyncService(
	userSvc user.Service,
	repoRepo stats.RepoRepository,
	contribRepo stats.ContributionRepository,
	dailyRepo stats.DailyStatsRepository,
) SyncService {
	return &syncService{
		userSvc:     userSvc,
		repoRepo:    repoRepo,
		contribRepo: contribRepo,
		dailyRepo:   dailyRepo,
	}
}

func (s *syncService) SyncUser(ctx context.Context, userID uuid.UUID) error {
	u, err := s.userSvc.GetByIDWithToken(ctx, userID)
	if err != nil {
		return err
	}
	client := githublib.NewClient(u.AccessToken)
	if u.AccessToken == "" {
		return nil
	}

	// Fetch repos
	var allRepos []stats.RepoRow
	for page := 1; ; page++ {
		repos, err := client.GetUserRepos(ctx, page)
		if err != nil {
			return err
		}
		if len(repos) == 0 {
			break
		}
		for _, r := range repos {
			desc := ""
			if r.Description != nil {
				desc = *r.Description
			}
			lang := ""
			if r.Language != nil {
				lang = *r.Language
			}
			allRepos = append(allRepos, stats.RepoRow{
				GitHubID:    r.ID,
				Name:        r.Name,
				FullName:    r.FullName,
				Description: desc,
				Stars:       r.Stargazers,
				Forks:       r.Forks,
				Language:    lang,
				IsPrivate:   r.Private,
			})
		}
		if len(repos) < 100 {
			break
		}
	}
	if err := s.repoRepo.Upsert(ctx, userID, allRepos); err != nil {
		return err
	}

	// Derive contributions from events (public events for username)
	events, err := client.GetUserEvents(ctx, u.Username, 1)
	if err == nil {
		byDate := make(map[string]int)
		for _, e := range events {
			t, err := time.Parse(time.RFC3339, e.CreatedAt)
			if err != nil {
				continue
			}
			date := t.Format("2006-01-02")
			switch e.Type {
			case "PushEvent":
				byDate[date] += e.Payload.Size
				if byDate[date] == 0 {
					byDate[date] = 1
				}
			case "PullRequestEvent", "IssuesEvent":
				byDate[date]++
			default:
				// optional: count other events
			}
		}
		for date, count := range byDate {
			_ = s.contribRepo.Upsert(ctx, userID, date, count, nil)
		}
	}

	_ = s.userSvc.UpdateLastSynced(ctx, userID)
	return nil
}
