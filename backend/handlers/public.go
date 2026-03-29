package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/woong/portfolio-pdf/backend/database"
	"github.com/woong/portfolio-pdf/backend/models"
)

func ViewPortfolio(c *gin.Context) {
	id := c.Param("id")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("Content-Type", "application/pdf")
	c.File(filepath.Join(getStoragePath(), filepath.Base(portfolio.FilePath)))
}

func GetPublicSettings(c *gin.Context) {
	var settings []models.Setting
	if err := database.DB.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}
	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}
	c.JSON(http.StatusOK, result)
}

func DownloadPortfolio(c *gin.Context) {
	id := c.Param("id")
	var portfolio models.Portfolio

	if err := database.DB.Where("id = ?", id).First(&portfolio).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", portfolio.OriginalFileName))
	c.Header("Content-Type", "application/pdf")
	c.File(filepath.Join(getStoragePath(), filepath.Base(portfolio.FilePath)))
}
