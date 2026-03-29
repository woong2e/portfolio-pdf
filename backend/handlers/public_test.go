package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
)

func TestViewPortfolio_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/view/nonexistent", nil)
	c.Params = gin.Params{{Key: "id", Value: "nonexistent"}}

	ViewPortfolio(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("응답 코드 %d, 기대값 404", w.Code)
	}
}

func TestDownloadPortfolio_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/portfolio/nonexistent/download", nil)
	c.Params = gin.Params{{Key: "id", Value: "nonexistent"}}

	DownloadPortfolio(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("응답 코드 %d, 기대값 404", w.Code)
	}
}

func TestViewPortfolio_ShortIDLookup(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	// 16자 ShortID로 조회 시 존재하지 않으면 404를 반환해야 함
	shortID := "abc1234567890123" // 16자
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/view/"+shortID, nil)
	c.Params = gin.Params{{Key: "id", Value: shortID}}

	ViewPortfolio(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("응답 코드 %d, 기대값 404", w.Code)
	}
}

func TestGetPublicSettings_Empty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/settings", nil)

	GetPublicSettings(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	var result map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("설정 수 %d, 기대값 0", len(result))
	}
}

func TestGetPublicSettings_WithData(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	database.DB.Create(&models.Setting{Key: "github_link", Value: "https://github.com/testuser", UpdatedAt: time.Now()})
	database.DB.Create(&models.Setting{Key: "linkedin_link", Value: "https://linkedin.com/in/testuser", UpdatedAt: time.Now()})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/settings", nil)

	GetPublicSettings(c)

	if w.Code != http.StatusOK {
		t.Errorf("응답 코드 %d, 기대값 200", w.Code)
	}

	var result map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if result["github_link"] != "https://github.com/testuser" {
		t.Errorf("github_link %q, 기대값 %q", result["github_link"], "https://github.com/testuser")
	}
	if result["linkedin_link"] != "https://linkedin.com/in/testuser" {
		t.Errorf("linkedin_link %q, 기대값 %q", result["linkedin_link"], "https://linkedin.com/in/testuser")
	}
}

func TestGetPublicSettings_EmptyValueKey(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)

	// 빈 값으로 저장된 키도 응답에 포함돼야 함
	database.DB.Create(&models.Setting{Key: "github_link", Value: "", UpdatedAt: time.Now()})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/settings", nil)

	GetPublicSettings(c)

	var result map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("응답 파싱 실패: %v", err)
	}
	if _, ok := result["github_link"]; !ok {
		t.Error("빈 값 키 github_link 가 응답에 없음")
	}
}
