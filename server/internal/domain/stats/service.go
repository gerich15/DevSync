package stats

import (
	"context"
	"time"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/models"
)

type Service interface {
	GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error)
	GetUserStatsWithPeriod(ctx context.Context, userID uuid.UUID, period string) (*models.UserStats, error) // period: week, month, year
	GetContributions(ctx context.Context, userID uuid.UUID, from, to string) ([]models.ContributionDay, error)
	GetRepos(ctx context.Context, userID uuid.UUID, limit int) ([]models.Repo, error)
}

type service struct {
	repoRepo   RepoRepository
	contribRepo ContributionRepository
	dailyRepo   DailyStatsRepository
}

func NewService(
	repoRepo RepoRepository,
	contribRepo ContributionRepository,
	dailyRepo DailyStatsRepository,
) Service {
	return &service{
		repoRepo:    repoRepo,
		contribRepo: contribRepo,
		dailyRepo:   dailyRepo,
	}
}

func (s *service) GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error) {
	return s.GetUserStatsWithPeriod(ctx, userID, "year")
}

func daysForPeriod(period string) int {
	switch period {
	case "week":
		return 7
	case "month":
		return 30
	case "year":
		return 365
	default:
		return 365
	}
}

func (s *service) GetUserStatsWithPeriod(ctx context.Context, userID uuid.UUID, period string) (*models.UserStats, error) {
	to := time.Now().Format("2006-01-02")
	days := daysForPeriod(period)
	from := time.Now().AddDate(0, 0, -days).Format("2006-01-02")

	repos, err := s.repoRepo.ListByUser(ctx, userID, 100)
	if err != nil {
		return nil, err
	}
	contribs, err := s.contribRepo.GetByUserDateRange(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}
	daily, err := s.dailyRepo.GetByUserDateRange(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}
	return BuildUserStats(repos, contribs, daily, userID), nil
}

func (s *service) GetContributions(ctx context.Context, userID uuid.UUID, from, to string) ([]models.ContributionDay, error) {
	rows, err := s.contribRepo.GetByUserDateRange(ctx, userID, from, to)
	if err != nil {
		return nil, err
	}
	out := make([]models.ContributionDay, 0, len(rows))
	for _, r := range rows {
		out = append(out, models.ContributionDay{Date: r.Date, Count: r.Count})
	}
	return out, nil
}

func (s *service) GetRepos(ctx context.Context, userID uuid.UUID, limit int) ([]models.Repo, error) {
	rows, err := s.repoRepo.ListByUser(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	out := make([]models.Repo, 0, len(rows))
	for _, r := range rows {
		out = append(out, models.Repo{
			UserID: userID, GitHubID: r.GitHubID, Name: r.Name, FullName: r.FullName,
			Description: r.Description, Stars: r.Stars, Forks: r.Forks,
			Language: r.Language, IsPrivate: r.IsPrivate,
		})
	}
	return out, nil
}
