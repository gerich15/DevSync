package user

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, u *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByIDWithToken(ctx context.Context, id uuid.UUID) (*User, error) // internal: for sync
	GetByGitHubID(ctx context.Context, githubID int64) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	ListIDsWithToken(ctx context.Context) ([]uuid.UUID, error) // для worker
	Update(ctx context.Context, u *User) error
	UpdateTokens(ctx context.Context, id uuid.UUID, accessToken, refreshToken string) error
	UpdateLastSynced(ctx context.Context, id uuid.UUID) error
}

type User struct {
	ID           uuid.UUID  `json:"id"`
	GitHubID     int64      `json:"github_id"`
	Username     string     `json:"username"`
	Email        *string    `json:"email,omitempty"`
	AvatarURL    *string    `json:"avatar_url,omitempty"`
	AccessToken  string     `json:"-"`
	RefreshToken *string    `json:"-"`
	LastSyncedAt *string    `json:"last_synced_at,omitempty"`
	CreatedAt    string     `json:"created_at"`
	UpdatedAt    string     `json:"updated_at"`
}

type repo struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &repo{pool: pool}
}

func (r *repo) Create(ctx context.Context, u *User) error {
	query := `INSERT INTO users (id, github_id, username, email, avatar_url, access_token, refresh_token)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (github_id) DO UPDATE SET
			username = EXCLUDED.username,
			email = EXCLUDED.email,
			avatar_url = EXCLUDED.avatar_url,
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			updated_at = NOW()
		RETURNING id, created_at::text, updated_at::text`
	return r.pool.QueryRow(ctx, query,
		u.ID, u.GitHubID, u.Username, u.Email, u.AvatarURL, u.AccessToken, u.RefreshToken,
	).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
}

func (r *repo) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `SELECT id, github_id, username, email, avatar_url, last_synced_at::text, created_at::text, updated_at::text
		FROM users WHERE id = $1`
	u := &User{}
	var email, avatar, lastSynced *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.GitHubID, &u.Username, &email, &avatar, &lastSynced, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.Email = email
	u.AvatarURL = avatar
	u.LastSyncedAt = lastSynced
	return u, nil
}

func (r *repo) GetByIDWithToken(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `SELECT id, github_id, username, email, avatar_url, access_token, refresh_token, last_synced_at::text, created_at::text, updated_at::text
		FROM users WHERE id = $1`
	u := &User{}
	var email, avatar, refresh, lastSynced *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.GitHubID, &u.Username, &email, &avatar, &u.AccessToken, &refresh, &lastSynced, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.Email = email
	u.AvatarURL = avatar
	u.RefreshToken = refresh
	u.LastSyncedAt = lastSynced
	return u, nil
}

func (r *repo) GetByGitHubID(ctx context.Context, githubID int64) (*User, error) {
	query := `SELECT id, github_id, username, email, avatar_url, access_token, refresh_token, last_synced_at::text, created_at::text, updated_at::text
		FROM users WHERE github_id = $1`
	u := &User{}
	var email, avatar, refresh *string
	var lastSynced *string
	err := r.pool.QueryRow(ctx, query, githubID).Scan(
		&u.ID, &u.GitHubID, &u.Username, &email, &avatar, &u.AccessToken, &refresh, &lastSynced, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.Email = email
	u.AvatarURL = avatar
	u.RefreshToken = refresh
	u.LastSyncedAt = lastSynced
	return u, nil
}

func (r *repo) ListIDsWithToken(ctx context.Context) ([]uuid.UUID, error) {
	query := `SELECT id FROM users WHERE access_token IS NOT NULL AND access_token != ''`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (r *repo) GetByUsername(ctx context.Context, username string) (*User, error) {
	query := `SELECT id, github_id, username, email, avatar_url, last_synced_at::text, created_at::text, updated_at::text
		FROM users WHERE username = $1`
	u := &User{}
	var email, avatar, lastSynced *string
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&u.ID, &u.GitHubID, &u.Username, &email, &avatar, &lastSynced, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	u.Email = email
	u.AvatarURL = avatar
	u.LastSyncedAt = lastSynced
	return u, nil
}

func (r *repo) Update(ctx context.Context, u *User) error {
	query := `UPDATE users SET username=$2, email=$3, avatar_url=$4, updated_at=NOW() WHERE id=$1`
	_, err := r.pool.Exec(ctx, query, u.ID, u.Username, u.Email, u.AvatarURL)
	return err
}

func (r *repo) UpdateTokens(ctx context.Context, id uuid.UUID, accessToken, refreshToken string) error {
	query := `UPDATE users SET access_token=$2, refresh_token=$3, updated_at=NOW() WHERE id=$1`
	_, err := r.pool.Exec(ctx, query, id, accessToken, &refreshToken)
	return err
}

func (r *repo) UpdateLastSynced(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE users SET last_synced_at=NOW(), updated_at=NOW() WHERE id=$1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
