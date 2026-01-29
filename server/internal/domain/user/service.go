package user

import (
	"context"
	"github.com/google/uuid"
)

type Service interface {
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByIDWithToken(ctx context.Context, id uuid.UUID) (*User, error)
	GetByGitHubID(ctx context.Context, githubID int64) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	ListIDsWithToken(ctx context.Context) ([]uuid.UUID, error)
	CreateOrUpdate(ctx context.Context, u *User) error
	UpdateLastSynced(ctx context.Context, id uuid.UUID) error
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *service) GetByIDWithToken(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByIDWithToken(ctx, id)
}

func (s *service) GetByGitHubID(ctx context.Context, githubID int64) (*User, error) {
	return s.repo.GetByGitHubID(ctx, githubID)
}

func (s *service) GetByUsername(ctx context.Context, username string) (*User, error) {
	return s.repo.GetByUsername(ctx, username)
}

func (s *service) ListIDsWithToken(ctx context.Context) ([]uuid.UUID, error) {
	return s.repo.ListIDsWithToken(ctx)
}

func (s *service) CreateOrUpdate(ctx context.Context, u *User) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return s.repo.Create(ctx, u)
}

func (s *service) UpdateLastSynced(ctx context.Context, id uuid.UUID) error {
	return s.repo.UpdateLastSynced(ctx, id)
}
