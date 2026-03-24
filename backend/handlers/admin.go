package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
	"github.com/woong/portfolio-pdf/backend/utils"
)

const portfolioDir = "/data/portfolios"

func init() {
	// 포트폴리오 디렉토리가 없으면 생성합니다 (로컬 개발 시 폴백 역할)
	os.MkdirAll(portfolioDir, os.ModePerm)
	// Docker 볼륨 마운트가 실패하거나 없는 경우 로컬 ./data/portfolios 로 폴백
	if _, err := os.Stat(portfolioDir); os.IsNotExist(err) || os.MkdirAll(portfolioDir, os.ModePerm) != nil {
		os.MkdirAll("./data/portfolios", os.ModePerm)
	}
}

func getStoragePath() string {
	if _, err := os.Stat(portfolioDir); err == nil {
		return portfolioDir
	}
	return "./data/portfolios"
}

func GetPortfolios(c *gin.Context) {
	var portfolios []models.Portfolio
	if err := database.DB.Order("created_at desc").Find(&portfolios).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch portfolios"})
		return
	}
	c.JSON(http.StatusOK, portfolios)
}

func GetPortfolio(c *gin.Context) {
	id := c.Param("id")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}
	c.JSON(http.StatusOK, portfolio)
}

func CreatePortfolio(c *gin.Context) {
	companyName := c.PostForm("company_name")
	if companyName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company_name is required"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	id := utils.GenerateShortID(16)
	originalFileName := file.Filename
	filePath := filepath.Join(getStoragePath(), fmt.Sprintf("%s.pdf", id))

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	portfolio := models.Portfolio{
		ID:               id,
		CompanyName:      companyName,
		OriginalFileName: originalFileName,
		FilePath:         fmt.Sprintf("%s.pdf", id),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := database.DB.Create(&portfolio).Error; err != nil {
		// DB 저장 실패 시 업로드된 파일 삭제 처리
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save to database"})
		return
	}

	c.JSON(http.StatusCreated, portfolio)
}

func UpdatePortfolio(c *gin.Context) {
	id := c.Param("id")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	companyName := c.PostForm("company_name")
	if companyName != "" {
		portfolio.CompanyName = companyName
	}

	file, err := c.FormFile("file")
	if err == nil {
		// 새로운 파일이 업로드된 경우의 처리
		oldPath := portfolio.FilePath
		filePath := filepath.Join(getStoragePath(), fmt.Sprintf("%s.pdf", id))
		
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save new file"})
			return
		}
		
		// 실제 파일 경로는 동일하지만(id 기반), 명시적으로 파일명 업데이트
		portfolio.OriginalFileName = file.Filename
		portfolio.FilePath = fmt.Sprintf("%s.pdf", id)

		// 로컬 스토리지의 경우 같은 파일 경로면 자동으로 덮어씁니다.
		// 만약 파일 경로가 물리적으로 변했다면 이전 파일을 삭제합니다.
		if oldPath != filePath {
			os.Remove(oldPath)
		}
	}

	portfolio.UpdatedAt = time.Now()

	if err := database.DB.Save(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update database"})
		return
	}

	c.JSON(http.StatusOK, portfolio)
}

func DeletePortfolio(c *gin.Context) {
	id := c.Param("id")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	// 로컬 디스크에서 파일 완전 삭제
	os.Remove(filepath.Join(getStoragePath(), filepath.Base(portfolio.FilePath)))

	// DB 레코드 삭제
	if err := database.DB.Delete(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Portfolio deleted successfully"})
}
