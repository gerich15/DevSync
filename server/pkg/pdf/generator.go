package pdf

import (
	"bytes"
	"fmt"
	"github.com/jung-kurt/gofpdf"
)

type ReportData struct {
	Username        string
	TotalRepos      int
	TotalStars      int
	TotalForks      int
	ContributionSum int
	TopRepos        []RepoSummary
	Languages       []LangSummary
}

type RepoSummary struct {
	Name      string
	Stars     int
	Forks     int
	Language  string
}

type LangSummary struct {
	Language string
	Percent  float64
}

type Generator struct{}

func NewGenerator() *Generator {
	return &Generator{}
}

func (g *Generator) Generate(username string, data interface{}) ([]byte, error) {
	rd, ok := data.(*ReportData)
	if !ok {
		return nil, fmt.Errorf("invalid report data")
	}
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "DevSync Report: "+rd.Username, "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 12)
	pdf.Ln(5)
	pdf.CellFormat(0, 8, fmt.Sprintf("Total Repositories: %d", rd.TotalRepos), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 8, fmt.Sprintf("Total Stars: %d", rd.TotalStars), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 8, fmt.Sprintf("Total Forks: %d", rd.TotalForks), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 8, fmt.Sprintf("Contributions (year): %d", rd.ContributionSum), "", 1, "L", false, 0, "")
	pdf.Ln(5)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 8, "Top Repositories", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	for _, r := range rd.TopRepos {
		pdf.CellFormat(0, 6, fmt.Sprintf("- %s (stars: %d, forks: %d) [%s]", r.Name, r.Stars, r.Forks, r.Language), "", 1, "L", false, 0, "")
	}
	pdf.Ln(3)
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 8, "Languages", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	for _, l := range rd.Languages {
		pdf.CellFormat(0, 6, fmt.Sprintf("- %s: %.1f%%", l.Language, l.Percent), "", 1, "L", false, 0, "")
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
