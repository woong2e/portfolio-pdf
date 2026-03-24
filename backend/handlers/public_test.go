package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
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
