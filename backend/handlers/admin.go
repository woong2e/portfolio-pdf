package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
)

const portfolioDir = "/data/portfolios"

func init() {
	// Create portfolio directory if it doesn't exist (local dev fallback)
	os.MkdirAll(portfolioDir, os.ModePerm)
	// Fallback to local ./data/portfolios if /data is not writable/exists
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
	id := c.Param("uuid")
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

	id := uuid.New().String()
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
		FilePath:         filePath,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := database.DB.Create(&portfolio).Error; err != nil {
		// Clean up file if db commit fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save to database"})
		return
	}

	c.JSON(http.StatusCreated, portfolio)
}

func UpdatePortfolio(c *gin.Context) {
	id := c.Param("uuid")
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
		// New file uploaded
		oldPath := portfolio.FilePath
		filePath := filepath.Join(getStoragePath(), fmt.Sprintf("%s.pdf", id))
		
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save new file"})
			return
		}
		
		// Wait, filePath is logically the same, but we update the original name
		portfolio.OriginalFileName = file.Filename
		portfolio.FilePath = filePath

		// Assuming local storage, it will overwrite the file.
		// If custom storage is used later, we would delete the old file if filenames were different.
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
	id := c.Param("uuid")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	// Delete file
	os.Remove(portfolio.FilePath)

	// Delete db record
	if err := database.DB.Delete(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete from database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Portfolio deleted successfully"})
}
