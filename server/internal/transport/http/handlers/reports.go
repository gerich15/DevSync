package handlers

import (
	"context"
	"fmt"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/devsync/server/internal/domain/user"
	"github.com/devsync/server/internal/domain/models"
	"github.com/devsync/server/pkg/pdf"
)

type ReportsHandler struct {
	userSvc  user.Service
	statsSvc reportsStatsService
	pdfGen   *pdf.Generator
}

type reportsStatsService interface {
	GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error)
}

func NewReportsHandler(userSvc user.Service, statsSvc reportsStatsService, pdfGen *pdf.Generator) *ReportsHandler {
	return &ReportsHandler{userSvc: userSvc, statsSvc: statsSvc, pdfGen: pdfGen}
}

func (h *ReportsHandler) PDF(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	u, err := h.userSvc.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	statsData, err := h.statsSvc.GetUserStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	rd := toReportData(u.Username, statsData)
	data, err := h.pdfGen.Generate(u.Username, rd)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=devsync-report.pdf")
	c.Data(http.StatusOK, "application/pdf", data)
}

func (h *ReportsHandler) Markdown(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(uuid.UUID)
	u, err := h.userSvc.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	statsData, err := h.statsSvc.GetUserStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	md := generateMarkdown(u.Username, statsData)
	c.Header("Content-Disposition", "attachment; filename=README-stats.md")
	c.Data(http.StatusOK, "text/markdown; charset=utf-8", []byte(md))
}

func toReportData(username string, s *models.UserStats) *pdf.ReportData {
	rd := &pdf.ReportData{
		Username:        username,
		TotalRepos:      s.TotalRepos,
		TotalStars:      s.TotalStars,
		TotalForks:      s.TotalForks,
		ContributionSum: s.ContributionSum,
	}
	for _, r := range s.TopRepos {
		rd.TopRepos = append(rd.TopRepos, pdf.RepoSummary{Name: r.Name, Stars: r.Stars, Forks: r.Forks, Language: r.Language})
	}
	for _, l := range s.Languages {
		rd.Languages = append(rd.Languages, pdf.LangSummary{Language: l.Language, Percent: l.Percent})
	}
	return rd
}

func generateMarkdown(username string, s *models.UserStats) string {
	md := fmt.Sprintf("# GitHub Stats — %s\n\n", username)
	md += fmt.Sprintf("- **Repositories:** %d\n", s.TotalRepos)
	md += fmt.Sprintf("- **Stars:** %d\n", s.TotalStars)
	md += fmt.Sprintf("- **Forks:** %d\n", s.TotalForks)
	md += fmt.Sprintf("- **Contributions (year):** %d\n\n", s.ContributionSum)
	md += "## Top Repositories\n\n"
	for _, r := range s.TopRepos {
		md += fmt.Sprintf("- [%s](https://github.com/%s) — ⭐ %d | 🍴 %d | %s\n", r.Name, r.FullName, r.Stars, r.Forks, r.Language)
	}
	md += "\n## Languages\n\n"
	for _, l := range s.Languages {
		md += fmt.Sprintf("- %s: %.1f%%\n", l.Language, l.Percent)
	}
	return md
}
