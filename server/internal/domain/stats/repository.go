package stats

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RepoRepository interface {
	Upsert(ctx context.Context, userID uuid.UUID, repos []RepoRow) error
	ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]RepoRow, error)
	GetByUserAndGitHubID(ctx context.Context, userID uuid.UUID, githubID int64) (*uuid.UUID, error)
}

type ContributionRepository interface {
	Upsert(ctx context.Context, userID uuid.UUID, date string, count int, repoID *uuid.UUID) error
	GetByUserDateRange(ctx context.Context, userID uuid.UUID, from, to string) ([]ContributionRow, error)
}

type DailyStatsRepository interface {
	Upsert(ctx context.Context, row DailyStatsRow) error
	GetByUserDateRange(ctx context.Context, userID uuid.UUID, from, to string) ([]DailyStatsRow, error)
}

type RepoRow struct {
	GitHubID    int64
	Name        string
	FullName    string
	Description string
	Stars       int
	Forks       int
	Language    string
	IsPrivate   bool
}

type ContributionRow struct {
	Date  string
	Count int
	RepoID *uuid.UUID
}

type DailyStatsRow struct {
	UserID        uuid.UUID
	Date          string
	Commits       int
	PRs           int
	Issues        int
	StarsReceived int
}

type repoRepo struct {
	pool *pgxpool.Pool
}

func NewRepoRepository(pool *pgxpool.Pool) RepoRepository {
	return &repoRepo{pool: pool}
}

func (r *repoRepo) Upsert(ctx context.Context, userID uuid.UUID, repos []RepoRow) error {
	for _, repo := range repos {
		query := `INSERT INTO repositories (user_id, github_id, name, full_name, description, stars, forks, language, is_private, last_updated)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
			ON CONFLICT (user_id, github_id) DO UPDATE SET
				name = EXCLUDED.name, full_name = EXCLUDED.full_name, description = EXCLUDED.description,
				stars = EXCLUDED.stars, forks = EXCLUDED.forks, language = EXCLUDED.language,
				is_private = EXCLUDED.is_private, last_updated = NOW()`
		_, err := r.pool.Exec(ctx, query,
			userID, repo.GitHubID, repo.Name, repo.FullName, repo.Description,
			repo.Stars, repo.Forks, repo.Language, repo.IsPrivate,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *repoRepo) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]RepoRow, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `SELECT github_id, name, full_name, COALESCE(description,''), stars, forks, COALESCE(language,''), is_private
		FROM repositories WHERE user_id = $1 ORDER BY stars DESC, forks DESC LIMIT $2`
	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []RepoRow
	for rows.Next() {
		var row RepoRow
		err := rows.Scan(&row.GitHubID, &row.Name, &row.FullName, &row.Description, &row.Stars, &row.Forks, &row.Language, &row.IsPrivate)
		if err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}

func (r *repoRepo) GetByUserAndGitHubID(ctx context.Context, userID uuid.UUID, githubID int64) (*uuid.UUID, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, "SELECT id FROM repositories WHERE user_id = $1 AND github_id = $2", userID, githubID).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

type contribRepo struct {
	pool *pgxpool.Pool
}

func NewContributionRepository(pool *pgxpool.Pool) ContributionRepository {
	return &contribRepo{pool: pool}
}

func (r *contribRepo) Upsert(ctx context.Context, userID uuid.UUID, date string, count int, repoID *uuid.UUID) error {
	query := `INSERT INTO contributions (user_id, date, count, repo_id) VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, date, repo_id) DO UPDATE SET count = EXCLUDED.count`
	_, err := r.pool.Exec(ctx, query, userID, date, count, repoID)
	return err
}

func (r *contribRepo) GetByUserDateRange(ctx context.Context, userID uuid.UUID, from, to string) ([]ContributionRow, error) {
	query := `SELECT date::text, COALESCE(SUM(count), 0) FROM contributions
		WHERE user_id = $1 AND date >= $2::date AND date <= $3::date
		GROUP BY date ORDER BY date`
	rows, err := r.pool.Query(ctx, query, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []ContributionRow
	for rows.Next() {
		var row ContributionRow
		var cnt int
		if err := rows.Scan(&row.Date, &cnt); err != nil {
			return nil, err
		}
		row.Count = cnt
		result = append(result, row)
	}
	return result, nil
}

type dailyStatsRepo struct {
	pool *pgxpool.Pool
}

func NewDailyStatsRepository(pool *pgxpool.Pool) DailyStatsRepository {
	return &dailyStatsRepo{pool: pool}
}

func (r *dailyStatsRepo) Upsert(ctx context.Context, row DailyStatsRow) error {
	query := `INSERT INTO daily_stats (user_id, date, commits, prs, issues, stars_received)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, date) DO UPDATE SET
			commits = EXCLUDED.commits, prs = EXCLUDED.prs, issues = EXCLUDED.issues, stars_received = EXCLUDED.stars_received`
	_, err := r.pool.Exec(ctx, query, row.UserID, row.Date, row.Commits, row.PRs, row.Issues, row.StarsReceived)
	return err
}

func (r *dailyStatsRepo) GetByUserDateRange(ctx context.Context, userID uuid.UUID, from, to string) ([]DailyStatsRow, error) {
	query := `SELECT user_id, date::text, commits, prs, issues, stars_received
		FROM daily_stats WHERE user_id = $1 AND date >= $2::date AND date <= $3::date ORDER BY date`
	rows, err := r.pool.Query(ctx, query, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []DailyStatsRow
	for rows.Next() {
		var row DailyStatsRow
		if err := rows.Scan(&row.UserID, &row.Date, &row.Commits, &row.PRs, &row.Issues, &row.StarsReceived); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, nil
}
