package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("테스트 DB 연결 실패: %v", err)
	}
	if err := db.AutoMigrate(&models.Portfolio{}); err != nil {
		t.Fatalf("테스트 DB 마이그레이션 실패: %v", err)
	}
	database.DB = db
}

func seedPortfolio(t *testing.T, id, company string) models.Portfolio {
	t.Helper()
	p := models.Portfolio{
		ID:               id,
		CompanyName:      company,
		OriginalFileName: "test.pdf",
		FilePath:         id + ".pdf",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	if err := database.DB.Create(&p).Error; err != nil {
		t.Fatalf("시드 데이터 삽입 실패: %v", err)
	}
	return p
}

func TestGetPortfolios_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/portfolios", nil)

	GetPortfolios(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	var result []models.Portfolio
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("포트폴리오 수 %d, 기대값 0", len(result))
	}
}

func TestGetPortfolios_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seedPortfolio(t, "abc1234567890123", "테스트회사A")
	seedPortfolio(t, "xyz9876543210987", "테스트회사B")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/portfolios", nil)

	GetPortfolios(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	var result []models.Portfolio
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("포트폴리오 수 %d, 기대값 2", len(result))
	}
}

func TestGetPortfolio_Found(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seeded := seedPortfolio(t, "abc1234567890123", "테스트회사")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/portfolio/"+seeded.ID, nil)
	c.Params = gin.Params{{Key: "id", Value: seeded.ID}}

	GetPortfolio(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	var result models.Portfolio
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if result.ID != seeded.ID {
		t.Errorf("반환된 ID %q, 기대값 %q", result.ID, seeded.ID)
	}
}

func TestGetPortfolio_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/portfolio/nonexistent", nil)
	c.Params = gin.Params{{Key: "id", Value: "nonexistent"}}

	GetPortfolio(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("응답 코드 %d, 기대값 404", w.Code)
	}
}

func TestCreatePortfolio_ShortID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("company_name", "테스트회사")
	fw, _ := w.CreateFormFile("file", "test.pdf")
	fw.Write([]byte("%PDF-1.4 test content"))
	w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/admin/portfolio", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	CreatePortfolio(c)

	if rec.Code != http.StatusCreated {
		t.Errorf("응답 코드 %d, 기대값 201. 응답: %s", rec.Code, rec.Body.String())
	}

	var result models.Portfolio
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}

	// 핵심: ID가 16자인지 확인 (UUID 36자보다 짧음)
	const expectedIDLength = 16
	if len(result.ID) != expectedIDLength {
		t.Errorf("생성된 ID 길이 %d, 기대값 %d (UUID 대비 짧아야 함)", len(result.ID), expectedIDLength)
	}
}

func TestCreatePortfolio_MissingCompanyName(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, _ := w.CreateFormFile("file", "test.pdf")
	fw.Write([]byte("%PDF-1.4 test"))
	w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/admin/portfolio", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	CreatePortfolio(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("응답 코드 %d, 기대값 400", rec.Code)
	}
}

func TestCreatePortfolio_MissingFile(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("company_name", "테스트회사")
	w.Close()

	req := httptest.NewRequest(http.MethodPost, "/api/admin/portfolio", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = req

	CreatePortfolio(c)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("응답 코드 %d, 기대값 400", rec.Code)
	}
}

func TestDeletePortfolio_Found(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seeded := seedPortfolio(t, "abc1234567890123", "삭제테스트")

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/api/admin/portfolio/"+seeded.ID, nil)
	c.Params = gin.Params{{Key: "id", Value: seeded.ID}}

	DeletePortfolio(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	// DB에서도 삭제됐는지 확인
	var p models.Portfolio
	err := database.DB.First(&p, "id = ?", seeded.ID).Error
	if err == nil {
		t.Error("삭제 후에도 DB에 레코드가 남아 있음")
	}
}

func TestDeletePortfolio_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/api/admin/portfolio/nonexistent", nil)
	c.Params = gin.Params{{Key: "id", Value: "nonexistent"}}

	DeletePortfolio(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("응답 코드 %d, 기대값 404", w.Code)
	}
}
